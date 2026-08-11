const express = require("express");
const router = express.Router();
const { excelUpload } = require("../../middleware/uploadMiddleware");

// 1. ADD getProgramTrend HERE
const {
  getEnrollmentSnapshot,
  getEnrollmentTrend,
  getEnrollmentFilters,
  upsertEnrollmentAnalytics,
  getProgramTrend,
} = require("../../controllers/enrollment/enrollmentDashboardController");

const {
  uploadEnrollmentExcel,
  getUploadLogs,
  clearUploadLogs,
} = require("../../controllers/enrollment/enrollmentUploadController");

// Security middleware
const { protect, authorize } = require("../../middleware/authMiddleware");

// Secure all endpoints within this enrollment tracking stack
router.use(protect);

// Bulk Spreadsheet Ingestion Route
router.post(
  "/upload",
  authorize("admin"),
  excelUpload.single("file"),
  uploadEnrollmentExcel,
);

// Spreadsheet Upload Audit Log Routes
router
  .route("/logs")
  .get(authorize("admin"), getUploadLogs)
  .delete(authorize("admin"), clearUploadLogs);

// Dynamic Filter Options Path (Returns distinct years and campuses)
router.get("/filters", getEnrollmentFilters);

// Timeline trace tracking route for the multi-year trend line component
router.get("/trend", getEnrollmentTrend);

// 2. CALL IT DIRECTLY HERE
router.get("/program-trend", getProgramTrend);

// Main snapshot and manual entry path
router
  .route("/")
  .get(getEnrollmentSnapshot)
  .post(authorize("admin"), upsertEnrollmentAnalytics);

module.exports = router;
