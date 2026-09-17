// routes/reportRoutes.js
const express = require("express");
const router = express.Router();

// Import the unified multi-model reporting controllers
const { exportToCSV, exportToPDF } = require("../../controllers/reports/reportController");
const {
  getPresidentReport,
  downloadPresidentPptx,
} = require("../../controllers/reports/presidentReportController");

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

// 🏛️ President's Report — assembled report data and editable .pptx deck
router
  .route("/presidents")
  .get(authorize("executive", "admin"), getPresidentReport);

router
  .route("/presidents/pptx")
  .get(authorize("executive", "admin"), downloadPresidentPptx);

module.exports = router;