const express = require("express");
const multer = require("multer");
const router = express.Router();

// Configure Multer memory storage so ExcelJS can access the file buffer directly
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

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

// ==========================================
// 📊 DASHBOARD & DATABASE ENDPOINTS
// ==========================================

// Stats for dashboard widgets
router.get("/stats", getResearchStats);

// Database endpoints for modal search & paper registry
router.get("/papers", getResearchPapers);
router.post("/papers", createResearchPaper);

// ==========================================
// 📁 EXCEL INGESTION & AUDIT LOG ENDPOINTS
// ==========================================

// Ingest research spreadsheet (handles drag-and-drop file uploads)
router.post("/upload", upload.single("file"), uploadResearchExcel);

// Retrieve upload history audit logs
router.get("/logs", getResearchUploadLogs);

// ==========================================
// 🛠️ UTILITY / SEEDING ENDPOINTS
// ==========================================

// Seeding endpoint
router.post("/seed", seedResearchPapers);

module.exports = router;