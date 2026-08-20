const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../../middleware/authMiddleware");
const { excelUpload } = require("../../middleware/uploadMiddleware");

const {
  uploadHigherEducationExcel,
  getUploadLogs,
  clearUploadLogs,
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

router
  .route("/logs")
  .get(authorize("admin"), getUploadLogs)
  .delete(authorize("admin"), clearUploadLogs);

router.get("/stats", getHigherEducationStats);
router.get("/programs", getHigherEducationPrograms);

module.exports = router;