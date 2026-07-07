// routes/research/researchRoutes.js
const express = require("express");
const router = express.Router();
const { 
  getResearchAnalytics, 
  upsertResearchAnalytics, 
  updateCollegeMetric 
} = require("../../controllers/research/researchController");

// Assuming your security middleware file is located here:
const { protect, authorize } = require("../../middleware/authMiddleware");

// Secure all data streaming within this workspace routing stack
router.use(protect);

// Main collection entry routes
router
  .route("/")
  .get(getResearchAnalytics) // Accessible by any logged-in role to build dashboards
  .post(authorize("admin", "superadmin"), upsertResearchAnalytics); // Master ingest restriction

// Target sub-document update route
router
  .route("/college")
  .patch(authorize("admin", "dean"), updateCollegeMetric); // Deans can fix their own metrics line-items

module.exports = router;