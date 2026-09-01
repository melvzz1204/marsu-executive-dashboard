/**
 * LLM Provider Adapter
 * --------------------
 * Single interface for all AI providers using the OpenAI-compatible
 * Chat Completions API. Swap providers via environment variables:
 *
 *   AI_PROVIDER=glm     → Z.ai GLM (https://api.z.ai/api/paas/v4)
 *   AI_PROVIDER=openai   → OpenAI (https://api.openai.com/v1)
 *   AI_PROVIDER=gemini   → Gemini OpenAI-compat (https://generativelanguage.googleapis.com/v1beta/openai)
 *   AI_PROVIDER=custom   → any OpenAI-compatible endpoint via AI_BASE_URL
 *
 * Exposes one method:
 *   streamChat({ messages, tools }) → async iterable of normalized chunks:
 *     { type: "delta", text }                    — assistant text token
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
    defaultModel: "gemini-2.0-flash",
  },
};

const provider = (process.env.AI_PROVIDER || "glm").toLowerCase();
const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.custom;

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
  // Some proxy routers (e.g., agentrouter.org) whitelist clients by
  // User-Agent and reject the OpenAI SDK's default UA with a 401.
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

  for await (const chunk of completion) {
    const choice = chunk.choices?.[0];
    if (!choice) continue;

    const delta = choice.delta || {};

    if (typeof delta.content === "string" && delta.content.length > 0) {
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
        if (part.function?.name) current.function.name += part.function.name;
        if (part.function?.arguments)
          current.function.arguments += part.function.arguments;
        toolCallAcc.set(idx, current);
      }
    }
  }

  if (sawToolCalls) {
    yield {
      type: "toolCalls",
      toolCalls: [...toolCallAcc.values()].filter(
        (tc) => tc.function.name.length > 0,
      ),
    };
  }
}

module.exports = { streamChat, model, maxToolHops, provider };
