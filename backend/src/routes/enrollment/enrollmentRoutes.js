const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  getEnrollmentSnapshot,
  getEnrollmentTrend,
  getEnrollmentFilters,
  upsertEnrollmentAnalytics,
} = require("../../controllers/enrollment/enrollmentDashboardController");

const {
  uploadEnrollmentExcel,
} = require("../../controllers/enrollment/enrollmentUploadController");

// Security middleware
const { protect, authorize } = require("../../middleware/authMiddleware");

// Configure memory storage for multer stream handling
const upload = multer({ storage: multer.memoryStorage() });

// Secure all endpoints within this enrollment tracking stack
router.use(protect);

// Bulk Spreadsheet Ingestion Route
router.post(
  "/upload",
  authorize("admin", "superadmin"),
  upload.single("file"),
  uploadEnrollmentExcel,
);

// Dynamic Filter Options Path (Returns distinct years and campuses)
router.get("/filters", getEnrollmentFilters);

// Timeline trace tracking route for the multi-year trend line component
router.get("/trend", getEnrollmentTrend);

// Main snapshot and manual entry path
router
  .route("/")
  .get(getEnrollmentSnapshot)
  .post(authorize("admin", "superadmin"), upsertEnrollmentAnalytics);

module.exports = router;
