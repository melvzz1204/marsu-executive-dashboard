// Data resolvers for the President's Report. Each key maps to an async
// function (year) => { actual, note } for indicator rows, or a shape consumed
// by the matching slide type. Add a new indicator by adding a key here and
// referencing it from presidentReport.json.

const LicensurePerformance = require("../../models/achievements/licensurePerformanceModel");
const LicensureExam = require("../../models/higherEducation/licensureExamModel");
const HigherEducationTracer = require("../../models/higherEducation/higherEducationTracerModel");
const HigherEducation = require("../../models/higherEducation/higherEducationModel");
const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");
const ResearchPaper = require("../../models/research/researchAnalyticsModel");
const AchievementPost = require("../../models/achievements/achievementPostModel");
const GlobalRecognition = require("../../models/achievements/globalRecognitionModel");
const {
  isInstitutionRow,
  buildYearSeries,
} = require("../higherEducation/tracerAggregation");

const round2 = (value) => Math.round(Number(value) * 100) / 100;

const toPercent = (decimal) => round2((Number(decimal) || 0) * 100);

const dateRangeForYear = (year) => ({
  start: new Date(Date.UTC(year, 0, 1)),
  end: new Date(Date.UTC(year + 1, 0, 1)),
});

const resolvers = {
  // Overall licensure passing rate. Prefers the curated performance matrix and
  // falls back to the raw per-exam records.
  "licensure.overall": async (year) => {
    const performance = await LicensurePerformance.findOne({
      rankingYear: year,
    }).lean();

    if (performance?.summaryKpis?.actual !== undefined) {
      const context = performance.institutionalContext || {};
      return {
        actual: round2(performance.summaryKpis.actual),
        note:
          context.totalPassedVerified != null &&
          context.totalCandidatesVerified != null
            ? `${context.totalPassedVerified} of ${context.totalCandidatesVerified} first-time licensure exam-takers passed.`
            : null,
      };
    }

    const aggregate = await LicensureExam.aggregate([
      { $match: { year, isNda: false } },
      {
        $group: {
          _id: null,
          takers: { $sum: "$takers" },
          passed: { $sum: "$passed" },
        },
      },
    ]);

    if (aggregate[0] && aggregate[0].takers > 0) {
      return {
        actual: round2((aggregate[0].passed / aggregate[0].takers) * 100),
        note: `${aggregate[0].passed} of ${aggregate[0].takers} licensure exam-takers passed.`,
      };
    }

    return { actual: null };
  },

  // Per-examination breakdown table.
  "licensure.programs": async (year) => {
    const exams = await LicensureExam.find({ year, isNda: false })
      .sort({ programName: 1 })
      .lean();

    if (exams.length > 0) {
      return {
        rows: exams.map((exam) => [
          exam.programName,
          exam.passed,
          exam.takers,
          `${round2(exam.passingRate * 100)}%`,
        ]),
      };
    }

    const performance = await LicensurePerformance.findOne({
      rankingYear: year,
    }).lean();

    if (performance?.programs?.length) {
      return {
        rows: performance.programs.map((program) => [
          program.programName,
          program.passedCandidates,
          program.totalCandidates,
          `${round2(program.percentage)}%`,
        ]),
      };
    }

    return { rows: [] };
  },

  "employability.rate": async (year) => {
    const rows = await HigherEducationTracer.find({ year }).lean();
    if (rows.length === 0) return { actual: null };

    // Prefer institution-wide rows. When the collection only holds
    // program-specific rows, aggregate them into a single institution figure.
    const institutionRows = rows.filter(isInstitutionRow);
    const scopedRows = institutionRows.length > 0 ? institutionRows : rows;
    const [series] = buildYearSeries(scopedRows);

    if (!series || series.totalGraduates === 0) {
      const averageRate =
        scopedRows.reduce(
          (acc, row) => acc + (Number(row.employabilityRate) || 0),
          0,
        ) / scopedRows.length;
      return { actual: toPercent(averageRate) };
    }

    return {
      actual: series.employabilityPercentage,
      note: `${series.employedCount} of ${series.totalGraduates} graduates (2 years prior) are employed.`,
    };
  },

  // Dashboard-matched graduate placement chart data: cohort size, verified
  // employment, and placement rate per graduating class.
  "employability.placement": async (year) => {
    const rows = await HigherEducationTracer.find({ year: { $lte: year } }).lean();

    if (rows.length === 0) return { labels: [], series: [] };

    // Bucket by year, preferring institution-wide rows and otherwise rolling
    // up program-level rows. This avoids double counting when both exist.
    const byYear = new Map();
    rows.forEach((row) => {
      const rowYear = Math.round(Number(row.year));
      if (!rowYear) return;
      if (!byYear.has(rowYear)) {
        byYear.set(rowYear, { institution: [], programs: [] });
      }
      const bucket = byYear.get(rowYear);
      (isInstitutionRow(row) ? bucket.institution : bucket.programs).push(row);
    });

    const seriesSource = [...byYear.keys()]
      .sort((a, b) => a - b)
      .map((rowYear) => {
        const bucket = byYear.get(rowYear);
        const chosen =
          bucket.institution.length > 0 ? bucket.institution : bucket.programs;
        const [entry] = buildYearSeries(chosen);
        return (
          entry || {
            year: rowYear,
            totalGraduates: 0,
            employedCount: 0,
            employabilityPercentage: 0,
          }
        );
      });

    return {
      labels: seriesSource.map((row) => `CY ${row.year}`),
      series: [
        {
          kind: "line",
          name: "Employability Rate (%)",
          values: seriesSource.map((row) => row.employabilityPercentage),
          axis: "rate",
          color: "D4AF37",
        },
        {
          kind: "bar",
          name: "Employed Alumni",
          values: seriesSource.map((row) => row.employedCount),
          axis: "count",
          color: "660033",
        },
        {
          kind: "bar",
          name: "Total Cohort Size",
          values: seriesSource.map((row) => row.totalGraduates),
          axis: "count",
          color: "CBD5E1",
        },
      ],
    };
  },

  "enrollment.priorityPct": async (year) => {
    const snapshots = await EnrollmentAnalytics.find({
      academicYear: year,
    }).lean();

    let totalStudents = 0;
    let priorityStudents = 0;

    snapshots.forEach((snapshot) => {
      (snapshot.programs || []).forEach((program) => {
        if (program.isActive === false) return;
        totalStudents += Number(program.studentCount) || 0;
        if (program.isPriorityProgram) {
          priorityStudents += Number(program.studentCount) || 0;
        }
      });
    });

    if (totalStudents === 0) return { actual: null };

    return {
      actual: round2((priorityStudents / totalStudents) * 100),
      note: `${round2(
        (priorityStudents / totalStudents) * 100,
      )}% of enrollment is in CHED-identified or RDC-identified priority programs.`,
    };
  },

  // Chart data: enrollment by program for the reporting year.
  "enrollment.byProgram": async (year) => {
    const snapshots = await EnrollmentAnalytics.find({
      academicYear: year,
      semester: "1st Semester",
    }).lean();

    const totals = new Map();
    snapshots.forEach((snapshot) => {
      (snapshot.programs || []).forEach((program) => {
        if (program.isActive === false) return;
        const current = totals.get(program.programName) || 0;
        totals.set(
          program.programName,
          current + (Number(program.studentCount) || 0),
        );
      });
    });

    const rows = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      name: "Students",
      labels: rows.map(([program]) => program),
      values: rows.map(([, count]) => count),
    };
  },

  // Chart data: total enrollment trend across academic years.
  "enrollment.trend": async (year) => {
    const snapshots = await EnrollmentAnalytics.find({
      academicYear: { $lte: year },
      semester: "1st Semester",
    }).lean();

    const totals = new Map();
    snapshots.forEach((snapshot) => {
      const current = totals.get(snapshot.academicYear) || 0;
      totals.set(
        snapshot.academicYear,
        current + (snapshot.summaryKpis?.totalStudents || 0),
      );
    });

    const rows = [...totals.entries()].sort((a, b) => a[0] - b[0]);

    return {
      name: "Total Students",
      labels: rows.map(([academicYear]) => `AY ${academicYear}`),
      values: rows.map(([, count]) => count),
    };
  },

  "accreditation.coverage": async () => {
    const [total, accredited] = await Promise.all([
      HigherEducation.countDocuments({}),
      HigherEducation.countDocuments({ isAccredited: true }),
    ]);

    if (total === 0) return { actual: null };

    return {
      actual: round2((accredited / total) * 100),
      note: `${accredited} of ${total} programs are duly accredited.`,
    };
  },

  "research.completed": async (year) => {
    const completed = await ResearchPaper.countDocuments({
      year,
      $or: [{ isCompleted: true }, { status: "COMPLETED" }],
    });

    return {
      actual: completed,
      note: `${completed} research ${
        completed === 1 ? "output was" : "outputs were"
      } completed in ${year}.`,
    };
  },

  "research.presented": async (year) => {
    const [total, presented] = await Promise.all([
      ResearchPaper.countDocuments({ year }),
      ResearchPaper.countDocuments({
        year,
        $or: [{ isPresenting: true }, { status: "PUBLISHED" }],
      }),
    ]);

    if (total === 0) return { actual: null };

    return {
      actual: round2((presented / total) * 100),
      note: `${presented} of ${total} research outputs were presented in national, regional, and international fora.`,
    };
  },

  // No data source yet — renders as a blank cell on purpose.
  "research.utilized": async () => ({ actual: null }),

  "accomplishments.items": async (year) => {
    const { start, end } = dateRangeForYear(year);

    const posts = await AchievementPost.find({
      status: "approved",
      eventDate: { $gte: start, $lt: end },
    })
      .sort({ eventDate: -1 })
      .limit(14)
      .lean();

    const items = posts.map((post) => ({
      title: post.title,
      subtitle: post.subtitle || "",
      body: post.body || "",
      category: post.category || "Awards and Recognition",
      date: post.eventDate ? new Date(post.eventDate).toISOString() : null,
    }));

    const recognitions = await GlobalRecognition.find({ rankingYear: year })
      .sort({ rankingBody: 1 })
      .lean();

    recognitions.forEach((recognition) => {
      const metrics = (recognition.metrics || [])
        .slice(0, 3)
        .map((metric) => `${metric.label} — rank ${metric.rank}`)
        .join("; ");

      items.push({
        title: `${recognition.rankingBody}: ${recognition.ratingName}`,
        subtitle: recognition.overallStatus?.rank
          ? `Overall rank ${recognition.overallStatus.rank}${
              recognition.overallStatus.subText
                ? ` — ${recognition.overallStatus.subText}`
                : ""
            }`
          : "",
        body: metrics,
        category: "Awards and Recognition",
        date: null,
      });
    });

    // Cap at 14 milestone slides so the deck keeps the reference 34-slide shape
    // (5 HE + 3 AdvEd + 2 Research + 2 Extension + 14 milestones + dividers).
    return { items: items.slice(0, 14) };
  },
};

module.exports = resolvers;
