const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");

// GET /api/v1/enrollment
exports.getEnrollmentSnapshot = async (req, res) => {
  try {
    const { year, campus, semester } = req.query;

    // Parse params matching your Schema types
    const numericYear = year ? parseInt(year, 10) : 2023;
    const campusName = campus || "Boac";
    const semesterName = semester || "1st Semester"; // Schema default is "1st Semester"

    // Query matching the compound index: { academicYear: 1, campus: 1, semester: 1 }
    const snapshot = await EnrollmentAnalytics.findOne({
      academicYear: numericYear,
      campus: campusName,
      semester: semesterName,
    }).lean();

    // If no record exists for this year/campus, return empty state safely (200 OK)
    if (!snapshot) {
      return res.status(200).json({
        success: true,
        data: {
          summaryKpis: {
            totalStudents: 0,
            yoYGrowthPercentage: 0,
            activeProgramsCount: 0,
            largestProgramName: "N/A",
            priorityEnrollmentPercentage: 0,
          },
          programs: [],
        },
      });
    }

    // Map Schema sub-documents to normalized frontend properties
    const mappedPrograms = (snapshot.programs || []).map((p, index) => ({
      _id: p._id,
      name: p.programName || "Unnamed Program", // Schema: programName
      code: p.programCode || "", // Schema: programCode
      category: p.department || "General", // Schema: department
      enrollment: p.studentCount || 0, // Schema: studentCount
      isPriority: p.isPriorityProgram || false, // Schema: isPriorityProgram
      status: p.isActive ? "active" : "inactive", // Schema: isActive
      rank: index + 1,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summaryKpis: snapshot.summaryKpis || {
          totalStudents: 0,
          yoYGrowthPercentage: 0,
          activeProgramsCount: 0,
          largestProgramName: "N/A",
          priorityEnrollmentPercentage: 0,
        },
        programs: mappedPrograms,
      },
    });
  } catch (error) {
    console.error("❌ Error in getEnrollmentSnapshot:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

// GET /api/v1/enrollment/filters
exports.getEnrollmentFilters = async (req, res) => {
  try {
    const years = await EnrollmentAnalytics.distinct("academicYear");
    const campuses = await EnrollmentAnalytics.distinct("campus");
    const semesters = await EnrollmentAnalytics.distinct("semester");

    return res.status(200).json({
      success: true,
      data: {
        years: years.sort((a, b) => b - a),
        campuses:
          campuses.length > 0
            ? campuses
            : ["Boac", "Gasan", "Santa Cruz", "Torrijos"],
        semesters:
          semesters.length > 0 ? semesters : ["1st Semester", "2nd Semester"],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/v1/enrollment/trend
exports.getEnrollmentTrend = async (req, res) => {
  try {
    const { campus } = req.query;
    const campusName = campus || "Boac";

    const trends = await EnrollmentAnalytics.find({ campus: campusName })
      .sort({ academicYear: 1 })
      .select("academicYear semester summaryKpis.totalStudents")
      .lean();

    const formattedTrends = trends.map((t) => ({
      label: `AY ${t.academicYear}`,
      academicYear: t.academicYear,
      totalStudents: t.summaryKpis?.totalStudents || 0,
    }));

    return res.status(200).json({
      success: true,
      data: formattedTrends,
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
    const { campus } = req.query;

    let matchQuery = {};
    if (campus && campus.toLowerCase() !== "all") {
      matchQuery.campus = campus;
    }

    // Queries historical records sorted chronologically by Academic Year
    const rawTrends = await EnrollmentAnalytics.find(matchQuery)
      .sort({ academicYear: 1 })
      .select("academicYear campus summaryKpis.totalStudents");

    // Aggregate totals by Academic Year (handles per-campus or system-wide views)
    const trendMap = new Map();

    rawTrends.forEach((record) => {
      const year = record.academicYear;
      const total = record.summaryKpis?.totalStudents || 0;

      if (trendMap.has(year)) {
        trendMap.set(year, trendMap.get(year) + total);
      } else {
        trendMap.set(year, total);
      }
    });

    // Formats payload to map effortlessly onto Chart.js / Recharts continuous datasets
    const formattedTrendData = Array.from(trendMap.entries()).map(
      ([academicYear, totalStudents]) => ({
        academicYear,
        label: `AY ${academicYear}`,
        total_enrollment: totalStudents,
        totalStudents,
      }),
    );

    return res.status(200).json({
      success: true,
      campus: campus || "All Campuses",
      data: formattedTrendData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Available Dynamic Years and Campuses Filter Options
// @route   GET /api/v1/enrollment/filters
// @access  Private
exports.getEnrollmentFilters = async (req, res) => {
  try {
    const years = await EnrollmentAnalytics.distinct("academicYear");
    const campuses = await EnrollmentAnalytics.distinct("campus");

    return res.status(200).json({
      success: true,
      data: {
        years: years.sort((a, b) => b - a), // Descending order
        campuses: campuses.sort(),
      },
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
        error:
          "Missing required bounds: academicYear and campus references are required.",
      });
    }

    let record = await EnrollmentAnalytics.findOne({ academicYear, campus });

    if (record) {
      if (programs) record.programs = programs;
    } else {
      record = new EnrollmentAnalytics({
        academicYear,
        campus,
        programs,
      });
    }

    // Save automatically runs pre-save hooks to calculate KPIs and YoY growth
    await record.save();

    return res.status(200).json({
      success: true,
      message: `Enrollment metadata metrics ledger for ${campus} (AY ${academicYear}) synced successfully.`,
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
