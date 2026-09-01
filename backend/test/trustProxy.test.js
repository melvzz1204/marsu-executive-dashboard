/**
 * Regression test for ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
 *
 * Render always sends X-Forwarded-For. express-rate-limit v8 throws when that
 * header is present but Express 'trust proxy' is false. This test loads the
 * app with NODE_ENV=production and verifies requests with X-Forwarded-For no
 * longer crash the rate limiter.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "production";
process.env.CORS_ORIGINS = "https://marsu-executive-dashbaord.vercel.app";
process.env.JWT_SECRET = "a-test-secret-that-is-at-least-32-characters-long!!";
process.env.RATE_LIMIT_MAX = "1000";
delete process.env.TRUST_PROXY;

const app = require("../src/app");

test("app trusts proxy in production", () => {
  assert.equal(app.get("trust proxy"), 1);
});

test("request with X-Forwarded-For does not throw ERR_ERL_UNEXPECTED_X_FORWARDED_FOR", async () => {
  const res = await request(app)
    .get("/health")
    .set("X-Forwarded-For", "203.0.113.5")
    .set("Origin", "https://marsu-executive-dashbaord.vercel.app");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { success: true, status: "ok" });
});

test("request to API route with X-Forwarded-For passes the rate limiter", async () => {
  const res = await request(app)
    .get("/api/v1/auth/name")
    .set("X-Forwarded-For", "203.0.113.5")
    .set("Origin", "https://marsu-executive-dashbaord.vercel.app");
  // Rate limiter should let the request through; auth failure (401/400) is fine,
  // a crash would surface as a 500 or a thrown validation error.
  assert.ok(res.status < 500, `expected status < 500, got ${res.status}`);
});
