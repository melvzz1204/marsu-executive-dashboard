const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// 1. Import Route Files
const authRoutes = require("./routes/authRoutes");
const globalRecognitionRoutes = require("./routes/achievements/globalRecognitionRoutes");
const licensurePerformanceRoutes = require("./routes/achievements/licensurePerformanceRoutes");
const reportRoutes = require("./routes/reports/reportRoutes");
const researchAnalyticsRouter = require("./routes/research/researchRoutes");
const enrollmentRoutes = require("./routes/enrollment/enrollmentRoutes");
const higherEducationRoutes = require("./routes/higherEducation/higherEducationRoutes");

// for public viewing
const publicViewingRoutes = require("./routes/enrollment/publicViewingRoutes");

const app = express();
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";
const isLocalDevelopmentOrigin = (origin) => {
  if (isProduction || !origin) return false;

  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
};
const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/$/, "");
    if (
      !origin ||
      configuredOrigins.includes(normalizedOrigin) ||
      isLocalDevelopmentOrigin(origin)
    ) {
      return callback(null, true);
    }
    const error = new Error("Origin is not allowed by CORS.");
    error.statusCode = 403;
    return callback(error);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

if (isProduction && configuredOrigins.length === 0) {
  throw new Error("CORS_ORIGINS must be configured in production.");
}

app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX) || 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too Many Requests",
      message: "Too many requests. Please try again later.",
    },
  }),
);

// 2. Mount Route Files
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/global-recognition", globalRecognitionRoutes);
app.use("/api/v1/licensure-performance", licensurePerformanceRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/research", researchAnalyticsRouter);
app.use("/api/v1/enrollment", enrollmentRoutes);
app.use("/api/v1/higher-education", higherEducationRoutes);

// Public viewing
app.use("/api/v1/public-viewing", publicViewingRoutes);

// Render and uptime monitors commonly probe the service root. Keep it separate
// from /health so the root response can identify the API without implying that
// the MongoDB dependency is ready.
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "MarSU Executive Dashboard API",
    status: "ok",
    health: "/health",
    readiness: "/ready",
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json({ success: true, status: "ok" });
});

app.get("/ready", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? "ready" : "not_ready",
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
