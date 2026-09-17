// Assembles the President's Report payload from the JSON content spec,
// the data resolvers, and the theme tokens. Both the JSON API and the PPTX
// renderer consume the object this returns.

const reportSpec = require("../../config/presidentReport.json");
const resolvers = require("./presidentReportResolvers");

function fillTokens(text, { year, periodShort }) {
  return String(text ?? "")
    .replace(/\{year\}/g, String(year))
    .replace(/\{periodShort\}/g, periodShort);
}

const round2 = (value) => Math.round(Number(value) * 100) / 100;

async function resolveIndicatorRow(row, year) {
  let resolved = { actual: null, note: null };

  if (row.source && typeof resolvers[row.source] === "function") {
    resolved = await resolvers[row.source](year);
  }

  const target = row.target ?? null;
  const actual = resolved?.actual ?? null;
  const variance =
    target != null && actual != null ? round2(actual - target) : null;

  return {
    label: row.label,
    unit: row.unit ?? "",
    target,
    actual,
    variance,
    hasData: actual != null,
    note: resolved?.note || null,
  };
}

async function buildSectionSlide(slide, year, columns) {
  if (slide.type === "indicatorTable") {
    const rows = [];
    const notes = [];

    for (const row of slide.rows || []) {
      const resolvedRow = await resolveIndicatorRow(row, year);
      if (resolvedRow.note) notes.push(resolvedRow.note);
      rows.push(resolvedRow);
    }

    let program = null;
    if (slide.program?.source && typeof resolvers[slide.program.source] === "function") {
      const resolved = await resolvers[slide.program.source](year);
      program = {
        title: slide.program.title,
        columns: slide.program.columns || [],
        rows: resolved.rows || [],
      };
    }

    let chart = null;
    if (slide.chart?.source && typeof resolvers[slide.chart.source] === "function") {
      const resolved = await resolvers[slide.chart.source](year);
      chart = {
        title: slide.chart.title || "",
        xLabel: slide.chart.xLabel || "",
        primaryYLabel: slide.chart.primaryYLabel || "",
        secondaryYLabel: slide.chart.secondaryYLabel || "",
        labels: resolved.labels || [],
        series: (resolved.series || []).map((series) => ({
          kind: series.kind || "bar",
          name: series.name || "Series",
          values: series.values || [],
          axis: series.axis === "rate" ? "rate" : "count",
          color: series.color || "660033",
        })),
      };
    }

    return {
      type: "indicatorTable",
      title: slide.title,
      columns,
      rows,
      notes,
      program,
      chart,
    };
  }

  if (slide.type === "programTable") {
    const resolved =
      slide.source && typeof resolvers[slide.source] === "function"
        ? await resolvers[slide.source](year)
        : { rows: [] };

    return {
      type: "programTable",
      title: slide.title,
      columns: slide.columns || [],
      rows: resolved.rows || [],
    };
  }

  if (slide.type === "chart") {
    const charts = [];

    for (const chart of slide.charts || []) {
      let series = { name: "Series", labels: [], values: [] };
      if (chart.source && typeof resolvers[chart.source] === "function") {
        series = await resolvers[chart.source](year);
      }
      charts.push({
        kind: chart.kind || "bar",
        orientation: chart.orientation || "col",
        title: chart.title || "",
        xLabel: chart.xLabel || "",
        yLabel: chart.yLabel || "",
        name: series.name || "Series",
        labels: series.labels || [],
        values: series.values || [],
      });
    }

    return { type: "chart", title: slide.title, charts };
  }

  if (slide.type === "accomplishmentCards") {
    const resolved =
      slide.source && typeof resolvers[slide.source] === "function"
        ? await resolvers[slide.source](year)
        : { items: [] };

    return {
      type: "accomplishmentCards",
      title: slide.title,
      items: resolved.items || [],
    };
  }

  return { type: "unknown", title: slide.title };
}

async function buildPresidentReport({ year }) {
  const periodShort = fillTokens(reportSpec.meta.periodShortTemplate, {
    year,
    periodShort: "",
  });
  const periodLabel = fillTokens(reportSpec.meta.periodTemplate, { year });
  const columns = reportSpec.indicatorColumns.map((column) =>
    fillTokens(column, { year, periodShort }),
  );

  const sections = [];

  for (const section of reportSpec.sections) {
    const slides = [];
    for (const slide of section.slides || []) {
      slides.push(await buildSectionSlide(slide, year, columns));
    }

    sections.push({
      id: section.id,
      title: section.title,
      accent: section.accent,
      intro: section.intro,
      slides,
    });
  }

  return {
    meta: {
      ...reportSpec.meta,
      year,
      periodShort,
      periodLabel,
      generatedAt: new Date().toISOString(),
    },
    agenda: reportSpec.agenda,
    sections,
  };
}

module.exports = { buildPresidentReport };
