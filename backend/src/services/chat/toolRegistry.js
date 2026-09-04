/**
 * Tool Registry
 * -------------
 * Declares the data tools the LLM may call, and executes them with
 * server-side role enforcement. The LLM NEVER decides access — the
 * executor injects role scoping regardless of the arguments it passes.
 *
 * Tools query the same Mongoose models the dashboards use, so answers
 * always reflect live MongoDB data.
 */
const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");
const ResearchPaper = require("../../models/research/researchAnalyticsModel");
const LicensureExam = require("../../models/higherEducation/licensureExamModel");
const BudgetUtilization = require("../../models/finance/budgetUtilizationModel");
const HigherEducation = require("../../models/higherEducation/higherEducationModel");
const HigherEducationTracer = require("../../models/higherEducation/higherEducationTracerModel");
const GlobalRecognition = require("../../models/achievements/globalRecognitionModel");
const LicensurePerformance = require("../../models/achievements/licensurePerformanceModel");

const CAMPUSES = ["Boac", "Gasan", "Santa Cruz", "Torrijos"];
const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clampYear = (value, fallback) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : fallback;
};

const normalizeCampus = (value) =>
  CAMPUSES.find(
    (c) =>
      c.toLowerCase() ===
      String(value || "")
        .trim()
        .toLowerCase(),
  ) || null;

const normalizeSemester = (value) =>
  SEMESTERS.find(
    (s) =>
      s.toLowerCase() ===
      String(value || "")
        .trim()
        .toLowerCase(),
  ) || null;

// Enrollment uploads have historically stored inconsistent campus casing
// (for example, "Santa cruz" instead of "Santa Cruz"). Keep the canonical
// value returned to the model while matching MongoDB case-insensitively.
const campusQuery = (campus) => ({
  $regex: `^${String(campus).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`,
  $options: "i",
});

/** Cap and sanitize a limit argument. */
const sanitizeLimit = (value, fallback, max) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
};

// ---------------------------------------------------------------------------
// Tool implementations (pure data access — no req/res)
// ---------------------------------------------------------------------------

async function getEnrollmentSnapshot(args = {}, user) {
  const year = clampYear(args.year, new Date().getFullYear() - 1);
  const campus = normalizeCampus(args.campus) || "Boac";
  const semester = normalizeSemester(args.semester) || "1st Semester";

  const snapshot = await EnrollmentAnalytics.findOne({
    academicYear: year,
    campus: campusQuery(campus),
    semester,
  }).lean();

  if (!snapshot) {
    return {
      found: false,
      message: `No enrollment data for ${campus} campus, ${semester}, AY ${year}-${year + 1}.`,
    };
  }

  const programs = (snapshot.programs || [])
    .filter((p) => p.isActive !== false)
    .sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))
    .map((p) => ({
      program: p.programName,
      code: p.programCode,
      department: p.department,
      students: p.studentCount || 0,
      isPriority: Boolean(p.isPriorityProgram),
    }));

  return {
    found: true,
    academicYear: `${year}-${year + 1}`,
    campus,
    semester,
    totalStudents: snapshot.summaryKpis?.totalStudents ?? null,
    yoyGrowthPercentage: snapshot.summaryKpis?.yoYGrowthPercentage ?? null,
    activePrograms:
      snapshot.summaryKpis?.activeProgramsCount ?? programs.length,
    largestProgram: snapshot.summaryKpis?.largestProgramName ?? null,
    priorityEnrollmentPercentage:
      snapshot.summaryKpis?.priorityEnrollmentPercentage ?? null,
    programs,
  };
}

async function getEnrollmentTrend(args = {}, user) {
  const toYear = clampYear(args.toYear, new Date().getFullYear() - 1);
  const fromYear = clampYear(args.fromYear, toYear - 4);
  const campus = normalizeCampus(args.campus) || "Boac";
  const semester = normalizeSemester(args.semester) || "1st Semester";
  const programFilter = String(args.program || "")
    .trim()
    .toLowerCase();

  const docs = await EnrollmentAnalytics.find({
    academicYear: { $gte: fromYear, $lte: toYear },
    campus: campusQuery(campus),
    semester,
  })
    .sort({ academicYear: 1 })
    .lean();

  if (docs.length === 0) {
    return {
      found: false,
      message: `No enrollment data found for ${campus} campus, ${semester}, between AY ${fromYear} and ${toYear}.`,
    };
  }

  const series = docs.map((doc) => {
    let total = doc.summaryKpis?.totalStudents ?? 0;
    let programRows = [];

    if (programFilter) {
      programRows = (doc.programs || []).filter(
        (p) =>
          (p.programName || "").toLowerCase().includes(programFilter) ||
          (p.programCode || "").toLowerCase().includes(programFilter),
      );
      total = programRows.reduce((sum, p) => sum + (p.studentCount || 0), 0);
    }

    return {
      academicYear: `${doc.academicYear}-${doc.academicYear + 1}`,
      totalStudents: total,
      matchedPrograms: programRows.map((p) => ({
        program: p.programName,
        code: p.programCode,
        students: p.studentCount || 0,
      })),
    };
  });

  return {
    found: true,
    campus,
    semester,
    programFilter: programFilter || null,
    series,
  };
}

async function getResearchMetrics(args, user) {
  const year = clampYear(args.year, null);
  const query = {};

  if (year) query.year = year;

  // Role scoping: deans only see their own college's research.
  if (user.role === "dean") {
    if (user.collegeId) {
      query.collegeId = user.collegeId;
    } else {
      return {
        found: false,
        message:
          "Your account is not linked to a college, so no research data is available.",
      };
    }
  }

  const papers = await ResearchPaper.find(query)
    .sort({ year: -1 })
    .limit(sanitizeLimit(args.limit, 200, 500))
    .lean();

  if (papers.length === 0) {
    return {
      found: false,
      message: year
        ? `No research records found for ${year}.`
        : "No research records found.",
    };
  }

  const byYear = {};
  const byScope = {};
  const byStatus = {};
  let totalFunding = 0;

  for (const p of papers) {
    byYear[p.year] = (byYear[p.year] || 0) + 1;
    byScope[p.scope] = (byScope[p.scope] || 0) + 1;
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    totalFunding += p.fundingGrantMillions || 0;
  }

  return {
    found: true,
    scope: user.role === "dean" ? "your college" : "institution-wide",
    yearFilter: year,
    totalPapers: papers.length,
    published: papers.filter((p) => p.isPublished).length,
    completed: papers.filter((p) => p.isCompleted).length,
    withIntellectualProperty: papers.filter((p) => p.hasIntellectualProperty)
      .length,
    totalFundingMillionsPHP: Math.round(totalFunding * 100) / 100,
    papersByYear: byYear,
    papersByScope: byScope,
    papersByStatus: byStatus,
    recentTitles: papers.slice(0, 10).map((p) => ({
      title: p.title,
      year: p.year,
      scope: p.scope,
      status: p.status,
    })),
  };
}

async function getLicensurePerformance(args, user) {
  const year = clampYear(args.year, null);
  const query = {};

  if (year) query.year = year;

  const exams = await LicensureExam.find(query)
    .sort({ year: -1, passingRate: -1 })
    .limit(sanitizeLimit(args.limit, 200, 500))
    .lean();

  if (exams.length === 0) {
    return {
      found: false,
      message: year
        ? `No licensure exam data for ${year}.`
        : "No licensure exam data found.",
    };
  }

  const totalTakers = exams.reduce((s, e) => s + (e.takers || 0), 0);
  const totalPassed = exams.reduce((s, e) => s + (e.passed || 0), 0);

  return {
    found: true,
    yearFilter: year,
    programsCovered: exams.length,
    overallPassingRate:
      totalTakers > 0
        ? Math.round((totalPassed / totalTakers) * 10000) / 100
        : null,
    topPrograms: exams.slice(0, 10).map((e) => ({
      program: e.programName,
      category: e.category,
      year: e.year,
      takers: e.takers,
      passed: e.passed,
      passingRatePercent: Math.round((e.passingRate || 0) * 10000) / 100,
      resultsPending: Boolean(e.isNda),
    })),
  };
}

async function getBudgetUtilization(args, user) {
  // Role enforcement: deans have no budget access. Checked BEFORE any query.
  if (user.role === "dean") {
    return {
      found: false,
      message: "Budget utilization data is not available for your role.",
    };
  }

  const year = clampYear(args.year, null);
  const query = year ? { fiscalYear: year } : {};

  const docs = await BudgetUtilization.find(query)
    .sort({ fiscalYear: -1 })
    .limit(sanitizeLimit(args.limit, 10, 20))
    .lean();

  if (docs.length === 0) {
    return {
      found: false,
      message: year
        ? `No budget data for FY ${year}.`
        : "No budget data found.",
    };
  }

  return {
    found: true,
    fiscalYears: docs.map((d) => ({
      fiscalYear: d.fiscalYear,
      personnelServices: {
        approved: d.psApproved,
        obligated: d.psObligated,
      },
      mooe: {
        approved: d.mooeApproved,
        obligated: d.mooeObligated,
      },
      capitalOutlay: {
        approved: d.coApproved,
        obligated: d.coObligated,
      },
      totalAllotment:
        (d.psApproved || 0) + (d.mooeApproved || 0) + (d.coApproved || 0),
      totalObligated:
        (d.psObligated || 0) + (d.mooeObligated || 0) + (d.coObligated || 0),
      burEfficiencyPercent:
        Math.round(
          (((d.psObligated || 0) +
            (d.mooeObligated || 0) +
            (d.coObligated || 0)) /
            Math.max(
              (d.psApproved || 0) + (d.mooeApproved || 0) + (d.coApproved || 0),
              1,
            )) *
            10000,
        ) / 100,
      targetPacePercent: Math.round((d.targetPace || 0) * 10000) / 100,
    })),
  };
}

// ---------------------------------------------------------------------------
// Higher Education: program accreditation status
// ---------------------------------------------------------------------------

async function getAccreditationStatus(args, user) {
  const campus = normalizeCampus(args.campus);
  const query = {};
  if (campus) query.campusBranch = campus;

  const programs = await HigherEducation.find(query)
    .sort({ campusBranch: 1, programName: 1 })
    .limit(sanitizeLimit(args.limit, 300, 1000))
    .lean();

  if (programs.length === 0) {
    return {
      found: false,
      message: campus
        ? `No accreditation records found for ${campus} campus.`
        : "No accreditation records found.",
    };
  }

  const byCampus = {};
  for (const p of programs) {
    byCampus[p.campusBranch] = byCampus[p.campusBranch] || {
      total: 0,
      accredited: 0,
    };
    byCampus[p.campusBranch].total += 1;
    if (p.isAccredited) byCampus[p.campusBranch].accredited += 1;
  }

  return {
    found: true,
    campusFilter: campus || "all campuses",
    totalPrograms: programs.length,
    accreditedPrograms: programs.filter((p) => p.isAccredited).length,
    reviewOverdue: programs.filter((p) => p.reviewStatus === "Review Overdue")
      .length,
    byCampus,
    programs: programs.map((p) => ({
      campus: p.campusBranch,
      program: p.programName,
      accreditationStatus: p.accreditationStatus,
      isAccredited: Boolean(p.isAccredited),
      reviewStatus: p.reviewStatus,
      validUntil: p.endDate ? p.endDate.toISOString().slice(0, 10) : null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Higher Education: graduate employability tracer
// ---------------------------------------------------------------------------

async function getEmployabilityTracer(args, user) {
  const docs = await HigherEducationTracer.find({})
    .sort({ year: 1 })
    .limit(sanitizeLimit(args.limit, 20, 50))
    .lean();

  if (docs.length === 0) {
    return { found: false, message: "No employability tracer data found." };
  }

  return {
    found: true,
    series: docs.map((d) => ({
      year: d.year,
      graduates: d.graduateCount || 0,
      employed: d.employedCount || 0,
      employabilityRatePercent:
        Math.round((d.employabilityRate || 0) * 10000) / 100,
    })),
    latest: {
      year: docs[docs.length - 1].year,
      graduates: docs[docs.length - 1].graduateCount || 0,
      employed: docs[docs.length - 1].employedCount || 0,
      employabilityRatePercent:
        Math.round((docs[docs.length - 1].employabilityRate || 0) * 10000) /
        100,
    },
  };
}

// ---------------------------------------------------------------------------
// Achievements: global recognition rankings (THE / WURI / QS / Shanghai)
// ---------------------------------------------------------------------------

async function getGlobalRecognition(args, user) {
  const query = {};
  if (args.rankingBody) {
    const body = ["Times Higher Education", "WURI", "QS", "Shanghai"].find(
      (b) => b.toLowerCase() === String(args.rankingBody).trim().toLowerCase(),
    );
    if (body) query.rankingBody = body;
  }
  if (args.year) {
    const year = clampYear(args.year, null);
    if (year) query.rankingYear = year;
  }

  const entries = await GlobalRecognition.find(query)
    .sort({ rankingYear: -1 })
    .limit(sanitizeLimit(args.limit, 20, 50))
    .lean();

  if (entries.length === 0) {
    return {
      found: false,
      message: "No global recognition records found for those filters.",
    };
  }

  return {
    found: true,
    entries: entries.map((e) => ({
      rankingBody: e.rankingBody,
      ratingName: e.ratingName,
      year: e.rankingYear,
      overallRank: e.overallStatus?.rank,
      overallContext: e.overallStatus?.subText,
      metrics: (e.metrics || []).map((m) => ({
        label: m.label,
        rank: m.rank,
        context: m.contextLabel,
      })),
      source: e.sourceRef,
      certified: Boolean(e.isCertifiedOfficial),
    })),
  };
}

// ---------------------------------------------------------------------------
// Achievements: college licensure performance (target vs actual)
// ---------------------------------------------------------------------------

async function getCollegeLicensurePerformance(args, user) {
  const query = {};

  // Role scoping: deans only see their own college's performance.
  if (user.role === "dean") {
    if (user.collegeId) {
      query.collegeId = user.collegeId;
    } else {
      return {
        found: false,
        message:
          "Your account is not linked to a college, so no licensure performance data is available.",
      };
    }
  }

  if (args.year) {
    const year = clampYear(args.year, null);
    if (year) query.rankingYear = year;
  }

  const docs = await LicensurePerformance.find(query)
    .sort({ rankingYear: -1 })
    .limit(sanitizeLimit(args.limit, 10, 30))
    .lean();

  if (docs.length === 0) {
    return {
      found: false,
      message: "No college licensure performance records found.",
    };
  }

  return {
    found: true,
    scope: user.role === "dean" ? "your college" : "institution-wide",
    records: docs.map((d) => ({
      year: d.rankingYear,
      targetPercent: d.summaryKpis?.target,
      actualPercent: d.summaryKpis?.actual,
      variance: d.summaryKpis?.variance,
      totalPassed: d.institutionalContext?.totalPassedVerified,
      totalCandidates: d.institutionalContext?.totalCandidatesVerified,
      programs: (d.programs || []).map((p) => ({
        program: p.programName,
        passed: p.passedCandidates,
        total: p.totalCandidates,
        percentage: p.percentage,
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Registry: JSON-schema definitions + executor with access matrix
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    definition: {
      type: "function",
      function: {
        name: "getEnrollmentSnapshot",
        description:
          "Get a full enrollment snapshot for one campus, semester, and academic year: total students, YoY growth, active programs, and per-program headcounts.",
        parameters: {
          type: "object",
          properties: {
            year: {
              type: "integer",
              description: "Academic year start (e.g., 2023 for AY 2023-2024).",
            },
            campus: {
              type: "string",
              enum: CAMPUSES,
              description: "Campus name. Defaults to Boac.",
            },
            semester: {
              type: "string",
              enum: SEMESTERS,
              description: 'Defaults to "1st Semester".',
            },
          },
        },
      },
    },
    handler: getEnrollmentSnapshot,
    roles: ["executive", "dean", "admin", "information_unit"],
  },
  {
    definition: {
      type: "function",
      function: {
        name: "getEnrollmentTrend",
        description:
          "Get a multi-year enrollment trend (optionally filtered to one program by name or code) for a campus and semester.",
        parameters: {
          type: "object",
          properties: {
            fromYear: {
              type: "integer",
              description: "Start academic year (inclusive).",
            },
            toYear: {
              type: "integer",
              description: "End academic year (inclusive).",
            },
            campus: { type: "string", enum: CAMPUSES },
            semester: { type: "string", enum: SEMESTERS },
            program: {
              type: "string",
              description:
                'Program name or code fragment, e.g., "BSIT" or "Civil Engineering".',
            },
          },
        },
      },
    },
    handler: getEnrollmentTrend,
    roles: ["executive", "dean", "admin", "information_unit"],
  },
  {
    definition: {
      type: "function",
      function: {
        name: "getResearchMetrics",
        description:
          "Get research output metrics: paper counts by year/scope/status, publication and IP counts, funding totals, and recent titles.",
        parameters: {
          type: "object",
          properties: {
            year: {
              type: "integer",
              description: "Filter to a single publication year.",
            },
            limit: {
              type: "integer",
              description: "Max records to scan (default 200).",
            },
          },
        },
      },
    },
    handler: getResearchMetrics,
    roles: ["executive", "dean", "admin", "information_unit"],
  },
  {
    definition: {
      type: "function",
      function: {
        name: "getLicensurePerformance",
        description:
          "Get licensure exam performance: overall passing rate, takers/passed counts, and top-performing programs.",
        parameters: {
          type: "object",
          properties: {
            year: {
              type: "integer",
              description: "Filter to a single exam year.",
            },
            limit: {
              type: "integer",
              description: "Max records to scan (default 200).",
            },
          },
        },
      },
    },
    handler: getLicensurePerformance,
    roles: ["executive", "dean", "admin", "information_unit"],
  },
  {
    definition: {
      type: "function",
      function: {
        name: "getBudgetUtilization",
        description:
          "Get budget utilization (BUR) data: approved vs obligated amounts for Personnel Services, MOOE, and Capital Outlay, with efficiency percentages.",
        parameters: {
          type: "object",
          properties: {
            year: { type: "integer", description: "Fiscal year." },
            limit: {
              type: "integer",
              description: "Max fiscal years to return (default 10).",
            },
          },
        },
      },
    },
    handler: getBudgetUtilization,
    roles: ["executive", "admin", "information_unit"], // deans excluded
  },
  {
    definition: {
      type: "function",
      function: {
        name: "getAccreditationStatus",
        description:
          "Get program accreditation status across campuses: which programs are accredited, their accreditation level, review status, and validity dates.",
        parameters: {
          type: "object",
          properties: {
            campus: {
              type: "string",
              enum: CAMPUSES,
              description: "Filter to one campus. Omit for all campuses.",
            },
            limit: {
              type: "integer",
              description: "Max records (default 300).",
            },
          },
        },
      },
    },
    handler: getAccreditationStatus,
    roles: ["executive", "dean", "admin", "information_unit"],
  },
  {
    definition: {
      type: "function",
      function: {
        name: "getEmployabilityTracer",
        description:
          "Get graduate employability tracer data: graduate counts, employed counts, and employability rates by year.",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "Max years to return (default 20).",
            },
          },
        },
      },
    },
    handler: getEmployabilityTracer,
    roles: ["executive", "dean", "admin", "information_unit"],
  },
  {
    definition: {
      type: "function",
      function: {
        name: "getGlobalRecognition",
        description:
          "Get global recognition rankings (Times Higher Education, WURI, QS, Shanghai): overall ranks and per-metric breakdowns like SDGs and innovation categories.",
        parameters: {
          type: "object",
          properties: {
            rankingBody: {
              type: "string",
              enum: ["Times Higher Education", "WURI", "QS", "Shanghai"],
              description: "Filter to one ranking body. Omit for all.",
            },
            year: {
              type: "integer",
              description: "Filter to one ranking year.",
            },
            limit: {
              type: "integer",
              description: "Max entries (default 20).",
            },
          },
        },
      },
    },
    handler: getGlobalRecognition,
    roles: ["executive", "dean", "admin", "information_unit"],
  },
  {
    definition: {
      type: "function",
      function: {
        name: "getCollegeLicensurePerformance",
        description:
          "Get college-level licensure performance against institutional targets: target vs actual passing rates, variance, and per-program breakdowns.",
        parameters: {
          type: "object",
          properties: {
            year: { type: "integer", description: "Filter to one year." },
            limit: {
              type: "integer",
              description: "Max records (default 10).",
            },
          },
        },
      },
    },
    handler: getCollegeLicensurePerformance,
    roles: ["executive", "dean", "admin", "information_unit"],
  },
];

/**
 * Get the OpenAI-format tool definitions visible to a given role.
 * @param {string} role
 */
function getToolDefinitions(role) {
  return TOOLS.filter((t) => t.roles.includes(role)).map((t) => t.definition);
}

/**
 * Execute a tool call with server-side access enforcement.
 * @param {string} name
 * @param {Object} args Parsed JSON arguments from the LLM.
 * @param {Object} user Decoded JWT payload.
 */
async function executeTool(name, args, user) {
  const tool = TOOLS.find((t) => t.definition.function.name === name);

  if (!tool) {
    return { error: `Unknown tool: ${name}` };
  }

  // Access matrix — enforced here, never delegated to the LLM.
  if (!tool.roles.includes(user.role)) {
    return { error: `Tool "${name}" is not available for your role.` };
  }

  try {
    return await tool.handler(args || {}, user);
  } catch (error) {
    console.error(`[chat] tool "${name}" failed:`, error.message);
    return { error: `Tool execution failed: ${error.message}` };
  }
}

module.exports = { getToolDefinitions, executeTool };
