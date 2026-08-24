const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");

const VALID_SEMESTERS = new Set(["1st Semester", "2nd Semester", "Summer"]);

const parseAcademicYear = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100
    ? parsed
    : null;
};

const normalizeText = (value, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

// GET /api/v1/enrollment
exports.getEnrollmentSnapshot = async (req, res) => {
  try {
    const { year, campus, semester } = req.query;

    const numericYear = parseAcademicYear(year, 2023);
    const campusName = normalizeText(campus, "Boac");
    const semesterName = normalizeText(semester, "1st Semester");

    if (numericYear === null || !VALID_SEMESTERS.has(semesterName)) {
      return res.status(400).json({
        success: false,
        error: "Academic year or semester is invalid.",
      });
    }

    // 1. Fetch Snapshot for Requested Academic Year
    const snapshot = await EnrollmentAnalytics.findOne({
      academicYear: numericYear,
      campus: campusName,
      semester: semesterName,
    }).lean();

    if (!snapshot) {
      return res.status(200).json({
        success: true,
        data: {
          summaryKpis: {
            totalStudents: 0,
            yoYGrowthPercentage: null,
            hasYoYBaseline: false,
            activeProgramsCount: 0,
            largestProgramName: "N/A",
          },
          programs: [],
        },
      });
    }

    // Current Total Students
    const currentTotal =
      snapshot.summaryKpis?.totalStudents ||
      (snapshot.programs || []).reduce(
        (acc, p) => acc + (p.studentCount || 0),
        0,
      );

    // 2. Dynamic YoY Calculation: Fetch Previous Academic Year (AY - 1)
    const prevSnapshot = await EnrollmentAnalytics.findOne({
      academicYear: numericYear - 1,
      campus: campusName,
      semester: semesterName,
    }).lean();

    let yoYGrowthPercentage = null;
    let hasYoYBaseline = false;

    if (prevSnapshot) {
      const prevTotal =
        prevSnapshot.summaryKpis?.totalStudents ||
        (prevSnapshot.programs || []).reduce(
          (acc, p) => acc + (p.studentCount || 0),
          0,
        );

      if (prevTotal > 0) {
        yoYGrowthPercentage = Number(
          (((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1),
        );
        hasYoYBaseline = true;
      }
    }

    // Map programs sub-documents
    const mappedPrograms = (snapshot.programs || []).map((p, index) => ({
      _id: p._id,
      name: p.programName || "Unnamed Program",
      code: p.programCode || "",
      category: p.department || "General",
      enrollment: p.studentCount || 0,
      isPriority: p.isPriorityProgram || false,
      status: p.isActive ? "active" : "inactive",
      rank: index + 1,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summaryKpis: {
          ...(snapshot.summaryKpis || {}),
          totalStudents: currentTotal,
          yoYGrowthPercentage,
          hasYoYBaseline,
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

// ==========================================
// @desc    Get Available Dynamic Filter Options
// @route   GET /api/v1/enrollment/filters
// @access  Public / Private
// ==========================================
exports.getEnrollmentFilters = async (req, res) => {
  try {
    const years = await EnrollmentAnalytics.distinct("academicYear");
    const campuses = await EnrollmentAnalytics.distinct("campus");
    const semesters = await EnrollmentAnalytics.distinct("semester");

    return res.status(200).json({
      success: true,
      data: {
        years: (years || []).sort((a, b) => b - a), // Descending
        campuses:
          campuses.length > 0
            ? campuses.sort()
            : ["Boac", "Gasan", "Santa Cruz", "Torrijos"],
        semesters:
          semesters.length > 0 ? semesters : ["1st Semester", "2nd Semester"],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// @desc    Get Multi-Year Growth Line Chart Trend Data (Isolates Semesters)
// @route   GET /api/v1/enrollment/trend
// @access  Public / Private
// ==========================================
exports.getEnrollmentTrend = async (req, res) => {
  try {
    const { campus, semester } = req.query;
    const semesterName = semester || "1st Semester";

    // Match by semester to prevent double-counting 1st + 2nd semesters per year
    let matchQuery = { semester: semesterName };

    if (campus && campus.toLowerCase() !== "all") {
      matchQuery.campus = campus;
    }

    const rawTrends = await EnrollmentAnalytics.find(matchQuery)
      .sort({ academicYear: 1 })
      .select("academicYear campus summaryKpis.totalStudents");

    // Aggregate totals by Academic Year (supports 'All Campuses' rollup)
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
      semester: semesterName,
      data: formattedTrendData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// @desc    Upsert/Create Enrollment Snapshot Ledger
// @route   POST /api/v1/enrollment
// @access  Private/Admin
// ==========================================
exports.upsertEnrollmentAnalytics = async (req, res) => {
  try {
    const { academicYear, campus, semester, programs } = req.body;
    const numericYear = parseAcademicYear(academicYear, null);
    const campusName = normalizeText(campus);
    const semesterName = normalizeText(semester, "1st Semester");

    if (numericYear === null || !campusName) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required bounds: academicYear and campus references are required.",
      });
    }

    if (!VALID_SEMESTERS.has(semesterName) || !Array.isArray(programs)) {
      return res.status(400).json({
        success: false,
        error: "A valid semester and programs array are required.",
      });
    }

    let record = await EnrollmentAnalytics.findOne({
      academicYear: numericYear,
      campus: campusName,
      semester: semesterName,
    });

    if (record) {
      record.programs = programs;
    } else {
      record = new EnrollmentAnalytics({
        academicYear: numericYear,
        campus: campusName,
        semester: semesterName,
        programs,
      });
    }

    // Save triggers pre-save hooks for KPI calculations
    await record.save();

    return res.status(200).json({
      success: true,
      message: `Enrollment metadata metrics ledger for ${campusName} (${semesterName}, AY ${numericYear}) synced successfully.`,
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @route   GET /api/v1/enrollment/program-risk
// @access  Public / Private
// ==========================================
exports.getProgramRisk = async (req, res) => {
  try {
    const { campus, semester } = req.query;
    const semesterName = semester || "1st Semester";
    const matchQuery = { semester: semesterName };

    if (campus && campus.toLowerCase() !== "all") {
      matchQuery.campus = campus;
    }

    const snapshots = await EnrollmentAnalytics.find(matchQuery)
      .sort({ academicYear: -1 })
      .select("academicYear campus programs")
      .lean();

    const allYears = [
      ...new Set(snapshots.map((snapshot) => snapshot.academicYear)),
    ].sort((a, b) => a - b);
    const years = allYears.slice(-2).reverse();
    const latestYear = years[0];
    const previousYear = years[1];

    if (latestYear === undefined) {
      return res.status(200).json({
        success: true,
        data: { latestYear: null, previousYear: null, programs: [] },
      });
    }

    const totalsByYear = new Map();
    snapshots.forEach((snapshot) => {
      const programs = totalsByYear.get(snapshot.academicYear) || new Map();
      (snapshot.programs || []).forEach((program) => {
        const name = program.programName || "Unnamed Program";
        const existing = programs.get(name) || {
          name,
          code: program.programCode || "",
          current: 0,
          previous: 0,
        };
        existing[
          snapshot.academicYear === latestYear ? "current" : "previous"
        ] += program.studentCount || 0;
        if (!existing.code && program.programCode)
          existing.code = program.programCode;
        programs.set(name, existing);
      });
      totalsByYear.set(snapshot.academicYear, programs);
    });

    const latestPrograms = totalsByYear.get(latestYear) || new Map();
    const previousPrograms = totalsByYear.get(previousYear) || new Map();
    const programNames = new Set([
      ...latestPrograms.keys(),
      ...previousPrograms.keys(),
    ]);
    const programs = [...programNames].map((name) => ({
      name,
      code:
        latestPrograms.get(name)?.code ||
        previousPrograms.get(name)?.code ||
        "",
      current: latestPrograms.get(name)?.current || 0,
      previous: previousPrograms.get(name)?.previous || 0,
      history: allYears.map((year) => {
        const snapshot = snapshots.filter((item) => item.academicYear === year);
        return snapshot.reduce(
          (sum, item) =>
            sum +
            (item.programs || [])
              .filter((program) => program.programName === name)
              .reduce(
                (programSum, program) =>
                  programSum + (program.studentCount || 0),
                0,
              ),
          0,
        );
      }),
    }));

    const rankedPrograms = programs
      .map((program) => {
        const hasBaseline = previousYear !== undefined && program.previous > 0;
        const changePercentage = hasBaseline
          ? Number(
              (
                ((program.current - program.previous) / program.previous) *
                100
              ).toFixed(1),
            )
          : null;
        const isDeclining = hasBaseline && changePercentage < 0;
        const isLowEnrollment = program.current <= 10;
        return {
          ...program,
          changePercentage,
          signal:
            isDeclining && isLowEnrollment
              ? "Priority review"
              : isDeclining
                ? "Declining trend"
                : isLowEnrollment
                  ? "Low enrollment"
                  : "Monitor",
          score: (isDeclining ? 2 : 0) + (isLowEnrollment ? 2 : 0),
        };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.current - b.current ||
          (a.changePercentage ?? 0) - (b.changePercentage ?? 0),
      )
      .slice(0, 6);

    return res.status(200).json({
      success: true,
      data: {
        latestYear,
        previousYear: previousYear ?? null,
        programs: rankedPrograms,
      },
    });
  } catch (error) {
    console.error("Error in getProgramRisk:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @route   GET /api/v1/enrollment/program-trend
// @access  Public / Private
// ==========================================
exports.getProgramTrend = async (req, res) => {
  try {
    const { campus, semester, programName } = req.query;
    const semesterName = semester || "1st Semester";

    if (!programName) {
      return res.status(400).json({
        success: false,
        error: "programName query parameter is required.",
      });
    }

    let matchQuery = { semester: semesterName };

    if (campus && campus.toLowerCase() !== "all") {
      matchQuery.campus = campus;
    }

    // Fetch the raw trends, but this time select the 'programs' array instead of summary KPIs
    const rawTrends = await EnrollmentAnalytics.find(matchQuery)
      .sort({ academicYear: 1 })
      .select("academicYear campus programs");

    const trendMap = new Map();
    rawTrends.forEach((record) => {
      const enrolledStudents = record.programs
        .filter((program) => program.programName === programName)
        .reduce((sum, program) => sum + (program.studentCount || 0), 0);
      trendMap.set(
        record.academicYear,
        (trendMap.get(record.academicYear) || 0) + enrolledStudents,
      );
    });

    const formattedTrendData = Array.from(trendMap.entries()).map(
      ([academicYear, enrolledStudents]) => ({
        academicYear,
        label: `AY ${academicYear}`,
        enrolledStudents,
      }),
    );

    return res.status(200).json({
      success: true,
      program: programName,
      campus: campus || "All Campuses",
      semester: semesterName,
      data: formattedTrendData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
