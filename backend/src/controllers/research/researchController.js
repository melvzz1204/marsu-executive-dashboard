const ResearchPaper = require("../../models/research/researchAnalyticsModel");

/**
 * Merge key treating "Surname, Given ..." and "Given ... Surname" as the
 * same person: reorder to given-first, then key on first + last tokens
 * (periods stripped) so middle initials don't split one author in two.
 * "Palma, Merryrose R." and "Merryrose Palma" both key to "merryrose|palma".
 */
function authorMergeKey(name) {
  let t = String(name || "")
    .trim()
    .toLowerCase()
    // Fold diacritics so "Capiña" and "Capina" merge ("ñ" -> "n").
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "");
  if (t.includes(",")) {
    const [surnamePart, ...rest] = t.split(",");
    t = `${rest.join(" ").trim()} ${surnamePart.trim()}`.trim();
  }
  const toks = t.split(/\s+/).filter(Boolean);
  if (toks.length === 0) return "";
  if (toks.length === 1) return toks[0];
  return `${toks[0]}|${toks[toks.length - 1]}`;
}

/**
 * Collapse name variants of the same author into single ranking entries,
 * summing paper counts and keeping the fullest display name.
 */
function mergeAuthorVariants(authors) {
  const merged = new Map();
  for (const a of authors) {
    const key = authorMergeKey(a.name);
    if (!key) continue;
    const existing = merged.get(key);
    if (existing) {
      existing.papers += a.papers;
      const candidateTokens = String(a.name || "").trim().split(/\s+/).length;
      const currentTokens = String(existing.name || "").trim().split(/\s+/).length;
      if (candidateTokens > currentTokens) existing.name = a.name;
    } else {
      merged.set(key, { name: a.name, papers: a.papers });
    }
  }
  return [...merged.values()].sort(
    (a, b) => b.papers - a.papers || a.name.localeCompare(b.name),
  );
}

/**
 * @desc    Get all combined dashboard stats (Total Papers, Reach, Top Authors, Category Stats, Summary Metrics, College & Funding Breakdown)
 * @route   GET /api/v1/research/stats
 * @access  Public / Authenticated
 */
exports.getResearchStats = async (req, res) => {
  try {
    const { year } = req.query;
    const matchFilter =
      year && year !== "All Years" ? { year: Number(year) } : {};

    // 1. Total Papers Count
    const totalPapers = await ResearchPaper.countDocuments(matchFilter);

    // 1b. Distinct years (always across the full collection so the year filter
    // options stay stable regardless of the currently selected year).
    const distinctYears = await ResearchPaper.distinct("year");
    const availableYears = distinctYears
      .filter((y) => y != null)
      .sort((a, b) => b - a);

    // 2. Summary Metric Counts (Completed, Ongoing, Published, IP Acquired)
    // completionStatus is free-text from Excel — compare case-insensitively.
    const metricSummaryAggregation = await ResearchPaper.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalCompleted: {
            $sum: { $cond: [{ $eq: ["$isCompleted", true] }, 1, 0] },
          },
          totalOngoing: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    { $toLower: { $ifNull: ["$completionStatus", ""] } },
                    "ongoing",
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalPresented: {
            $sum: { $cond: [{ $eq: ["$isPresenting", true] }, 1, 0] },
          },
          totalPublished: {
            $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] },
          },
          totalIPAcquired: {
            $sum: {
              $cond: [{ $eq: ["$hasIntellectualProperty", true] }, 1, 0],
            },
          },
        },
      },
    ]);

    const summaryMetrics = metricSummaryAggregation[0]
      ? {
          totalCompleted: metricSummaryAggregation[0].totalCompleted,
          totalOngoing: metricSummaryAggregation[0].totalOngoing,
          totalPresented: metricSummaryAggregation[0].totalPresented,
          totalPublished: metricSummaryAggregation[0].totalPublished,
          totalIPAcquired: metricSummaryAggregation[0].totalIPAcquired,
        }
      : {
          totalCompleted: 0,
          totalOngoing: 0,
          totalPresented: 0,
          totalPublished: 0,
          totalIPAcquired: 0,
        };

    // 3. Project Reach Aggregation (scope counts only)
    const reachPipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: "$scope",
          count: { $sum: 1 },
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

    reachResults.forEach((item) => {
      if (item._id === "International Scope")
        projectReach.international = item.count;
      if (item._id === "National Scope") projectReach.national = item.count;
      if (item._id === "Regional Scope") projectReach.regional = item.count;
    });

    // Average duration excludes zero/unreported durations so missing
    // durationDays values don't drag the average toward 0.
    const avgDurationAgg = await ResearchPaper.aggregate([
      { $match: { ...matchFilter, durationDays: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$durationDays" } } },
    ]);

    projectReach.avgDurationDays = avgDurationAgg[0]?.avg
      ? Math.round(avgDurationAgg[0].avg)
      : 0;

    // 4. Top Authors Ranking (full list, highest to lowest) — counts
    // every paper an author appears on, including collaborative works.
    // "Unknown Author" placeholders are excluded. Name variants of the
    // same person ("Merryrose Palma" vs "Palma, Merryrose R.") are merged
    // by first-name + surname key, keeping the fullest display name.
    const topAuthors = await ResearchPaper.aggregate([
      { $match: matchFilter },
      { $unwind: "$authors" },
      { $match: { authors: { $ne: "Unknown Author" } } },
      {
        $group: {
          _id: "$authors",
          papers: { $sum: 1 },
        },
      },
      { $sort: { papers: -1, _id: 1 } },
      {
        $project: {
          _id: 0,
          name: "$_id",
          papers: 1,
        },
      },
    ]);

    const rankedTopAuthors = mergeAuthorVariants(topAuthors).map(
      (author, index) => ({
        rank: index + 1,
        name: author.name,
        papers: author.papers,
      }),
    );

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
      0,
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
            {
              $group: {
                _id: "$intellectualPropertyTypeAcquired",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // 8. Papers-per-year trend (for the year-over-year chart)
    const papersByYearAgg = await ResearchPaper.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$year", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const papersByYear = papersByYearAgg
      .filter((item) => item._id != null)
      .map((item) => ({ year: item._id, count: item.count }));

    // 8b. Annual target tracker: monthly output for every publication year.
    // Records only carry a publication year, so the month is taken from the
    // date the entry entered the registry (createdAt). Returning all years at
    // once lets the client switch reporting year without another request.
    const currentYear = new Date().getFullYear();
    const reportingYear =
      year && year !== "All Years"
        ? Number(year)
        : papersByYear.some((row) => row.year === currentYear)
          ? currentYear
          : papersByYear.length > 0
            ? papersByYear[papersByYear.length - 1].year
            : currentYear;

    const papersByMonthAgg = await ResearchPaper.aggregate([
      {
        $group: {
          _id: { year: "$year", month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyByYearMap = new Map();
    papersByMonthAgg.forEach((row) => {
      const rowYear = row._id?.year;
      const rowMonth = row._id?.month;
      if (rowYear == null || rowMonth == null) return;
      if (!monthlyByYearMap.has(rowYear)) monthlyByYearMap.set(rowYear, new Map());
      monthlyByYearMap.get(rowYear).set(rowMonth, row.count);
    });

    const buildMonthlySeries = (countsMap) =>
      Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        count: countsMap?.get(index + 1) || 0,
      }));

    const papersByMonthByYear = {};
    monthlyByYearMap.forEach((countsMap, rowYear) => {
      papersByMonthByYear[String(rowYear)] = buildMonthlySeries(countsMap);
    });

    const papersByMonth =
      papersByMonthByYear[String(reportingYear)] ?? buildMonthlySeries(null);

    const trackerActual =
      papersByYear.find((row) => row.year === reportingYear)?.count ??
      papersByMonth.reduce((sum, row) => sum + row.count, 0);

    // Scope values arrive either as "International Scope" or "International"
    // depending on the ingestion source, so collapse them to a stable key.
    const normalizeScope = (scope) => {
      const value = String(scope || "").toLowerCase();
      if (value.startsWith("international")) return "international";
      if (value.startsWith("national")) return "national";
      if (value.startsWith("regional")) return "regional";
      return "other";
    };

    // 9. Papers-per-year split by scope (stacked year-over-year trend)
    const papersByYearScopeAgg = await ResearchPaper.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { year: "$year", scope: "$scope" },
          count: { $sum: 1 },
        },
      },
    ]);

    const yearScopeMap = new Map();
    papersByYearScopeAgg.forEach((item) => {
      const year = item._id?.year;
      if (year == null) return;
      if (!yearScopeMap.has(year)) {
        yearScopeMap.set(year, {
          year,
          international: 0,
          national: 0,
          regional: 0,
          total: 0,
        });
      }
      const bucket = yearScopeMap.get(year);
      const scopeKey = normalizeScope(item._id?.scope);
      if (scopeKey !== "other") bucket[scopeKey] += item.count;
      bucket.total += item.count;
    });

    const papersByYearScope = Array.from(yearScopeMap.values()).sort(
      (a, b) => a.year - b.year,
    );

    // 10. Category x Scope cross-tab (research profile heatmap)
    const categoryScopeAgg = await ResearchPaper.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { category: "$category", scope: "$scope" },
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryScopeMap = new Map();
    categoryScopeAgg.forEach((item) => {
      const category = item._id?.category || "Other";
      if (!categoryScopeMap.has(category)) {
        categoryScopeMap.set(category, {
          category,
          international: 0,
          national: 0,
          regional: 0,
          total: 0,
        });
      }
      const bucket = categoryScopeMap.get(category);
      const scopeKey = normalizeScope(item._id?.scope);
      if (scopeKey !== "other") bucket[scopeKey] += item.count;
      bucket.total += item.count;
    });

    const categoryByScope = Array.from(categoryScopeMap.values()).sort(
      (a, b) => b.total - a.total,
    );

    // 11. Author collaboration (co-authorship among the most active researchers)
    const collaborationAgg = await ResearchPaper.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, authorSets: { $push: "$authors" } } },
    ]);

    const authorSets = (collaborationAgg[0]?.authorSets || [])
      .filter((authors) => Array.isArray(authors) && authors.length > 0)
      .map((authors) => [
        ...new Set(
          authors.map((name) => String(name || "").trim()).filter(Boolean),
        ),
      ]);

    const authorCounts = new Map();
    authorSets.forEach((authors) => {
      authors.forEach((name) => {
        authorCounts.set(name, (authorCounts.get(name) || 0) + 1);
      });
    });

    const collabAuthorNames = Array.from(authorCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([name]) => name);
    const collabAuthorSet = new Set(collabAuthorNames);

    const pairWeights = new Map();
    authorSets.forEach((authors) => {
      const members = authors.filter((name) => collabAuthorSet.has(name));
      for (let i = 0; i < members.length; i += 1) {
        for (let j = i + 1; j < members.length; j += 1) {
          const [a, b] = [members[i], members[j]].sort();
          const key = `${a}|||${b}`;
          pairWeights.set(key, (pairWeights.get(key) || 0) + 1);
        }
      }
    });

    const collaboration = {
      nodes: collabAuthorNames.map((name) => ({
        id: name,
        name,
        papers: authorCounts.get(name) || 0,
      })),
      links: Array.from(pairWeights.entries())
        .map(([key, weight]) => {
          const [source, target] = key.split("|||");
          return { source, target, weight };
        })
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 24),
    };

    // 12. Program-level output trend (sparkline small multiples)
    const programAgg = await ResearchPaper.aggregate([
      {
        $match: {
          ...matchFilter,
          academicProgram: { $nin: [null, "", "N/A"] },
        },
      },
      {
        $group: {
          _id: { program: "$academicProgram", year: "$year" },
          count: { $sum: 1 },
        },
      },
    ]);

    const programMap = new Map();
    programAgg.forEach((item) => {
      const program = item._id?.program;
      const year = item._id?.year;
      if (!program || year == null) return;
      if (!programMap.has(program)) {
        programMap.set(program, { program, total: 0, points: new Map() });
      }
      const bucket = programMap.get(program);
      bucket.total += item.count;
      bucket.points.set(year, item.count);
    });

    const programTrend = Array.from(programMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map((bucket) => ({
        program: bucket.program,
        total: bucket.total,
        points: Array.from(bucket.points.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([year, count]) => ({ year, count })),
      }));

    return res.status(200).json({
      success: true,
      data: {
        totalPapers,
        availableYears,
        summaryMetrics,
        totalFundingMillions: Math.round(totalFundingMillions * 100) / 100,
        projectReach,
        topAuthors: rankedTopAuthors,
        categoryStats,
        departmentalBreakdown,
        lifecycleStats: lifecycleStats[0] || {},
        papersByYear,
        papersByYearScope,
        categoryByScope,
        collaboration,
        programTrend,
        trackerYear: reportingYear,
        trackerActual,
        papersByMonth,
        papersByMonthByYear,
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
        { academicProgram: { $regex: search, $options: "i" } },
        { collegeCode: { $regex: search, $options: "i" } },
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
        title:
          "Level of Satisfaction of the Residents of Brgy. Pili, Mogpog, Marinduque on Government Service Delivery",
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
        title:
          "Lived Experiences of Selected MSMEs on Technological Assistance",
        authors: ["Michael V. Capina"],
        year: 2023,
        scope: "International Scope",
        conferenceOrJournal:
          "2023 International Conference on Sustainable Agri-environment E...",
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
        title:
          "Tracer Study of Diploma in Midwifery Graduates in the Marinduque State College from 2006-2022",
        authors: ["Abegail D. Magsamit"],
        year: 2023,
        scope: "National Scope",
        conferenceOrJournal:
          "35th APSOM Annual Convention — Association of Philippine Sc...",
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
    return res
      .status(200)
      .json({ success: true, message: "Sample data seeded successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
