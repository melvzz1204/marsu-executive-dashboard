/**
 * Chat Controller — SSE Agent Loop
 * --------------------------------
 * POST /api/v1/chat
 * Body: { message: string, history?: [{role, content}] }
 * Response: text/event-stream
 *
 * Event contract (one JSON object per SSE `data:` line):
 *   {"type":"meta","conversationId":"..."}
 *   {"type":"delta","text":"..."}                      ← streamed answer tokens
 *   {"type":"tool","name":"getEnrollmentTrend"}        ← UI can show "querying data..."
 *   {"type":"done"}
 *   {"type":"error","message":"..."}
 *
 * The agent loop: stream from the LLM → if it requests tools, execute them
 * (role-scoped) and feed results back → repeat until a final text answer or
 * the tool-hop cap is reached.
 */
const crypto = require("crypto");
const { streamChat, maxToolHops } = require("../../services/chat/llmProvider");
const { buildSystemPrompt } = require("../../services/chat/promptBuilder");
const {
  getToolDefinitions,
  executeTool,
} = require("../../services/chat/toolRegistry");

const MAX_HISTORY_MESSAGES = 10; // 5 user + 5 assistant turns
const MAX_MESSAGE_LENGTH = 2000;

/** Safely write one SSE frame; returns false when the client is gone. */
function writeEvent(res, payload) {
  if (res.writableEnded) return false;
  try {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    // Flush immediately so the frame is pushed through any proxy (nginx,
    // Render, etc.) without waiting for the OS TCP buffer to fill.
    if (typeof res.flush === "function") res.flush();
    return true;
  } catch {
    return false;
  }
}

/** Normalize client-supplied history into safe OpenAI message objects. */
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_LENGTH),
    }));
}

exports.streamChatResponse = async (req, res, next) => {
  const { message } = req.body || {};
  const user = req.user; // populated by `protect` middleware

  // ---- Validation -------------------------------------------------------
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "A non-empty 'message' field is required.",
    });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Message exceeds the ${MAX_MESSAGE_LENGTH}-character limit.`,
    });
  }

  // ---- SSE headers ------------------------------------------------------
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // Disable response buffering (Render/nginx proxies).
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const conversationId = crypto.randomUUID();
  writeEvent(res, { type: "meta", conversationId });

  // Abort the upstream LLM call if the client disconnects mid-stream.
  const clientClosed = new Promise((resolve) => {
    res.on("close", () => resolve(true));
  });

  // ---- Build message list ------------------------------------------------
  const tools = getToolDefinitions(user.role);
  const messages = [
    { role: "system", content: buildSystemPrompt(user) },
    ...sanitizeHistory(req.body.history),
    { role: "user", content: message.trim() },
  ];

  try {
    let hops = 0;
    let finalText = "";

    // ---- Agent loop -------------------------------------------------------
    while (hops <= maxToolHops) {
      let toolCalls = null;

      // Stream this round; forward text deltas to the client immediately.
      for await (const event of streamChat({ messages, tools })) {
        if (event.type === "delta") {
          finalText += event.text;
          if (!writeEvent(res, { type: "delta", text: event.text })) break;
        } else if (event.type === "reasoning") {
          // Forward model thinking so the UI can show activity.
          if (!writeEvent(res, { type: "reasoning", text: event.text })) break;
        } else if (event.type === "toolCalls") {
          toolCalls = event.toolCalls;
        }
        if (await Promise.race([clientClosed, Promise.resolve(false)])) {
          return; // client gone — stop everything
        }
      }

      // No tool requests → the model produced its final answer.
      if (!toolCalls || toolCalls.length === 0) {
        break;
      }

      hops += 1;
      if (hops > maxToolHops) {
        finalText +=
          "\n\n(I reached the data-lookup limit for this question — please ask a more specific question.)";
        writeEvent(res, {
          type: "delta",
          text: "\n\n(I reached the data-lookup limit for this question — please ask a more specific question.)",
        });
        break;
      }

      // Append the assistant's tool-call message, then each tool result.
      // NOTE: Gemini's OpenAI-compatible API rejects `content: null`.
      // Use an empty string instead so the message passes validation.
      messages.push({
        role: "assistant",
        content: "",
        tool_calls: toolCalls,
      });

      for (const call of toolCalls) {
        let args = {};
        try {
          args = call.function.arguments
            ? JSON.parse(call.function.arguments)
            : {};
        } catch {
          args = {};
        }

        writeEvent(res, { type: "tool", name: call.function.name });

        const result = await executeTool(call.function.name, args, user);

        // Forward the structured result so the frontend can render a
        // visual report (charts, KPI cards) alongside the text answer.
        if (result && !result.error) {
          writeEvent(res, {
            type: "report",
            name: call.function.name,
            data: result,
          });
        }

        // Tool results are DATA. Stringify with a guard so the model cannot
        // confuse result content with instructions.
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result).slice(0, 24000),
        });
      }
      // Loop continues: the model now answers using the tool results.
    }

    writeEvent(res, { type: "done" });
  } catch (error) {
    const status = error.statusCode || error.status || 0;
    console.error("[chat] agent loop failed:", {
      message: error.message,
      status,
      userId: user?.id,
      role: user?.role,
      // Gemini/OpenAI SDK may include extra detail on the error object.
      errorType: error.constructor?.name,
      errorBody: error.error?.message || error.body || undefined,
    });
    const clientMessage =
      status === 503
        ? "The AI assistant is not configured on this server. Please contact the administrator."
        : status === 500
          ? "The AI provider returned an error. Please try again in a moment."
          : status === 429
            ? "The AI service is temporarily busy due to high demand. Please wait a moment and try again."
            : "The assistant encountered an error while answering. Please try again.";
    writeEvent(res, { type: "error", message: clientMessage });
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
};
