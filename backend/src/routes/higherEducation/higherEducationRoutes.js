const express = require("express");
const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
  uploadHigherEducationExcel,
} = require("../../controllers/higherEducation/higherEducationUploadController");

const {
  getHigherEducationStats,
  getHigherEducationPrograms,
} = require("../../controllers/higherEducation/higherEducationController");

// Upload route (Accepts multipart/form-data with field name "file")
router.post("/upload", upload.single("file"), uploadHigherEducationExcel);

// Analytics & Data Routes
router.get("/stats", getHigherEducationStats);
router.get("/programs", getHigherEducationPrograms);

module.exports = router;