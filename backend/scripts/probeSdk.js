/**
 * Temp diagnostic — exercises the EXACT code path the live server uses:
 * OpenAI SDK v7.8.0 → agentrouter.org → glm-5.3, streaming.
 * Runs N iterations to characterize reliability (empty vs content).
 * Delete after use.
 */
const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");

const env = {};
const envPath = path.join(__dirname, "..", ".env");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  env[m[1]] = v;
}

const client = new OpenAI({
  apiKey: env.AI_API_KEY || "missing",
  baseURL: env.AI_BASE_URL || "https://api.z.ai/api/paas/v4",
  timeout: Number(env.AI_TIMEOUT_MS) || 60000,
  maxRetries: 1,
  defaultHeaders: { "User-Agent": env.AI_USER_AGENT || "roo-code/1.0" },
});

const model = process.argv[2] || env.AI_MODEL || "glm-5.3";
const iterations = Number(process.argv[3]) || 3;
const maxTokens = Number(env.AI_MAX_OUTPUT_TOKENS) || 4000;

console.log(
  "SDK probe: model=" +
    model +
    " iterations=" +
    iterations +
    " max_tokens=" +
    maxTokens,
);
console.log("baseURL:", env.AI_BASE_URL);
console.log("");

const run = async () => {
  for (let i = 1; i <= iterations; i++) {
    const started = Date.now();
    let content = "";
    let reasoning = "";
    let toolCalls = 0;
    let error = null;
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Answer briefly.",
          },
          { role: "user", content: "Say hello in one short sentence." },
        ],
        stream: true,
        temperature: 0.2,
        max_tokens: maxTokens,
      });
      for await (const chunk of completion) {
        const delta = chunk.choices?.[0]?.delta || {};
        if (typeof delta.content === "string") content += delta.content;
        if (typeof delta.reasoning_content === "string")
          reasoning += delta.reasoning_content;
        if (Array.isArray(delta.tool_calls))
          toolCalls += delta.tool_calls.length;
      }
    } catch (err) {
      error = err.message;
    }
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log(
      "iter " +
        i +
        ": elapsed=" +
        elapsed +
        "s" +
        " content_len=" +
        content.length +
        " reasoning_len=" +
        reasoning.length +
        " tool_calls=" +
        toolCalls +
        (error ? " ERROR=" + error : ""),
    );
    if (content)
      console.log("   content preview:", JSON.stringify(content.slice(0, 80)));
  }
};

run();
