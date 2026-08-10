const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
process.env.RATE_LIMIT_MAX = "1000";

const app = require("../src/app");

const createToken = (payload = {}) =>
  jwt.sign(
    { id: "507f1f77bcf86cd799439011", role: "admin", ...payload },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "5m" },
  );

test("GET / reports a running API service", async () => {
  const response = await request(app).get("/");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.health, "/health");
});

test("HEAD / is accepted by the root API endpoint", async () => {
  const response = await request(app).head("/");

  assert.equal(response.status, 200);
});

test("GET /health reports a healthy process", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.status, "ok");
  assert.ok(response.headers["content-security-policy"]);
});

test("GET /ready reports unavailable when MongoDB is disconnected", async () => {
  const response = await request(app).get("/ready");

  assert.equal(response.status, 503);
  assert.equal(response.body.success, false);
});

test("unknown routes use the JSON 404 handler", async () => {
  const response = await request(app).get("/does-not-exist");

  assert.equal(response.status, 404);
  assert.equal(response.body.error, "Not Found");
});

test("protected enrollment routes reject missing credentials", async () => {
  const response = await request(app).get("/api/v1/enrollment/filters");

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test("admin registration rejects unauthenticated requests", async () => {
  const response = await request(app).post("/api/v1/auth/register").send({
    name: "Test Admin",
    email: "admin@example.com",
    password: "secure-password",
    role: "admin",
  });

  assert.equal(response.status, 401);
});

test("upload middleware rejects non-Excel files before controller execution", async () => {
  const response = await request(app)
    .post("/api/v1/enrollment/upload")
    .set("Authorization", `Bearer ${createToken()}`)
    .attach("file", Buffer.from("not an excel workbook"), {
      filename: "payload.txt",
      contentType: "text/plain",
    });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /Excel spreadsheet/i);
});
