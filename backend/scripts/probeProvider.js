/**
 * Temp diagnostic — calls agentrouter.org directly (raw fetch) using the
 * AI config from backend/.env to characterize the provider response.
 * Prints status + body (truncated). Delete after use.
 */
const fs = require("fs");
const path = require("path");

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

const baseURL = env.AI_BASE_URL || "https://agentrouter.org/v1";
const key = env.AI_API_KEY;
const model = process.argv[2] || env.AI_MODEL || "glm-4.7";
const forcedMaxTokens = Number(process.argv[3]) || 0;

const mask = (s) =>
  !s ? "<unset>" : s.length > 8 ? s.slice(0, 4) + "..." + s.slice(-4) : "***";

const started = Date.now();
const timed = (p, label) =>
  Promise.race([
    p,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error(label + " TIMED OUT")), 30000),
    ),
  ]);

const run = async () => {
  console.log("baseURL:", baseURL);
  console.log("model:", model);
  console.log("apiKey:", mask(key));
  console.log("");

  const maxTokens = forcedMaxTokens || Number(env.AI_MAX_OUTPUT_TOKENS) || 4000;
  console.log("max_tokens:", maxTokens);

  // --- Non-streaming call with the REAL token budget --------------------
  try {
    const res = await timed(
      fetch(baseURL + "/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "User-Agent": env.AI_USER_AGENT || "roo-code/1.0",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. Answer briefly using real data when available.",
            },
            {
              role: "user",
              content:
                "What is the total enrollment for academic year 2023 across all campuses?",
            },
          ],
          max_tokens: maxTokens,
          temperature: Number(env.AI_TEMPERATURE) || 0.2,
          stream: false,
        }),
      }),
      "non-stream",
    );
    const text = await res.text();
    console.log("NON-STREAM status:", res.status, res.statusText);
    // Print a trimmed, one-line summary of the choices to avoid huge output.
    try {
      const json = JSON.parse(text);
      const c = json.choices?.[0];
      console.log(
        "NON-STREAM choice:",
        JSON.stringify({
          finish_reason: c?.finish_reason,
          has_content:
            typeof c?.message?.content === "string" &&
            c.message.content.length > 0,
          content_len: (c?.message?.content || "").length,
          has_reasoning:
            typeof c?.message?.reasoning_content === "string" &&
            c.message.reasoning_content.length > 0,
          reasoning_len: (c?.message?.reasoning_content || "").length,
          tool_calls: Array.isArray(c?.message?.tool_calls)
            ? c.message.tool_calls.length
            : 0,
        }),
      );
    } catch {
      console.log("NON-STREAM raw:", text.slice(0, 300));
    }
  } catch (err) {
    console.log("NON-STREAM ERROR:", err.message);
  }
  console.log("");

  // --- Streaming call with the REAL token budget ------------------------
  try {
    const res = await timed(
      fetch(baseURL + "/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "User-Agent": env.AI_USER_AGENT || "roo-code/1.0",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. Answer briefly using real data when available.",
            },
            {
              role: "user",
              content:
                "What is the total enrollment for academic year 2023 across all campuses?",
            },
          ],
          max_tokens: maxTokens,
          temperature: Number(env.AI_TEMPERATURE) || 0.2,
          stream: true,
        }),
      }),
      "stream",
    );
    console.log("STREAM status:", res.status, res.statusText);
    const text = await res.text();
    // Summarize: how many chunks had content vs reasoning_content.
    const contentChunks = (text.match(/"content":\s*"[^"]+"/g) || []).length;
    const reasoningChunks = (
      text.match(/"reasoning_content":\s*"[^"]+"/g) || []
    ).length;
    const toolChunks = (text.match(/"tool_calls"/g) || []).length;
    console.log(
      "STREAM summary: content_chunks=" +
        contentChunks +
        " reasoning_chunks=" +
        reasoningChunks +
        " tool_call_chunks=" +
        toolChunks +
        " total_bytes=" +
        text.length,
    );
    console.log(
      "STREAM first 200 chars:",
      text.slice(0, 200).replace(/\n/g, " "),
    );
  } catch (err) {
    console.log("STREAM ERROR:", err.message);
  }
  console.log("");
  console.log("Elapsed:", ((Date.now() - started) / 1000).toFixed(1) + "s");
};

run();
