// File: routes/enrollment/publicViewingRoutes.js
const express = require("express");
const router = express.Router();

// Import the read-only controller functions
const {
  getEnrollmentSnapshot,
  getEnrollmentTrend,
  getEnrollmentFilters,
  getProgramTrend,
} = require("../../controllers/enrollment/enrollmentDashboardController");

// ==========================================
// PUBLIC VIEWING ROUTES (No Auth Required)
// Base URL: /api/v1/public-viewing
// ==========================================

// 1. Dynamic Filter Options
router.get("/filters", getEnrollmentFilters);

// 2. Timeline trace tracking for the macro trend
router.get("/trend", getEnrollmentTrend);

// 3. Drill-down trajectory for specific programs
router.get("/program-trend", getProgramTrend);

// 4. Main snapshot (KPIs and program tables)
router.get("/", getEnrollmentSnapshot);

module.exports = router;
