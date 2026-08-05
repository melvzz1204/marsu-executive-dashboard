const HigherEducation = require("../../models/higherEducation/higherEducationModel");
const HigherEducationTracer = require("../../models/higherEducation/higherEducationTracerModel");

/**
 * @desc Get complete analytics payload for Higher Education Dashboard
 * @route GET /api/v1/higher-education/stats
 */
exports.getHigherEducationStats = async (req, res) => {
  try {
    const { campusBranch } = req.query;
    const matchFilter = {};

    if (campusBranch && campusBranch !== "All Campuses" && campusBranch !== "All") {
      matchFilter.campusBranch = campusBranch;
    }

    const today = new Date();

    // 1. KPI Metric Summary (from HigherEducation)
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
    const tracerData = await HigherEducationTracer.find().sort({ year: 1 });

    const tracerStudyMatrix = tracerData.map((item) => ({
      year: item.year,
      totalGraduates: item.graduateCount,
      employabilityPercentage: Math.round((item.employabilityRate || 0) * 10000) / 100,
    }));

    // Calculate Overall Average Employability Percentage
    const avgEmployability =
      tracerData.length > 0
        ? tracerData.reduce((acc, curr) => acc + (curr.employabilityRate || 0), 0) / tracerData.length
        : 0;

    const cumulativeEmployability = Math.round(avgEmployability * 10000) / 100;

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalPrograms,
          activeAccreditations,
          expiredOrPending,
          cumulativeEmployabilityPercentage: cumulativeEmployability,
        },
        accreditationBreakdown,
        campusBreakdown,
        tracerStudyMatrix,
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
 * @desc Fetch Program Registry cards with optional campus filtering
 * @route GET /api/v1/higher-education/programs
 */
exports.getHigherEducationPrograms = async (req, res) => {
  try {
    const { campusBranch, search, page = 1, limit = 12 } = req.query;
    const query = {};

    if (campusBranch && campusBranch !== "All" && campusBranch !== "All Campuses") {
      query.campusBranch = campusBranch;
    }

    if (search && search.trim() !== "") {
      query.programName = { $regex: search, $options: "i" };
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