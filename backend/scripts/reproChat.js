/**
 * Temp diagnostic — reproduces the chat SSE flow locally against the real
 * AI provider using the values in backend/.env. Prints ONLY masked secrets.
 * Delete after use.
 */
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

// --- Load env from .env (no dotenv needed) -----------------------------
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

const mask = (s) =>
  !s ? "<unset>" : s.length > 8 ? s.slice(0, 4) + "..." + s.slice(-4) : "***";

// --- Sign a valid admin token (protect only needs id + role) ------------
if (!env.JWT_SECRET) {
  console.error("JWT_SECRET missing from .env");
  process.exit(1);
}
const token = jwt.sign(
  { id: "507f1f77bcf86cd799439011", role: "executive" },
  env.JWT_SECRET,
  { algorithm: "HS256", expiresIn: "5m" },
);

const url = "http://localhost:5000/api/v1/chat";
const body = JSON.stringify({
  message: "What is the total enrollment for 2023?",
  history: [],
});

console.log("== Config being exercised ==");
console.log("AI_PROVIDER       =", env.AI_PROVIDER || "(glm default)");
console.log("AI_MODEL          =", env.AI_MODEL || "(default)");
console.log("AI_BASE_URL       =", env.AI_BASE_URL || "(default)");
console.log("AI_API_KEY        =", mask(env.AI_API_KEY));
console.log(
  "AI_USER_AGENT     =",
  env.AI_USER_AGENT || "(roo-code/1.0 default)",
);
console.log("AI_MAX_TOOL_HOPS  =", env.AI_MAX_TOOL_HOPS);
console.log("AI_TIMEOUT_MS     =", env.AI_TIMEOUT_MS);
console.log("");
console.log("POST", url);

const started = Date.now();

const run = async () => {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    (Number(env.AI_TIMEOUT_MS) || 60000) + 20000,
  );
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
      signal: controller.signal,
    });

    console.log("HTTP status:", response.status, response.statusText);
    const ct = response.headers.get("content-type") || "";
    console.log("Content-Type:", ct);

    const text = await response.text();
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log("Elapsed:", elapsed + "s");
    console.log("Response body (first 3000 chars):");
    console.log("-----------------------------------------------");
    console.log(text.slice(0, 3000));
    console.log("-----------------------------------------------");
  } catch (err) {
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log("Elapsed:", elapsed + "s");
    if (err.name === "AbortError") {
      console.log("ABORTED after", elapsed, "s (timeout)");
    } else {
      console.log("FETCH ERROR:", err.message);
    }
  } finally {
    clearTimeout(timer);
  }
};

run();
