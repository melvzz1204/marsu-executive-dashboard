/**
 * Temp diagnostic — probes the LIVE Render /api/v1/chat endpoint using a token
 * signed with the local JWT_SECRET (the deployed Render env uses the same
 * secret). Prints only masked values. Delete after use.
 */
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

// --- Load env from backend/.env ----------------------------------------
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

if (!env.JWT_SECRET) {
  console.error("JWT_SECRET missing from .env");
  process.exit(1);
}

const token = jwt.sign(
  { id: "507f1f77bcf86cd799439011", role: "executive" },
  env.JWT_SECRET,
  { algorithm: "HS256", expiresIn: "5m" },
);

const url =
  process.env.PROBE_URL ||
  "https://marsu-executive-dashbaord.onrender.com/api/v1/chat";
const question = process.argv[2] || "What is the total enrollment for 2023?";
console.log("POST", url);
console.log("Question:", question);
console.log(
  "JWT_SECRET (local .env) masked:",
  env.JWT_SECRET.slice(0, 6) + "...",
);

const started = Date.now();

const run = async () => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: question,
        history: [],
      }),
    });

    console.log("HTTP status:", response.status, response.statusText);
    const ct = response.headers.get("content-type") || "";
    console.log("Content-Type:", ct);

    const text = await response.text();
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log("Elapsed:", elapsed + "s");
    console.log("Response body (first 4000 chars):");
    console.log("-----------------------------------------------");
    console.log(text.slice(0, 4000));
    console.log("-----------------------------------------------");
  } catch (err) {
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log("Elapsed:", elapsed + "s");
    console.log("FETCH ERROR:", err.message);
  }
};

run();
