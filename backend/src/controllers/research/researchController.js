const ResearchPaper = require("../../models/research/researchAnalyticsModel");

/**
 * @desc    Get all combined dashboard stats (Total Papers, Reach, Top Authors, Category Stats, Summary Metrics, College & Funding Breakdown)
 * @route   GET /api/v1/research/stats
 * @access  Public / Authenticated
 */
exports.getResearchStats = async (req, res) => {
  try {
    const { year } = req.query;
    const matchFilter = year && year !== "All Years" ? { year: Number(year) } : {};

    // 1. Total Papers Count
    const totalPapers = await ResearchPaper.countDocuments(matchFilter);

    // 2. Summary Metric Counts (Completed, Presented, Published, IP Acquired)
    const metricSummaryAggregation = await ResearchPaper.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalCompleted: {
            $sum: { $cond: [{ $eq: ["$isCompleted", true] }, 1, 0] },
          },
          totalPresented: {
            $sum: { $cond: [{ $eq: ["$isPresenting", true] }, 1, 0] },
          },
          totalPublished: {
            $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] },
          },
          totalIPAcquired: {
            $sum: { $cond: [{ $eq: ["$hasIntellectualProperty", true] }, 1, 0] },
          },
        },
      },
    ]);

    const summaryMetrics = metricSummaryAggregation[0]
      ? {
          totalCompleted: metricSummaryAggregation[0].totalCompleted,
          totalPresented: metricSummaryAggregation[0].totalPresented,
          totalPublished: metricSummaryAggregation[0].totalPublished,
          totalIPAcquired: metricSummaryAggregation[0].totalIPAcquired,
        }
      : {
          totalCompleted: 0,
          totalPresented: 0,
          totalPublished: 0,
          totalIPAcquired: 0,
        };

        // 3. Project Reach Aggregation & Average Duration
        const reachPipeline = [
          { $match: matchFilter },
          {
            $group: {
              _id: "$scope",
              count: { $sum: 1 },
              avgDuration: { $avg: "$durationDays" },
            },
          },
        ];

    const reachResults = await ResearchPaper.aggregate(reachPipeline);

    const projectReach = {
      international: 0,
      national: 0,
      regional: 0,
      avgDurationDays: 0,
    };

    let totalDurationSum = 0;
    let durationCount = 0;

    reachResults.forEach((item) => {
      if (item._id === "International Scope") projectReach.international = item.count;
      if (item._id === "National Scope") projectReach.national = item.count;
      if (item._id === "Regional Scope") projectReach.regional = item.count;

      if (item.avgDuration) {
        totalDurationSum += item.avgDuration * item.count;
        durationCount += item.count;
      }
    });

    projectReach.avgDurationDays = durationCount > 0 ? Math.round(totalDurationSum / durationCount) : 0;

    // 4. Top Authors Ranking (Top 5)
    const topAuthors = await ResearchPaper.aggregate([
      { $match: matchFilter },
      { $unwind: "$authors" },
      {
        $group: {
          _id: "$authors",
          papers: { $sum: 1 },
        },
      },
      { $sort: { papers: -1, _id: 1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: "$_id",
          papers: 1,
        },
      },
    ]);

    const rankedTopAuthors = topAuthors.map((author, index) => ({
      rank: index + 1,
      name: author.name,
      papers: author.papers,
    }));

    // 5. Papers by Category Stats
    const categoryAggregation = await ResearchPaper.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const defaultCategories = [
      "Other",
      "Impact Analysis",
      "Model Development",
      "Social Perception",
      "Qualitative Study",
    ];

    const categoryStatsMap = {};
    defaultCategories.forEach((cat) => (categoryStatsMap[cat] = 0));

    categoryAggregation.forEach((item) => {
      if (item._id) categoryStatsMap[item._id] = item.count;
    });

    const categoryStats = Object.keys(categoryStatsMap).map((catName) => ({
      name: catName,
      count: categoryStatsMap[catName],
    }));

    // 6. Macro Departmental Breakdown & Total Funding
    const collegeAggregation = await ResearchPaper.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$collegeCode",
          papersPublished: { $sum: 1 },
          grantsSecuredMillions: { $sum: "$fundingGrantMillions" },
        },
      },
      { $sort: { papersPublished: -1 } },
    ]);

    const departmentalBreakdown = collegeAggregation.map((item) => ({
      collegeCode: item._id || "UNASSIGNED",
      papersPublished: item.papersPublished,
      grantsSecuredMillions: Math.round(item.grantsSecuredMillions * 100) / 100,
    }));

    const totalFundingMillions = departmentalBreakdown.reduce(
      (sum, item) => sum + item.grantsSecuredMillions,
      0
    );

    // 7. Research Lifecycle Breakdown (For detailed analytics charts/cards)
    const lifecycleStats = await ResearchPaper.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          proposalStatus: [
            { $group: { _id: "$proposalStatus", count: { $sum: 1 } } },
          ],
          completionStatus: [
            { $group: { _id: "$completionStatus", count: { $sum: 1 } } },
          ],
          publicationStatus: [
            { $group: { _id: "$publicationStatus", count: { $sum: 1 } } },
          ],
          intellectualPropertyType: [
            { $group: { _id: "$intellectualPropertyTypeAcquired", count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalPapers,
        summaryMetrics,
        totalFundingMillions: Math.round(totalFundingMillions * 100) / 100,
        projectReach,
        topAuthors: rankedTopAuthors,
        categoryStats,
        departmentalBreakdown,
        lifecycleStats: lifecycleStats[0] || {},
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching research statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Fetch paginated research papers with filters & search (For Modal / Table View)
 * @route   GET /api/v1/research/papers
 * @access  Public / Authenticated
 */
exports.getResearchPapers = async (req, res) => {
  try {
    const {
      search,
      year,
      scope,
      category,
      collegeCode,
      isCompleted,
      isPresenting,
      isPublished,
      hasIP,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search && search.trim() !== "") {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { authors: { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }

    if (year && year !== "All Years") query.year = Number(year);
    if (scope && scope !== "All Scopes") query.scope = scope;
    if (category && category !== "All Categories") query.category = category;
    if (collegeCode) query.collegeCode = collegeCode.toUpperCase();

    // Metric filter flags
    if (isCompleted === "true") query.isCompleted = true;
    if (isPresenting === "true") query.isPresenting = true;
    if (isPublished === "true") query.isPublished = true;
    if (hasIP === "true") query.hasIntellectualProperty = true;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await ResearchPaper.countDocuments(query);
    const papers = await ResearchPaper.find(query)
      .sort({ year: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: papers.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      data: papers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching research papers",
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new paper entry
 * @route   POST /api/v1/research/papers
 * @access  Authenticated
 */
exports.createResearchPaper = async (req, res) => {
  try {
    const paper = await ResearchPaper.create(req.body);
    return res.status(201).json({
      success: true,
      message: "Research paper successfully created",
      data: paper,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create paper entry",
      error: error.message,
    });
  }
};

/**
 * @desc    Seed sample research paper records
 * @route   POST /api/v1/research/seed
 */
exports.seedResearchPapers = async (req, res) => {
  try {
    const seedData = [
      {
        title: "Level of Satisfaction of the Residents of Brgy. Pili, Mogpog, Marinduque on Government Service Delivery",
        authors: ["Generoso E. Udanga", "Abraham L. Cuevas"],
        year: 2023,
        scope: "International Scope",
        conferenceOrJournal: "PSU BIMP-EAGA International Research Conference",
        category: "Social Perception",
        venue: "City State Asturias Hotel, Puerto Princesa, Palawan",
        durationDays: 140,
        status: "COMPLETED",
        collegeCode: "CICS",
        fundingGrantMillions: 1.2,
        proposalStatus: "Approved",
        completionStatus: "Completed",
        presentationStage: "International Scope",
        presentationForumVenue: "City State Asturias Hotel",
        publicationStatus: "Published",
        intellectualPropertyTypeAcquired: "Copyrighted",
        isCompleted: true,
        isPresenting: true,
        isPublished: true,
        hasIntellectualProperty: true,
      },
      {
        title: "Lived Experiences of Selected MSMEs on Technological Assistance",
        authors: ["Michael V. Capina"],
        year: 2023,
        scope: "International Scope",
        conferenceOrJournal: "2023 International Conference on Sustainable Agri-environment E...",
        category: "Qualitative Study",
        venue: "Mariano Marcos State University",
        durationDays: 110,
        status: "COMPLETED",
        collegeCode: "CBMA",
        fundingGrantMillions: 0.85,
        proposalStatus: "Approved",
        completionStatus: "Completed",
        presentationStage: "International Scope",
        presentationForumVenue: "Mariano Marcos State University",
        publicationStatus: "Unpublished",
        intellectualPropertyTypeAcquired: "None",
        isCompleted: true,
        isPresenting: true,
        isPublished: false,
        hasIntellectualProperty: false,
      },
      {
        title: "Tracer Study of Diploma in Midwifery Graduates in the Marinduque State College from 2006-2022",
        authors: ["Abegail D. Magsamit"],
        year: 2023,
        scope: "National Scope",
        conferenceOrJournal: "35th APSOM Annual Convention — Association of Philippine Sc...",
        category: "Other",
        venue: "Century Park Hotel, Malate, Manila",
        durationDays: 95,
        status: "COMPLETED",
        collegeCode: "CED",
        fundingGrantMillions: 0.5,
        proposalStatus: "Approved",
        completionStatus: "Completed",
        presentationStage: "National Scope",
        presentationForumVenue: "Century Park Hotel, Manila",
        publicationStatus: "Published",
        intellectualPropertyTypeAcquired: "None",
        isCompleted: true,
        isPresenting: true,
        isPublished: true,
        hasIntellectualProperty: false,
      },
    ];

    await ResearchPaper.insertMany(seedData);
    return res.status(200).json({ success: true, message: "Sample data seeded successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};