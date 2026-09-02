/**
 * Temp diagnostic — prints which AI env vars are present in backend/.env
 * WITHOUT leaking the API key (masked) or any other secret.
 * Delete after use.
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const names = [
  "AI_PROVIDER",
  "AI_MODEL",
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_USER_AGENT",
  "AI_MAX_TOOL_HOPS",
  "AI_MAX_OUTPUT_TOKENS",
  "AI_TEMPERATURE",
  "AI_TIMEOUT_MS",
  "CHAT_RATE_LIMIT_MAX",
];

if (!fs.existsSync(envPath)) {
  console.log(".env NOT FOUND at " + envPath);
  process.exit(0);
}

const content = fs.readFileSync(envPath, "utf8");
const found = {};

for (const line of content.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  const name = m[1];
  let value = m[2].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  found[name] = value;
}

for (const name of names) {
  if (!(name in found)) {
    console.log(name + " = <NOT SET>");
    continue;
  }
  const v = found[name];
  if (name === "AI_API_KEY") {
    const masked = v.length > 8 ? v.slice(0, 4) + "..." + v.slice(-4) : "***";
    console.log(name + " = " + masked + " (length " + v.length + ")");
  } else {
    console.log(name + " = " + v);
  }
}
