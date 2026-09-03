/**
 * LLM Provider Adapter
 * --------------------
 * Single interface for all AI providers using the OpenAI-compatible
 * Chat Completions API. Swap providers via environment variables:
 *
 *   AI_PROVIDER=glm     → Z.ai GLM (https://api.z.ai/api/paas/v4)
 *   AI_PROVIDER=openai   → OpenAI (https://api.openai.com/v1)
 *   AI_PROVIDER=gemini   → Gemini OpenAI-compat (https://generativelanguage.googleapis.com/v1beta/openai)
 *                          Default model: gemini-3.6-flash.
 *   AI_PROVIDER=custom   → any OpenAI-compatible endpoint via AI_BASE_URL
 *
 * Exposes one method:
 *   streamChat({ messages, tools }) → async iterable of normalized chunks:
 *     { type: "delta", text }                    — assistant text token
 *     { type: "reasoning", text }                — model thinking (GLM-5.x etc.)
 *     { type: "toolCalls", toolCalls: [...] }    — complete tool call list
 */
const OpenAI = require("openai");

const PROVIDER_DEFAULTS = {
  glm: {
    baseURL: "https://api.z.ai/api/paas/v4",
    defaultModel: "glm-4.7",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-3.6-flash",
  },
  // Catch-all for any unrecognized AI_PROVIDER value (e.g. "openai compatible")
  // that still works as an OpenAI-compatible endpoint via AI_BASE_URL.
  custom: {},
};

const provider = (process.env.AI_PROVIDER || "glm").toLowerCase();
const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.custom;

if (!defaults.baseURL && !process.env.AI_BASE_URL) {
  console.warn(
    `[chat] AI_PROVIDER="${process.env.AI_PROVIDER}" is not a recognised provider. ` +
      `Set AI_BASE_URL to use a custom OpenAI-compatible endpoint, ` +
      `or change AI_PROVIDER to one of: glm, openai, gemini.`,
  );
}

if (!process.env.AI_API_KEY) {
  // Fail fast at call time rather than import time so the rest of the
  // API (and its tests) can boot without AI credentials present.
  console.warn(
    "[chat] AI_API_KEY is not set — the /api/v1/chat route will return 503.",
  );
}

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY || "missing",
  baseURL: process.env.AI_BASE_URL || defaults.baseURL,
  timeout: Number(process.env.AI_TIMEOUT_MS) || 60000,
  maxRetries: 1,
  defaultHeaders: {
    "User-Agent": process.env.AI_USER_AGENT || "roo-code/1.0",
  },
});

const model = process.env.AI_MODEL || defaults.defaultModel || "gpt-4o-mini";
const maxToolHops = Number(process.env.AI_MAX_TOOL_HOPS) || 5;

/**
 * Stream a chat completion, normalizing provider chunks into a simple
 * event stream. Tool calls are accumulated across chunks (the wire
 * format splits arguments across many deltas) and emitted once complete.
 *
 * @param {Object} params
 * @param {Array}  params.messages  OpenAI-format messages (system/user/assistant/tool)
 * @param {Array}  [params.tools]   OpenAI-format tool definitions
 * @returns {AsyncGenerator<{type: string, text?: string, toolCalls?: Array}>}
 */
async function* streamChat({ messages, tools }) {
  if (!process.env.AI_API_KEY) {
    throw Object.assign(new Error("AI provider is not configured."), {
      statusCode: 503,
    });
  }

  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        tools: tools && tools.length > 0 ? tools : undefined,
        stream: true,
        temperature: Number(process.env.AI_TEMPERATURE) || 0.2,
        max_tokens: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 1500,
      });

      // Accumulators for streamed tool calls, keyed by chunk index.
      const toolCallAcc = new Map();
      let sawToolCalls = false;
      let sawContent = false;
      let reasoningBuffer = "";

      // Stream-level inactivity timeout: if no chunk arrives within
      // STREAM_IDLE_MS we abort to avoid hanging forever (common when the
      // provider rate-limits mid-stream without closing the connection).
      const STREAM_IDLE_MS = Number(process.env.AI_STREAM_IDLE_MS) || 30000;
      let streamTimer = null;
      const resetTimer = () => {
        clearTimeout(streamTimer);
        streamTimer = setTimeout(() => {
          console.warn(
            `[chat] stream idle timeout after ${STREAM_IDLE_MS}ms — aborting`,
          );
          completion.controller?.abort();
        }, STREAM_IDLE_MS);
      };
      resetTimer();

      try {
        for await (const chunk of completion) {
          resetTimer(); // got data — restart the inactivity clock
          const choice = chunk.choices?.[0];
          if (!choice) continue;

          const delta = choice.delta || {};

          // Some reasoning models (e.g. GLM-5.x) emit their thinking via
          // reasoning_content. Forward it so the frontend can show activity
          // during the "thinking" phase.
          if (
            typeof delta.reasoning_content === "string" &&
            delta.reasoning_content.length > 0
          ) {
            reasoningBuffer += delta.reasoning_content;
            yield { type: "reasoning", text: delta.reasoning_content };
          }

          if (typeof delta.content === "string" && delta.content.length > 0) {
            sawContent = true;
            yield { type: "delta", text: delta.content };
          }

          if (Array.isArray(delta.tool_calls)) {
            sawToolCalls = true;
            for (const part of delta.tool_calls) {
              const idx = part.index ?? 0;
              const current = toolCallAcc.get(idx) || {
                id: "",
                type: "function",
                function: { name: "", arguments: "" },
              };
              if (part.id) current.id = part.id;
              if (part.function?.name)
                current.function.name += part.function.name;
              if (part.function?.arguments)
                current.function.arguments += part.function.arguments;
              toolCallAcc.set(idx, current);
            }
          }
        }

        // Some reasoning models (e.g. GLM-5.x via agentrouter) emit their
        // answer in reasoning_content but leave content empty.  When that
        // happens, fall back to the accumulated reasoning text so the user
        // actually sees a response.
        if (!sawContent && !sawToolCalls && reasoningBuffer.length > 0) {
          yield { type: "delta", text: reasoningBuffer };
        }

        if (sawToolCalls) {
          yield {
            type: "toolCalls",
            toolCalls: [...toolCallAcc.values()].filter(
              (tc) => tc.function.name.length > 0,
            ),
          };
        }
        return; // success — exit retry loop
      } finally {
        clearTimeout(streamTimer);
      }
    } catch (err) {
      lastError = err;
      // Retry on transient provider errors (500 / 502 / 503 / 429).
      const status = err.status || err.statusCode || 0;
      console.warn(
        `[chat] provider error on attempt ${attempt}/${maxRetries}: status=${status} message="${err.message}"`,
      );
      if ([500, 502, 503, 429].includes(status) && attempt < maxRetries) {
        console.warn(`[chat] retrying after ${status}…`);
        continue;
      }
      throw err; // non-retryable or last attempt
    }
  }

  // Should not reach here, but just in case.
  throw lastError;
}

module.exports = { streamChat, model, maxToolHops, provider };
