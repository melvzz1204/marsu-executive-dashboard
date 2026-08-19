const express = require("express");
const router = express.Router();
const multer = require("multer");

const budgetController = require("../../controllers/finance/budgetController");
const { protect } = require("../../middleware/authMiddleware");

// Configure Multer for memory buffer upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// Analytics Dashboard Endpoint
router.get("/stats", budgetController.getBudgetStats);

// Upload & Audit Log Endpoints
router.post(
  "/upload",
  protect,
  upload.single("file"),
  budgetController.uploadBudgetExcel
);
router.get("/logs", protect, budgetController.getBudgetUploadLogs);

module.exports = router;