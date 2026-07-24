// routes/licensurePerformanceRoutes.js
const express = require("express");
const router = express.Router();

const {
  getLicensurePerformance,
  createLicensureRecord,
  updateLicensureRecord,
  deleteLicensureRecord,
} = require("../../controllers/achievements/licensurePerformanceController");

// Assuming your auth middleware file provides protect and authorize methods
const { protect, authorize } = require("../../middleware/authMiddleware");

// All licensure performance dashboard endpoints require authentication
router.use(protect);

router
  .route("/")
  // Executives, Deans, and Admins can read the performance data cards
  .get(authorize("executive", "dean", "admin"), getLicensurePerformance)
  // ONLY admins can add a new year matrix record block
  .post(authorize("admin"), createLicensureRecord);

router
  .route("/:id")
  // ONLY admins can perform full overwrites (PUT) or push new single programs (PATCH)
  .put(authorize("admin"), updateLicensureRecord)
  .patch(authorize("admin"), updateLicensureRecord)
  // ONLY admins can delete an entire year record matrix block
  .delete(authorize("admin"), deleteLicensureRecord);

module.exports = router;