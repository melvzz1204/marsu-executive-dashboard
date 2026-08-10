const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../../middleware/authMiddleware");
const { excelUpload } = require("../../middleware/uploadMiddleware");

const {
  uploadHigherEducationExcel,
  getUploadLogs,
} = require("../../controllers/higherEducation/higherEducationUploadController");

const {
  getHigherEducationStats,
  getHigherEducationPrograms,
} = require("../../controllers/higherEducation/higherEducationController");

router.use(protect);

router.post(
  "/upload",
  authorize("admin"),
  excelUpload.single("file"),
  uploadHigherEducationExcel,
);
router.get("/logs", authorize("admin"), getUploadLogs);
router.get("/stats", getHigherEducationStats);
router.get("/programs", getHigherEducationPrograms);

module.exports = router;
