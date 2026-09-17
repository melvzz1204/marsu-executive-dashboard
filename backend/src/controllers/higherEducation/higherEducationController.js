const HigherEducation = require("../../models/higherEducation/higherEducationModel");
const HigherEducationTracer = require("../../models/higherEducation/higherEducationTracerModel");
const {
  ALL_PROGRAMS_LABEL,
  ALL_CAMPUSES_LABEL,
  isInstitutionRow,
  buildYearSeries,
  summarizePrograms,
} = require("../../services/higherEducation/tracerAggregation");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactRegex = (value) => new RegExp(`^${escapeRegex(value)}$`, "i");

// Treat missing values and the aggregate "All" labels as "no filter".
const isAllValue = (value, allLabel) => {
  if (value === undefined || value === null) return true;
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "all" ||
    normalized === allLabel.toLowerCase()
  );
};

/**
 * @desc Get complete analytics payload for Higher Education Dashboard
 * @route GET /api/v1/higher-education/stats
 * @query campusBranch, programName, collegeName, year
 */
exports.getHigherEducationStats = async (req, res) => {
  try {
    const { campusBranch, programName, collegeName, year } = req.query;
    const hasCampusFilter = !isAllValue(campusBranch, ALL_CAMPUSES_LABEL);
    const hasProgramFilter = !isAllValue(programName, ALL_PROGRAMS_LABEL);
    const hasCollegeFilter = Boolean(
      collegeName &&
        String(collegeName).trim() !== "" &&
        String(collegeName).trim().toLowerCase() !== "all",
    );
    const hasYearFilter = Boolean(
      year !== undefined &&
        year !== null &&
        String(year).trim() !== "" &&
        String(year).trim().toLowerCase() !== "all" &&
        !isNaN(parseInt(year, 10)),
    );
    const yearValue = hasYearFilter ? parseInt(year, 10) : null;

    const matchFilter = {};
    if (hasCampusFilter) matchFilter.campusBranch = campusBranch;
    if (hasProgramFilter) matchFilter.programName = exactRegex(programName);

    const today = new Date();

    // 1. KPI Metric Summary (from HigherEducation registry)
    const totalPrograms = await HigherEducation.countDocuments(matchFilter);

    // Active Accreditations (Accredited AND End Date >= Today)
    const activeAccreditations = await HigherEducation.countDocuments({
      ...matchFilter,
      isAccredited: true,
      $or: [{ endDate: { $gte: today } }, { endDate: null }],
    });

    // Expired or Pending Review
    const expiredOrPending = totalPrograms - activeAccreditations;

    // 2. Breakdown by Accreditation Level (For Doughnut Chart)
    const levelAggregation = await HigherEducation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$accreditationStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const accreditationBreakdown = levelAggregation.map((item) => ({
      level: item._id || "Not Accredited",
      count: item.count,
    }));

    // 3. Programs Per Campus (For Campus Bar Chart)
    const campusBreakdown = await HigherEducation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$campusBranch",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          campus: "$_id",
          count: 1,
        },
      },
    ]);

    // 4. Multi-Year Tracer Matrix (from HigherEducationTracer)
    // Scope filter excludes the year so availableYears stays stable in the UI.
    const scopeFilter = {};
    if (hasCampusFilter) scopeFilter.campusBranch = campusBranch;
    if (hasProgramFilter) scopeFilter.programName = exactRegex(programName);
    if (hasCollegeFilter) scopeFilter.collegeName = exactRegex(collegeName);

    const availableYears = (
      await HigherEducationTracer.distinct("year", scopeFilter)
    )
      .filter((value) => Number.isFinite(Number(value)))
      .map((value) => Number(value))
      .sort((a, b) => b - a);

    const tracerFilter = { ...scopeFilter };
    if (hasYearFilter) tracerFilter.year = yearValue;

    const tracerData = await HigherEducationTracer.find(tracerFilter)
      .sort({ year: 1 })
      .lean();

    // When a program is selected, report that program's series. Otherwise
    // prefer institution-wide rows; if the collection only contains
    // program-level rows, roll them up into institution totals per year.
    const institutionRows = tracerData.filter(isInstitutionRow);
    const programRows = tracerData.filter((row) => !isInstitutionRow(row));
    const matrixSource = hasProgramFilter
      ? tracerData
      : institutionRows.length > 0
        ? institutionRows
        : programRows;

    const tracerStudyMatrix = buildYearSeries(matrixSource);

    // Program-level outcomes (graduate-weighted), grouped per program/campus.
    const programEmployability = summarizePrograms(tracerData);

    const totalGraduatesSum = tracerStudyMatrix.reduce(
      (acc, row) => acc + (row.totalGraduates || 0),
      0,
    );

    const totalEmployedSum = tracerStudyMatrix.reduce(
      (acc, row) => acc + (row.employedCount || 0),
      0,
    );

    const cumulativeEmployability =
      totalGraduatesSum > 0
        ? Math.round((totalEmployedSum / totalGraduatesSum) * 10000) / 100
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalPrograms,
          activeAccreditations,
          expiredOrPending,
          totalGraduates: totalGraduatesSum,
          totalEmployed: totalEmployedSum,
          cumulativeEmployabilityPercentage: cumulativeEmployability,
        },
        accreditationBreakdown,
        campusBreakdown,
        tracerStudyMatrix,
        programEmployability,
        availableYears,
        selectedProgram: hasProgramFilter ? programName : ALL_PROGRAMS_LABEL,
        selectedCampus: hasCampusFilter ? campusBranch : ALL_CAMPUSES_LABEL,
        selectedCollege: hasCollegeFilter ? collegeName : null,
        selectedYear: hasYearFilter ? yearValue : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching higher education analytics stats",
      error: error.message,
    });
  }
};

/**
 * @desc Get the multi-year employability tracer series for one program
 * @route GET /api/v1/higher-education/tracer
 * @query programName (required), campusBranch, collegeName, year
 */
exports.getProgramTracer = async (req, res) => {
  try {
    const { programName, campusBranch, collegeName, year } = req.query;

    if (isAllValue(programName, ALL_PROGRAMS_LABEL)) {
      return res.status(400).json({
        success: false,
        error: "programName query parameter is required.",
      });
    }

    const scopeFilter = { programName: exactRegex(programName) };
    if (!isAllValue(campusBranch, ALL_CAMPUSES_LABEL)) {
      scopeFilter.campusBranch = campusBranch;
    }
    if (collegeName && String(collegeName).trim() !== "") {
      scopeFilter.collegeName = exactRegex(collegeName);
    }

    const availableYears = (
      await HigherEducationTracer.distinct("year", scopeFilter)
    )
      .filter((value) => Number.isFinite(Number(value)))
      .map((value) => Number(value))
      .sort((a, b) => b - a);

    const filter = { ...scopeFilter };
    const hasYearFilter = Boolean(
      year !== undefined &&
        year !== null &&
        String(year).trim() !== "" &&
        String(year).trim().toLowerCase() !== "all" &&
        !isNaN(parseInt(year, 10)),
    );
    if (hasYearFilter) filter.year = parseInt(year, 10);

    const tracerData = await HigherEducationTracer.find(filter)
      .sort({ year: 1 })
      .lean();

    const series = buildYearSeries(tracerData);
    const summary = summarizePrograms(tracerData)[0] || null;

    return res.status(200).json({
      success: true,
      program: programName,
      campus: isAllValue(campusBranch, ALL_CAMPUSES_LABEL)
        ? ALL_CAMPUSES_LABEL
        : campusBranch,
      count: tracerData.length,
      data: { series, summary, availableYears },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching program employability tracer data",
      error: error.message,
    });
  }
};

/**
 * @desc Fetch Program Registry cards with optional campus/program filtering
 * @route GET /api/v1/higher-education/programs
 */
exports.getHigherEducationPrograms = async (req, res) => {
  try {
    const {
      campusBranch,
      programName,
      search,
      page = 1,
      limit = 12,
    } = req.query;
    const query = {};

    if (!isAllValue(campusBranch, ALL_CAMPUSES_LABEL)) {
      query.campusBranch = campusBranch;
    }

    if (!isAllValue(programName, ALL_PROGRAMS_LABEL)) {
      query.programName = exactRegex(programName);
    } else if (search && search.trim() !== "") {
      query.programName = { $regex: escapeRegex(search), $options: "i" };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await HigherEducation.countDocuments(query);
    const programs = await HigherEducation.find(query)
      .sort({ campusBranch: 1, programName: 1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: programs.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      data: programs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching program registry list",
      error: error.message,
    });
  }
};
