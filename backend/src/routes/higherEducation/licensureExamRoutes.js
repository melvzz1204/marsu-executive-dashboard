const express = require("express");
const router = express.Router();

const licensureController = require("../../controllers/higherEducation/licensureExamController");
const licensureUploadController = require("../../controllers/higherEducation/licensureExamUploadController");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { xlsxUpload } = require("../../middleware/uploadMiddleware");

// Analytics Matrix Endpoint
router.get("/stats", licensureController.getLicensureStats);

// Upload Route
router.post(
  "/upload",
  protect,
  authorize("admin"),
  xlsxUpload.single("file"),
  licensureUploadController.uploadLicensureExcel,
);

module.exports = router;
