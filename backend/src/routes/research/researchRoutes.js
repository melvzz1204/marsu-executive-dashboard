const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../../middleware/authMiddleware");
const { excelUpload } = require("../../middleware/uploadMiddleware");

// Import Paper Controllers
const {
  getResearchStats,
  getResearchPapers,
  createResearchPaper,
  seedResearchPapers,
} = require("../../controllers/research/researchController");

// Import Spreadsheet Upload Controllers
const {
  uploadResearchExcel,
  getResearchUploadLogs,
} = require("../../controllers/research/researchUploadController");

router.use(protect);

// ==========================================
// 📊 DASHBOARD & DATABASE ENDPOINTS
// ==========================================

// Stats for dashboard widgets
router.get("/stats", getResearchStats);

// Database endpoints for modal search & paper registry
router.get("/papers", getResearchPapers);
router.post("/papers", authorize("admin"), createResearchPaper);

// ==========================================
// 📁 EXCEL INGESTION & AUDIT LOG ENDPOINTS
// ==========================================

// Ingest research spreadsheet (handles drag-and-drop file uploads)
router.post(
  "/upload",
  authorize("admin"),
  excelUpload.single("file"),
  uploadResearchExcel,
);

// Retrieve upload history audit logs
router.get("/logs", authorize("admin"), getResearchUploadLogs);

// ==========================================
// 🛠️ UTILITY / SEEDING ENDPOINTS
// ==========================================

// Seeding endpoint
router.post("/seed", authorize("admin"), seedResearchPapers);

module.exports = router;
