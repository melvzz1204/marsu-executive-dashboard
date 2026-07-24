// controllers/licensurePerformanceController.js
const LicensurePerformance = require("../../models/achievements/licensurePerformanceModel");

// @desc    Get licensure performance data for a college (sorted by year)
// @route   GET /api/v1/licensure-performance
// @access  Private (Executive, Dean, Admin)
exports.getLicensurePerformance = async (req, res) => {
  try {
    // Admins and Executives can pass a collegeId via query parameters to view specific campus metrics.
    // Deans will automatically default to their assigned collegeId from their JWT.
    let collegeId = req.query.collegeId || req.user.collegeId;
    let query = {};

    // 💡 FLEXIBLE QUERY BUILDER: 
    if (collegeId) {
      query.collegeId = collegeId;
    } else if (req.user.role === "dean") {
      return res.status(400).json({ success: false, error: "Dean account missing assigned College ID" });
    }

    // Security check: Deans should not look at other colleges' dashboards
    if (req.user.role === "dean" && collegeId && collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized to access this college's data" });
    }

    // Optional query parameter to filter down to a specific year if needed (e.g., ?year=2026)
    if (req.query.year) {
      query.rankingYear = Number(req.query.year);
    }

    const performanceRecords = await LicensurePerformance.find(query).sort({ rankingYear: -1 });

    res.status(200).json({
      success: true,
      count: performanceRecords.length,
      data: performanceRecords,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new licensure performance year entry
// @route   POST /api/v1/licensure-performance
// @access  Private (Admin Only)
exports.createLicensureRecord = async (req, res) => {
  try {
    const record = await LicensurePerformance.create(req.body);

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update a licensure performance record or append a single program breakdown row
// @route   PUT/PATCH /api/v1/licensure-performance/:id
// @access  Private (Admin Only)
exports.updateLicensureRecord = async (req, res) => {
  try {
    let record = await LicensurePerformance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Licensure record not found",
      });
    }

    if (req.body.newProgram) {
      record = await LicensurePerformance.findByIdAndUpdate(
        req.params.id,
        { $push: { programs: req.body.newProgram } }, // Uses MongoDB atomic $push array extension
        { new: true, runValidators: true }
      );
    } else {
      record = await LicensurePerformance.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete a licensure performance record
// @route   DELETE /api/v1/licensure-performance/:id
// @access  Private (Admin Only)
exports.deleteLicensureRecord = async (req, res) => {
  try {
    const record = await LicensurePerformance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, error: "Licensure record not found" });
    }

    await record.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};