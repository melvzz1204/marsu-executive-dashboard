const express = require("express");
const router = express.Router();
const multer = require("multer");

// Import controller handlers consistently using CommonJS
const {
  getEnrollmentSnapshot,
  getEnrollmentTrend,
  upsertEnrollmentAnalytics,
  uploadEnrollment,
} = require("../../controllers/enrollment/enrollmentController");

// Security middleware
const { protect, authorize } = require("../../middleware/authMiddleware");

// Configure Multer memory storage to read Excel buffer directly
const upload = multer({ storage: multer.memoryStorage() });

// Protect all routes in this stack
router.use(protect);

// ✅ FIXED: Clean route definition with proper middleware execution order
router.post(
  "/upload",
  authorize("admin", "superadmin"),
  upload.single("file"),
  uploadEnrollment,
);

// Snapshot & manual entry endpoints
router
  .route("/")
  .get(getEnrollmentSnapshot)
  .post(authorize("admin", "superadmin"), upsertEnrollmentAnalytics);

// Multi-year trend line endpoint
router.route("/trend").get(getEnrollmentTrend);

module.exports = router;
