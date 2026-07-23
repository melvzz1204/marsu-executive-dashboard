// controllers/enrollment/enrollmentController.js
const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");

// @desc    Get Campus Enrollment Snapshot (KPI Cards, Bar Chart, & Program Table Grid)
// @route   GET /api/v1/enrollment
// @access  Private
exports.getEnrollmentSnapshot = async (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : 2023;
    const campus = req.query.campus || "Boac";

    const snapshot = await EnrollmentAnalytics.findOne({ academicYear: year, campus: campus });

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        error: `No enrollment baseline matrix profile logged for ${campus} campus in AY ${year}.`
      });
    }

    return res.status(200).json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Multi-Year Growth Registration Trace (Powers the Line Chart Trend Component)
// @route   GET /api/v1/enrollment/trend
// @access  Private
exports.getEnrollmentTrend = async (req, res) => {
  try {
    const campus = req.query.campus || "Boac";

    // Queries all historical records for a campus and sorts chronologically by Academic Year
    const trends = await EnrollmentAnalytics.find({ campus: campus })
      .sort({ academicYear: 1 })
      .select("academicYear summaryKpis.totalStudents");

    // Formats payload to map effortlessly onto a Recharts/Chart.js continuous line coordinate dataset
    const formattedTrendData = trends.map((record) => ({
      academicYear: record.academicYear, // ✨ Add this raw integer back for the frontend filters!
      label: `AY ${record.academicYear}`,
      totalStudents: record.summaryKpis ? record.summaryKpis.totalStudents : 0 // Defensive fallback
    }));

    return res.status(200).json({
      success: true,
      campus,
      data: formattedTrendData
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Upsert/Create Enrollment Snapshot Ledger (Admin Data Ingestion Matrix)
// @route   POST /api/v1/enrollment
// @access  Private/Admin
exports.upsertEnrollmentAnalytics = async (req, res) => {
  try {
    const { academicYear, campus, programs } = req.body;

    if (!academicYear || !campus) {
      return res.status(400).json({
        success: false,
        error: "Missing required query parameter bounds: academicYear and campus references are required."
      });
    }

    let record = await EnrollmentAnalytics.findOne({ academicYear, campus });

    if (record) {
      if (programs) record.programs = programs;
    } else {
      record = new EnrollmentAnalytics({
        academicYear,
        campus,
        programs
      });
    }

    // Save automatically runs our pre-save engine to calculate KPIs, find the top course, and lookup YoY growth
    await record.save();

    return res.status(200).json({
      success: true,
      message: `Enrollment metadata metrics ledger for ${campus} (AY ${academicYear}) synced successfully.`,
      data: record
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};  