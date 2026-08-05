const express = require("express");
const cors = require("cors");

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
const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

// Global Middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📡 Server received a ${req.method} request to: "${req.url}"`);
  next();
});

// 2. Mount Route Files
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/global-recognition", globalRecognitionRoutes);
app.use("/api/v1/licensure-performance", licensurePerformanceRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/research", researchAnalyticsRouter);
app.use("/api/v1/enrollment", enrollmentRoutes);
app.use("/api/v1/higher-education", higherEducationRoutes);

//public viewing
app.use("/api/v1/public-viewing", publicViewingRoutes);

// Catch-All 404 Middleware (Returns JSON instead of plain text)
app.use((req, res) => {
  console.log(`[DEBUG LOG] 404 Unmatched request: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} was not found on this server.`,
  });
});

module.exports = app;
