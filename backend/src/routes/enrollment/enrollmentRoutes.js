// routes/analytics/enrollmentRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer"); // 💡 Imported multer to process multipart form-data streams

const {
  getEnrollmentSnapshot,
  getEnrollmentTrend,
  upsertEnrollmentAnalytics
} = require("../../controllers/enrollment/enrollmentController");
const { uploadEnrollmentExcel } = require("../../controllers/enrollment/enrollmentUploadController");

// Assuming your security middleware is located here:
const { protect, authorize } = require("../../middleware/authMiddleware");

// 💡 Configure memory storage so the raw Excel file buffer is accessible via req.file.buffer
const upload = multer({ storage: multer.memoryStorage() });

// Secure all endpoints within this enrollment tracking stack
router.use(protect);

// Bulk Spreadsheet Ingestion Route
// 💡 Added upload.single("file") middleware to catch the 'file' key sent from the frontend FormData
router.post(
  "/upload", 
  authorize("admin", "superadmin"), 
  upload.single("file"), 
  uploadEnrollmentExcel
);

// Main snapshot and ingestion workspace paths
router
  .route("/")
  .get(getEnrollmentSnapshot) // Accessible by all authenticated accounts to render dashboards
  .post(authorize("admin", "superadmin"), upsertEnrollmentAnalytics); // Admin data-entry restriction

// Timeline trace tracking route for the multi-year trend line component
router
  .route("/trend")
  .get(getEnrollmentTrend);

module.exports = router;