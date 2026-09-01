/**
 * Chat Routes
 * -----------
 * POST /api/v1/chat — SSE-streamed AI assistant responses.
 *
 * Security stack:
 *   1. `protect`      — JWT authentication (existing middleware)
 *   2. `chatLimiter`  — dedicated per-user rate limit, much tighter than the
 *                       global 300/15min because each request costs real money.
 */
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { protect } = require("../../middleware/authMiddleware");
const { streamChatResponse } = require("../../controllers/chat/chatController");

const router = express.Router();

// Per-user limiter keyed by the authenticated user id. `protect` runs before
// this limiter, so req.user is always populated here — no IP fallback needed
// (and none is safe: raw req.ip keys can be bypassed via IPv6 rotation).
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.CHAT_RATE_LIMIT_MAX) || 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? "unauthenticated",
  message: {
    success: false,
    error: "Too Many Requests",
    message:
      "You have reached the chat message limit. Please try again in a few minutes.",
  },
});

router.post("/", protect, chatLimiter, streamChatResponse);

module.exports = router;
