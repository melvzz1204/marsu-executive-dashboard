/**
 * Narrative insight generators for the Empower Intelligence Report modal.
 *
 * Each generator receives the raw tool result (as returned by the backend
 * tool registry) and produces:
 *   { situation: string[], recommendations: string[] }
 *
 * The text is deterministic (no LLM call) so reports print consistently.
 */

const fmt = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n))
    ? "—"
    : Number(n).toLocaleString();

const pct = (n) => (n === null || n === undefined ? "—" : `${fmt(n)}%`);

/**
 * Simple trend descriptor over a numeric series.
 * Returns direction ("up" | "down" | "flat" | "insufficient"),
 * relative change in percent, and first/last values.
 */
const trendOf = (values) => {
  const clean = (values || []).filter(
    (v) => typeof v === "number" && !Number.isNaN(v),
  );
  if (clean.length < 2) {
    return {
      direction: "insufficient",
      changePct: null,
      first: clean[0],
      last: clean[0],
    };
  }
  const first = clean[0];
  const last = clean[clean.length - 1];
  const changePct =
    first !== 0 ? ((last - first) / Math.abs(first)) * 100 : null;
  let direction = "flat";
  if (changePct !== null) {
    if (changePct > 1) direction = "up";
    else if (changePct < -1) direction = "down";
  } else if (last > first) direction = "up";
  else if (last < first) direction = "down";
  return { direction, changePct, first, last };
};

// ---------------------------------------------------------------------------
// Enrollment snapshot
// ---------------------------------------------------------------------------

const enrollmentSnapshotInsights = (d) => {
  const situation = [];
  const yoy = d.yoyGrowthPercentage;

  situation.push(
    `As of ${d.semester}, AY ${d.academicYear}, the ${d.campus} campus enrolls ${fmt(d.totalStudents)} students across ${fmt(d.activePrograms)} active academic programs. ` +
      (typeof yoy === "number"
        ? yoy >= 0
          ? `Enrollment is up ${fmt(yoy)}% year over year.`
          : `Enrollment is down ${fmt(Math.abs(yoy))}% year over year.`
        : "A year-over-year comparison is not available for this period."),
  );

  if (d.largestProgram) {
    situation.push(
      `${d.largestProgram} is the largest program by headcount${
        typeof d.priorityEnrollmentPercentage === "number"
          ? `, and CHED/RDC priority programs account for ${pct(d.priorityEnrollmentPercentage)} of total enrollment`
          : ""
      }.`,
    );
  }

  const recs = [];
  if (typeof yoy === "number" && yoy < 0) {
    recs.push(
      `Investigate the drivers of the ${fmt(Math.abs(yoy))}% enrollment decline — review the admission funnel, conversion rates, and retention — and deploy targeted recruitment campaigns before the next intake.`,
    );
  }
  const largest = (d.programs || [])[0];
  if (
    largest &&
    d.totalStudents > 0 &&
    largest.students / d.totalStudents > 0.25
  ) {
    recs.push(
      `${largest.program} concentrates more than a quarter of total enrollment. Diversify the program portfolio to reduce dependency on a single program.`,
    );
  }
  if (
    typeof d.priorityEnrollmentPercentage === "number" &&
    d.priorityEnrollmentPercentage < 40
  ) {
    recs.push(
      "Strengthen the promotion of CHED/RDC priority programs (scholarships, career messaging, industry linkage) to lift the priority-enrollment share.",
    );
  }
  if (recs.length === 0) {
    recs.push(
      "Sustain current recruitment and retention strategies, and continue monitoring per-program trajectories each semester.",
    );
  }
  return { situation, recommendations: recs };
};

// ---------------------------------------------------------------------------
// Enrollment trend
// ---------------------------------------------------------------------------

const enrollmentTrendInsights = (d) => {
  const series = d.series || [];
  const totals = series.map((s) => s.totalStudents);
  const t = trendOf(totals);
  const situation = [];

  situation.push(
    `Across ${series.length} academic year${series.length === 1 ? "" : "s"} (${series[0]?.academicYear} to ${series[series.length - 1]?.academicYear}), ${d.campus} campus enrollment moved from ${fmt(t.first)} to ${fmt(t.last)} students${d.programFilter ? ` for programs matching "${d.programFilter}"` : ""}.`,
  );

  if (t.changePct !== null) {
    situation.push(
      `This is a net ${t.changePct >= 0 ? "increase" : "decrease"} of ${fmt(Math.abs(t.changePct))}% over the period — a ${t.direction === "up" ? "growth" : t.direction === "down" ? "contraction" : "stable"} trajectory.`,
    );
  }

  const recs = [];
  if (t.direction === "down") {
    recs.push(
      "Reverse the downward trend with an enrollment recovery plan: strengthen senior-high-school partnerships, simplify the admission process, and launch scholarship or financial-aid packages.",
    );
    recs.push(
      "Audit attrition between year levels and introduce early-warning advising for at-risk students to protect retention.",
    );
  } else if (t.direction === "up") {
    recs.push(
      "Plan capacity ahead of growth — project faculty, classroom, and student-services load for the next two academic years.",
    );
  }
  if (series.length >= 3) {
    const deltas = totals.slice(1).map((v, i) => v - totals[i]);
    const swings = deltas.filter(
      (x) => Math.abs(x) > Math.abs(t.first || 1) * 0.05,
    ).length;
    if (swings >= deltas.length / 2) {
      recs.push(
        "Enrollment is volatile year to year; build a rolling three-year forecasting model to smooth planning decisions.",
      );
    }
  }
  if (recs.length === 0) {
    recs.push(
      "Maintain year-over-year monitoring and revisit recruitment targets annually.",
    );
  }
  return { situation, recommendations: recs };
};

// ---------------------------------------------------------------------------
// Research metrics
// ---------------------------------------------------------------------------

const researchMetricsInsights = (d) => {
  const situation = [];
  const pubRatio =
    d.totalPapers > 0
      ? Math.round((d.published / d.totalPapers) * 1000) / 10
      : null;

  situation.push(
    `The dataset covers ${fmt(d.totalPapers)} research records${d.yearFilter ? ` for ${d.yearFilter}` : ""} (${d.scope}). ${fmt(d.published)} are published${pubRatio !== null ? ` — a ${pct(pubRatio)} publication rate` : ""}, and ${fmt(d.withIntellectualProperty)} produced intellectual property.`,
  );

  if (d.totalFundingMillionsPHP > 0) {
    situation.push(
      `Total recorded research funding is ₱${fmt(d.totalFundingMillionsPHP)}M.`,
    );
  }
  const scopes = Object.entries(d.papersByScope || {}).sort(
    (a, b) => b[1] - a[1],
  );
  if (scopes.length > 0) {
    situation.push(
      `${scopes[0][0]} research dominates the portfolio (${fmt(scopes[0][1])} of ${fmt(d.totalPapers)} records).`,
    );
  }

  const recs = [];
  if (pubRatio !== null && pubRatio < 50) {
    recs.push(
      "Lift the publication rate through writing clinics, publication mentors, and a dedicated publication fund for completed studies.",
    );
  }
  if (d.totalPapers > 0 && d.withIntellectualProperty / d.totalPapers < 0.1) {
    recs.push(
      "Few studies convert into intellectual property. Engage the technology-transfer function at the proposal stage to identify patentable or copyrightable outputs early.",
    );
  }
  const years = Object.keys(d.papersByYear || {})
    .map(Number)
    .sort((a, b) => a - b);
  if (years.length >= 2) {
    const lastYear = years[years.length - 1];
    const prevYear = years[years.length - 2];
    const last = d.papersByYear[lastYear];
    const prev = d.papersByYear[prevYear];
    if (last < prev) {
      recs.push(
        `Output dropped from ${fmt(prev)} papers in ${prevYear} to ${fmt(last)} in ${lastYear}. Re-balance faculty research loading and relaunch an incentivized call for proposals.`,
      );
    }
  }
  if (recs.length === 0) {
    recs.push(
      "Sustain the current research pipeline and consider raising targets for internationally indexed publications.",
    );
  }
  return { situation, recommendations: recs };
};

// ---------------------------------------------------------------------------
// Licensure exam performance (institution-wide exam records)
// ---------------------------------------------------------------------------

const licensurePerformanceInsights = (d) => {
  const situation = [];
  situation.push(
    `Across ${fmt(d.programsCovered)} licensure exam record${d.programsCovered === 1 ? "" : "s"}${d.yearFilter ? ` for ${d.yearFilter}` : " covering all years"}, the overall passing rate is ${pct(d.overallPassingRate)}.`,
  );

  const ranked = (d.topPrograms || []).filter((p) => !p.resultsPending);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  if (best) {
    situation.push(
      `${best.program} leads with a ${pct(best.passingRatePercent)} passing rate${worst && worst !== best ? `, while ${worst.program} trails at ${pct(worst.passingRatePercent)}` : ""}.`,
    );
  }

  const recs = [];
  if (typeof d.overallPassingRate === "number") {
    if (d.overallPassingRate < 50) {
      recs.push(
        "Urgent: institute board-exam intervention programs (diagnostic mock boards, review subsidies, remedial coaching) for programs below the 50% passing threshold.",
      );
    } else if (d.overallPassingRate < 70) {
      recs.push(
        "Extend review programs and pre-board diagnostics to push the overall passing rate above the 70% benchmark.",
      );
    } else {
      recs.push(
        "Codify the review practices of top-performing programs and replicate them institution-wide.",
      );
    }
  }
  const pending = (d.topPrograms || []).filter((p) => p.resultsPending).length;
  if (pending > 0) {
    recs.push(
      `${pending} program result${pending === 1 ? " is" : "s are"} under NDA restriction — follow up with the PRC for official release before final reporting.`,
    );
  }
  if (
    worst &&
    worst !== best &&
    typeof worst.passingRatePercent === "number" &&
    worst.passingRatePercent < 50
  ) {
    recs.push(
      `Conduct a curriculum and review audit for ${worst.program}, whose passing rate (${pct(worst.passingRatePercent)}) is critically low.`,
    );
  }
  if (recs.length === 0) {
    recs.push(
      "Maintain current review support and monitor per-program results each exam season.",
    );
  }
  return { situation, recommendations: recs };
};

// ---------------------------------------------------------------------------
// Budget utilization
// ---------------------------------------------------------------------------

const budgetUtilizationInsights = (d) => {
  const years = d.fiscalYears || [];
  const latest = years[0];
  const situation = [];

  if (latest) {
    const met = latest.burEfficiencyPercent >= latest.targetPacePercent;
    situation.push(
      `In FY ${latest.fiscalYear}, obligations reached ${pct(latest.burEfficiencyPercent)} of the approved ₱${fmt(latest.totalAllotment)}M allotment against a target pace of ${pct(latest.targetPacePercent)} — ${met ? "on or ahead of target" : "below target"}.`,
    );
  }
  if (years.length >= 2) {
    const oldest = years[years.length - 1];
    const diff = latest.burEfficiencyPercent - oldest.burEfficiencyPercent;
    situation.push(
      `Budget utilization efficiency has ${diff >= 0 ? "risen" : "fallen"} ${fmt(Math.abs(diff))} points from ${pct(oldest.burEfficiencyPercent)} in FY ${oldest.fiscalYear}.`,
    );
  }

  const recs = [];
  if (
    latest &&
    typeof latest.burEfficiencyPercent === "number" &&
    typeof latest.targetPacePercent === "number" &&
    latest.burEfficiencyPercent < latest.targetPacePercent
  ) {
    recs.push(
      `Close the ${fmt(latest.targetPacePercent - latest.burEfficiencyPercent)}-point utilization gap by accelerating the procurement pipeline and de-obligating dormant allotments before fiscal year-end.`,
    );
  }
  if (latest) {
    const cats = [
      ["Personnel Services", latest.personnelServices],
      ["Maintenance & Other Operating Expenses", latest.mooe],
      ["Capital Outlay", latest.capitalOutlay],
    ].filter(([, c]) => c && c.approved > 0);
    if (cats.length > 0) {
      const slowest = cats.sort(
        (a, b) =>
          a[1].obligated / a[1].approved - b[1].obligated / b[1].approved,
      )[0];
      const rate =
        Math.round((slowest[1].obligated / slowest[1].approved) * 1000) / 100;
      if (rate < 70) {
        recs.push(
          `${slowest[0]} shows the slowest obligation rate (${pct(rate)}). Review the bottlenecks specific to this expense class.`,
        );
      }
    }
  }
  if (recs.length === 0) {
    recs.push(
      "Sustain the current obligation discipline and continue quarterly BUR monitoring against target pace.",
    );
  }
  return { situation, recommendations: recs };
};

// ---------------------------------------------------------------------------
// Accreditation status
// ---------------------------------------------------------------------------

const accreditationStatusInsights = (d) => {
  const situation = [];
  const rate =
    d.totalPrograms > 0
      ? Math.round((d.accreditedPrograms / d.totalPrograms) * 1000) / 10
      : null;

  situation.push(
    `Of ${fmt(d.totalPrograms)} programs${d.campusFilter && d.campusFilter !== "all campuses" ? ` at ${d.campusFilter} campus` : " across all campuses"}, ${fmt(d.accreditedPrograms)} hold accreditation${rate !== null ? ` — ${pct(rate)} coverage` : ""}.`,
  );
  if (d.reviewOverdue > 0) {
    situation.push(
      `${fmt(d.reviewOverdue)} program${d.reviewOverdue === 1 ? " has an" : "s have"} overdue accreditation review${d.reviewOverdue === 1 ? "" : "s"}.`,
    );
  }

  const campuses = Object.entries(d.byCampus || {}).sort(
    (a, b) => b[1].accredited / b[1].total - a[1].accredited / a[1].total,
  );
  if (campuses.length >= 2) {
    const best = campuses[0];
    const worst = campuses[campuses.length - 1];
    situation.push(
      `${best[0]} campus leads accreditation coverage (${fmt(best[1].accredited)}/${fmt(best[1].total)}), while ${worst[0]} lags (${fmt(worst[1].accredited)}/${fmt(worst[1].total)}).`,
    );
  }

  const recs = [];
  if (d.reviewOverdue > 0) {
    recs.push(
      "Prioritize the overdue accreditation reviews — schedule accrediting-agency visits this cycle and assign document owners per accreditation area.",
    );
  }
  if (rate !== null && rate < 80) {
    recs.push(
      "Fast-track unaccredited programs toward Level I status with a per-program accreditation roadmap and dedicated budget support.",
    );
  }
  if (campuses.length >= 2) {
    recs.push(
      `Replicate the accreditation playbook of the strongest campus at ${campuses[campuses.length - 1][0]} campus.`,
    );
  }
  if (recs.length === 0) {
    recs.push(
      "Maintain accreditation currency and schedule next-cycle reviews ahead of validity expiry.",
    );
  }
  return { situation, recommendations: recs };
};

// ---------------------------------------------------------------------------
// Graduate employability tracer
// ---------------------------------------------------------------------------

const employabilityTracerInsights = (d) => {
  const series = d.series || [];
  const t = trendOf(series.map((s) => s.employabilityRatePercent));
  const situation = [];

  if (d.latest) {
    situation.push(
      `In ${d.latest.year}, ${fmt(d.latest.employed)} of ${fmt(d.latest.graduates)} graduates were employed — an employability rate of ${pct(d.latest.employabilityRatePercent)}.`,
    );
  }
  if (t.changePct !== null && series.length >= 2) {
    situation.push(
      `The rate has ${t.changePct >= 0 ? "risen" : "fallen"} ${fmt(Math.abs(t.changePct))}% (relative) from ${pct(t.first)} in ${series[0].year} to ${pct(t.last)} in ${series[series.length - 1].year}.`,
    );
  }

  const recs = [];
  if (d.latest && d.latest.employabilityRatePercent < 80) {
    recs.push(
      "Strengthen industry linkages — expand internship placements, employer partnerships, and job-matching services — to lift employability above 80%.",
    );
  }
  if (t.direction === "down") {
    recs.push(
      "Reverse the declining trend with tracer-informed curriculum updates and work-readiness (soft-skills) training embedded across programs.",
    );
  }
  if (series.length < 3) {
    recs.push(
      "Institutionalize annual tracer studies to build a longer evidence base for employability decisions.",
    );
  }
  if (recs.length === 0) {
    recs.push(
      "Sustain graduate-tracking operations and publish the results to strengthen program marketing.",
    );
  }
  return { situation, recommendations: recs };
};

// ---------------------------------------------------------------------------
// Global recognition rankings
// ---------------------------------------------------------------------------

const globalRecognitionInsights = (d) => {
  const entries = d.entries || [];
  const situation = [];
  const bodies = [...new Set(entries.map((e) => e.rankingBody))];

  situation.push(
    `The university holds ${fmt(entries.length)} ranking entr${entries.length === 1 ? "y" : "ies"} across ${fmt(bodies.length)} international ranking bod${bodies.length === 1 ? "y" : "ies"} (${bodies.join(", ")}).`,
  );

  const ranked = entries.filter(
    (e) => e.overallRank !== null && e.overallRank !== undefined,
  );
  if (ranked.length > 0) {
    const best = ranked.reduce((a, b) =>
      a.overallRank < b.overallRank ? a : b,
    );
    situation.push(
      `The best overall placement is rank ${fmt(best.overallRank)} in ${best.rankingBody} (${best.year})${best.overallContext ? ` — ${best.overallContext}` : ""}.`,
    );
  }
  const certified = entries.filter((e) => e.certified).length;
  if (certified > 0 && certified < entries.length) {
    situation.push(
      `${fmt(certified)} of ${fmt(entries.length)} entries are certified official submissions.`,
    );
  }

  const recs = [
    "Maintain complete and timely data submissions to each ranking body — data completeness directly affects placement.",
  ];
  const allMetrics = entries.flatMap((e) =>
    (e.metrics || [])
      .filter((m) => typeof m.rank === "number")
      .map((m) => ({ body: e.rankingBody, label: m.label, rank: m.rank })),
  );
  if (allMetrics.length > 0) {
    const weakest = [...allMetrics].sort((a, b) => b.rank - a.rank).slice(0, 3);
    recs.push(
      `Prioritize improvement in the weakest-ranked metrics: ${weakest
        .map((m) => `${m.label} (${m.body}, #${fmt(m.rank)})`)
        .join("; ")}.`,
    );
  }
  if (entries.some((e) => !e.certified)) {
    recs.push(
      "Complete the verification of unofficial entries before external publication.",
    );
  }
  return { situation, recommendations: recs };
};

// ---------------------------------------------------------------------------
// College licensure performance (target vs actual)
// ---------------------------------------------------------------------------

const collegeLicensurePerformanceInsights = (d) => {
  const records = d.records || [];
  const latest = records[0];
  const situation = [];

  if (latest) {
    const met =
      typeof latest.actualPercent === "number" &&
      typeof latest.targetPercent === "number" &&
      latest.actualPercent >= latest.targetPercent;
    situation.push(
      `In ${latest.year}, ${d.scope === "your college" ? "your college" : "the institution"} posted a ${pct(latest.actualPercent)} actual passing performance against a ${pct(latest.targetPercent)} target${typeof latest.variance === "number" ? ` (${latest.variance >= 0 ? "+" : ""}${fmt(latest.variance)}-point variance)` : ""} — ${met ? "target achieved" : "target missed"}.`,
    );
    if (latest.totalCandidates > 0) {
      situation.push(
        `This covers ${fmt(latest.totalPassed)} passers out of ${fmt(latest.totalCandidates)} verified candidates.`,
      );
    }
  }
  if (records.length >= 2 && latest) {
    const oldest = records[records.length - 1];
    const diff = (latest.actualPercent ?? 0) - (oldest.actualPercent ?? 0);
    situation.push(
      `Actual performance has ${diff >= 0 ? "improved" : "declined"} by ${fmt(Math.abs(diff))} points since ${oldest.year}.`,
    );
  }

  const recs = [];
  if (
    latest &&
    typeof latest.actualPercent === "number" &&
    typeof latest.targetPercent === "number" &&
    latest.actualPercent < latest.targetPercent
  ) {
    recs.push(
      `Close the ${fmt(latest.targetPercent - latest.actualPercent)}-point gap to target with program-level interventions: diagnostic mock boards, review subsidies, and curriculum alignment for the weakest programs.`,
    );
  }
  const below = (latest?.programs || []).filter(
    (p) =>
      typeof p.percentage === "number" &&
      typeof latest?.targetPercent === "number" &&
      p.percentage < latest.targetPercent,
  );
  if (below.length > 0) {
    recs.push(
      `${fmt(below.length)} program${below.length === 1 ? " is" : "s are"} below the ${pct(latest.targetPercent)} target (${below
        .slice(0, 3)
        .map((p) => p.program)
        .join(
          ", ",
        )}${below.length > 3 ? ", among others" : ""}) — prioritize review support there.`,
    );
  }
  if (recs.length === 0) {
    recs.push(
      "Sustain the interventions behind the current performance and set stretch targets for the next cycle.",
    );
  }
  return { situation, recommendations: recs };
};

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const INSIGHT_GENERATORS = {
  getEnrollmentSnapshot: enrollmentSnapshotInsights,
  getEnrollmentTrend: enrollmentTrendInsights,
  getResearchMetrics: researchMetricsInsights,
  getLicensurePerformance: licensurePerformanceInsights,
  getBudgetUtilization: budgetUtilizationInsights,
  getAccreditationStatus: accreditationStatusInsights,
  getEmployabilityTracer: employabilityTracerInsights,
  getGlobalRecognition: globalRecognitionInsights,
  getCollegeLicensurePerformance: collegeLicensurePerformanceInsights,
};

/**
 * Returns { situation, recommendations } for a tool result, or null when
 * no narrative applies (unknown tool, empty result, or generator failure).
 */
export const getInsights = (name, data) => {
  if (!data || data.found === false) return null;
  const generator = INSIGHT_GENERATORS[name];
  if (!generator) return null;
  try {
    const insights = generator(data);
    if (
      !insights ||
      !Array.isArray(insights.situation) ||
      insights.situation.length === 0
    ) {
      return null;
    }
    return insights;
  } catch {
    return null;
  }
};
