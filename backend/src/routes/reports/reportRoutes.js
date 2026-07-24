// routes/reportRoutes.js
const express = require("express");
const router = express.Router();

// Import the unified multi-model reporting controllers
const { exportToCSV, exportToPDF } = require("../../controllers/reports/reportController");

// Import your authentication guardrails
const { protect, authorize } = require("../../middleware/authMiddleware");

// 🔒 All reporting endpoints require an authenticated session context
router.use(protect);

// 📊 Consolidated Multi-Model Reporting Routes
// Accessible by Executives, Deans, and System Administrators
router
  .route("/institutional/csv")
  .get(authorize("executive", "dean", "admin"), exportToCSV);

router
  .route("/institutional/pdf")
  .get(authorize("executive", "dean", "admin"), exportToPDF);

module.exports = router;