const express = require("express");
const router = express.Router();
const multer = require("multer");

const licensureController = require("../../controllers/higherEducation/licensureExamController");
const licensureUploadController = require("../../controllers/higherEducation/licensureExamUploadController");
const { protect } = require("../../middleware/authMiddleware");

// Memory storage buffer for Excel parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// Analytics Matrix Endpoint
router.get("/stats", licensureController.getLicensureStats);

// Upload Route
router.post(
  "/upload",
  protect,
  upload.single("file"),
  licensureUploadController.uploadLicensureExcel
);

module.exports = router;