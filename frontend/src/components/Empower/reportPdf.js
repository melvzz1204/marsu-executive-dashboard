/**
 * Data-driven PDF report generator — presentation edition.
 *
 * Draws the Empower Intelligence Report directly with jsPDF primitives
 * (text, rectangles, lines) from the report tool data — no DOM/canvas
 * rendering, so it is immune to CSS/color/backdrop-rendering issues.
 *
 * Design: presentation-ready — hero header band, filled section bars,
 * KPI stat cards, bordered chart panels with value labels and styled
 * zebra tables. Spacing is kept tight to avoid large empty gaps.
 */

import { jsPDF } from "jspdf";
import { getInsights } from "./reportInsights.js";

// Brand palette (RGB)
const MAROON = [96, 0, 24];
const MAROON_SOFT = [248, 244, 246];
const GOLD = [212, 175, 55];
const SLATE = [100, 116, 139];
const SLATE_DARK = [15, 23, 42];
const INK = [51, 65, 85];
const GREEN = [16, 130, 90];
const LINE = [226, 232, 240];
const CARD_BG = [248, 250, 252];
const ZEBRA = [248, 250, 252];
const WHITE = [255, 255, 255];

const fmt = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n))
    ? "—"
    : Number(n).toLocaleString();

const pct = (n) => (n === null || n === undefined ? "—" : `${fmt(n)}%`);

const TOOL_TITLES = {
  getEnrollmentSnapshot: [
    "Enrollment Snapshot",
    "Campus headcount & program breakdown",
  ],
  getEnrollmentTrend: ["Enrollment Trend", "Multi-year enrollment analysis"],
  getResearchMetrics: [
    "Research Output",
    "Publications, scope & funding analysis",
  ],
  getLicensurePerformance: ["Licensure Performance", "Exam results by program"],
  getBudgetUtilization: ["Budget Utilization", "Approved vs obligated (BUR)"],
  getAccreditationStatus: [
    "Program Accreditation",
    "Accreditation status by campus & program",
  ],
  getEmployabilityTracer: [
    "Graduate Employability",
    "Tracer study — graduates vs employment",
  ],
  getGlobalRecognition: [
    "Global Recognition",
    "International rankings (THE / WURI / QS / Shanghai)",
  ],
  getCollegeLicensurePerformance: [
    "College Licensure Performance",
    "Target vs actual passing performance",
  ],
};

// ---------------------------------------------------------------------------
// KPI / chart / table extractors per tool
// ---------------------------------------------------------------------------

const extractors = {
  getEnrollmentSnapshot: (d) => ({
    kpis: [
      { label: "Total Students", value: fmt(d.totalStudents) },
      {
        label: "YoY Growth",
        value:
          d.yoyGrowthPercentage === null || d.yoyGrowthPercentage === undefined
            ? "—"
            : `${d.yoyGrowthPercentage > 0 ? "+" : ""}${d.yoyGrowthPercentage}%`,
      },
      { label: "Active Programs", value: fmt(d.activePrograms) },
      {
        label: "Priority Enroll. %",
        value:
          d.priorityEnrollmentPercentage === null
            ? "—"
            : `${d.priorityEnrollmentPercentage}%`,
      },
    ],
    chart: {
      title: `Program Enrollment — ${d.campus}, ${d.academicYear}`,
      labels: (d.programs || []).slice(0, 8).map((p) => p.code || p.program),
      series: [
        {
          label: "Students",
          values: (d.programs || []).slice(0, 8).map((p) => p.students),
          color: MAROON,
        },
      ],
    },
  }),

  getEnrollmentTrend: (d) => {
    const series = d.series || [];
    const totals = series.map((s) => s.totalStudents);
    const first = totals[0];
    const last = totals[totals.length - 1];
    const change =
      totals.length >= 2 && first
        ? ((last - first) / Math.abs(first)) * 100
        : null;
    return {
      kpis: [
        { label: "Years Covered", value: series.length },
        { label: "Latest Total", value: fmt(last) },
        {
          label: "Overall Change",
          value:
            change === null
              ? "—"
              : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
        },
      ],
      chart: {
        title: `Enrollment Trend — ${d.campus}${d.programFilter ? ` (${d.programFilter})` : ""}`,
        labels: series.map((s) => s.academicYear),
        series: [{ label: "Students", values: totals, color: MAROON }],
      },
    };
  },

  getResearchMetrics: (d) => ({
    kpis: [
      { label: "Total Papers", value: fmt(d.totalPapers) },
      { label: "Published", value: fmt(d.published) },
      { label: "With IP", value: fmt(d.withIntellectualProperty) },
      { label: "Funding (M)", value: `₱${fmt(d.totalFundingMillionsPHP)}` },
    ],
    chart: {
      title: "Research Output by Year",
      labels: Object.keys(d.papersByYear || {}).sort(),
      series: [
        {
          label: "Papers",
          values: Object.entries(d.papersByYear || {})
            .sort((a, b) => a[0] - b[0])
            .map(([, v]) => v),
          color: MAROON,
        },
      ],
    },
    table: {
      title: "Recent Research",
      columns: ["Title", "Year", "Scope"],
      rows: (d.recentTitles || [])
        .slice(0, 6)
        .map((t) => [t.title, `${t.year}`, t.scope]),
    },
  }),

  getLicensurePerformance: (d) => ({
    kpis: [
      { label: "Overall Passing", value: pct(d.overallPassingRate) },
      { label: "Programs Covered", value: fmt(d.programsCovered) },
      { label: "Year Filter", value: d.yearFilter || "All years" },
    ],
    chart: {
      title: "Passing Rate by Program (Top 10)",
      labels: (d.topPrograms || []).slice(0, 8).map((p) => p.program),
      series: [
        {
          label: "Passing %",
          values: (d.topPrograms || [])
            .slice(0, 8)
            .map((p) => p.passingRatePercent),
          color: MAROON,
        },
      ],
    },
  }),

  getBudgetUtilization: (d) => {
    const years = d.fiscalYears || [];
    const latest = years[0];
    return {
      kpis: [
        { label: "Latest FY", value: latest ? `FY ${latest.fiscalYear}` : "—" },
        {
          label: "BUR Efficiency",
          value: latest ? pct(latest.burEfficiencyPercent) : "—",
        },
        {
          label: "Target Pace",
          value: latest ? pct(latest.targetPacePercent) : "—",
        },
      ],
      chart: {
        title: "Approved vs Obligated by Fiscal Year",
        labels: years.map((y) => `FY ${y.fiscalYear}`),
        series: [
          {
            label: "Approved",
            values: years.map((y) => y.totalAllotment),
            color: SLATE,
          },
          {
            label: "Obligated",
            values: years.map((y) => y.totalObligated),
            color: MAROON,
          },
        ],
      },
    };
  },

  getAccreditationStatus: (d) => {
    const rate =
      d.totalPrograms > 0
        ? Math.round((d.accreditedPrograms / d.totalPrograms) * 1000) / 10
        : null;
    const campuses = Object.keys(d.byCampus || {});
    return {
      kpis: [
        { label: "Total Programs", value: fmt(d.totalPrograms) },
        { label: "Accredited", value: fmt(d.accreditedPrograms) },
        { label: "Review Overdue", value: fmt(d.reviewOverdue) },
        { label: "Accreditation Rate", value: pct(rate) },
      ],
      chart: {
        title: "Accreditation Coverage by Campus",
        labels: campuses,
        series: [
          {
            label: "Accredited",
            values: campuses.map((c) => d.byCampus[c].accredited),
            color: GREEN,
          },
          {
            label: "Not yet accredited",
            values: campuses.map(
              (c) => d.byCampus[c].total - d.byCampus[c].accredited,
            ),
            color: SLATE,
          },
        ],
      },
      table: {
        title: "Program Accreditation Status",
        columns: ["Program", "Campus", "Status", "Valid Until"],
        rows: (d.programs || [])
          .slice(0, 8)
          .map((p) => [
            p.program,
            p.campus,
            p.accreditationStatus,
            p.validUntil || "—",
          ]),
      },
    };
  },

  getEmployabilityTracer: (d) => {
    const series = d.series || [];
    return {
      kpis: [
        { label: "Latest Year", value: d.latest?.year ?? "—" },
        { label: "Graduates", value: fmt(d.latest?.graduates) },
        { label: "Employed", value: fmt(d.latest?.employed) },
        {
          label: "Employability",
          value: d.latest ? pct(d.latest.employabilityRatePercent) : "—",
        },
      ],
      chart: {
        title: "Graduates vs Employed",
        labels: series.map((s) => s.year),
        series: [
          {
            label: "Graduates",
            values: series.map((s) => s.graduates),
            color: SLATE,
          },
          {
            label: "Employed",
            values: series.map((s) => s.employed),
            color: MAROON,
          },
        ],
      },
    };
  },

  getGlobalRecognition: (d) => {
    const entries = d.entries || [];
    const years = entries.map((e) => e.year).filter(Boolean);
    const bodies = new Set(entries.map((e) => e.rankingBody));
    return {
      kpis: [
        { label: "Ranking Entries", value: entries.length },
        {
          label: "Latest Year",
          value: years.length ? Math.max(...years) : "—",
        },
        { label: "Ranking Bodies", value: bodies.size },
      ],
      table: {
        title: "Ranking Highlights",
        columns: ["Body", "Rating", "Year", "Overall Rank"],
        rows: entries.map((e) => [
          e.rankingBody,
          e.ratingName,
          `${e.year}`,
          `${e.overallRank ?? "—"}`,
        ]),
      },
    };
  },

  getCollegeLicensurePerformance: (d) => {
    const records = d.records || [];
    const latest = records[0];
    const chronological = [...records].reverse();
    return {
      kpis: [
        { label: "Latest Year", value: latest?.year ?? "—" },
        { label: "Target", value: latest ? pct(latest.targetPercent) : "—" },
        { label: "Actual", value: latest ? pct(latest.actualPercent) : "—" },
        {
          label: "Variance",
          value:
            latest && latest.variance !== null && latest.variance !== undefined
              ? `${latest.variance >= 0 ? "+" : ""}${latest.variance}%`
              : "—",
        },
      ],
      chart: {
        title: "Target vs Actual Passing Rate",
        labels: chronological.map((r) => r.year),
        series: [
          {
            label: "Target",
            values: chronological.map((r) => r.targetPercent),
            color: SLATE,
          },
          {
            label: "Actual",
            values: chronological.map((r) => r.actualPercent),
            color: MAROON,
          },
        ],
      },
      table: {
        title: `Program Passing Rates — ${latest?.year ?? ""}`,
        columns: ["Program", "Passed", "Total", "Rate"],
        rows: (latest?.programs || [])
          .slice(0, 8)
          .map((p) => [
            p.program,
            fmt(p.passed),
            fmt(p.total),
            pct(p.percentage),
          ]),
      },
    };
  },
};

// ---------------------------------------------------------------------------
// jsPDF drawing helpers (manual layout + pagination)
// ---------------------------------------------------------------------------

const MARGIN = 12;
const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2; // 186
const BOTTOM = PAGE_H - 14; // keep clear of footer at PAGE_H - 10

const createBuilder = () => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  let y = MARGIN;

  const ensureSpace = (needed) => {
    if (y + needed > BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const wrap = (str, maxWidth) => doc.splitTextToSize(str, maxWidth);

  // Truncate a single line with an ellipsis so it never overflows maxW.
  const fit = (str, maxW) => {
    let s = String(str ?? "");
    if (doc.getTextWidth(s) <= maxW) return s;
    while (s.length > 1 && doc.getTextWidth(`${s}…`) > maxW) {
      s = s.slice(0, -1);
    }
    return `${s}…`;
  };

  const space = (n) => {
    y += n;
  };

  // ---- Hero header band (page 1) ----
  const letterhead = (dateStr) => {
    // Marquee band
    doc.setFillColor(...MAROON);
    doc.rect(0, 0, PAGE_W, 30, "F");
    doc.setFillColor(...GOLD);
    doc.rect(0, 30, PAGE_W, 1, "F");

    // Brand block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GOLD);
    doc.text("MARINDUQUE STATE UNIVERSITY", MARGIN, 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(220, 200, 200);
    doc.text("Office of the President · Executive Dashboard", MARGIN, 15);

    // Date on right
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(220, 200, 200);
    doc.text(dateStr, PAGE_W - MARGIN, 10, { align: "right" });

    // Title block inside band
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(...WHITE);
    doc.text("Empower Intelligence Report", MARGIN, 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(
      "Generated by the MarSU AI Assistant · Live dashboard data",
      PAGE_W - MARGIN,
      24,
      { align: "right" },
    );

    y = 36;
  };

  // ---- Filled section bar with number badge ----
  const sectionHeading = (num, title, subtitle) => {
    ensureSpace(22);
    const barH = subtitle ? 14 : 10;
    doc.setFillColor(...MAROON);
    doc.roundedRect(MARGIN, y, CONTENT_W, barH, 1.5, 1.5, "F");
    // Gold accent on the left edge of the bar
    doc.setFillColor(...GOLD);
    doc.roundedRect(MARGIN, y, 2.2, barH, 1.1, 1.1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GOLD);
    doc.text(
      String(num).padStart(2, "0"),
      MARGIN + 6,
      y + (subtitle ? 8 : 6.5),
    );
    doc.setFontSize(11);
    doc.setTextColor(...WHITE);
    doc.text(fit(title, CONTENT_W - 22), MARGIN + 14, y + (subtitle ? 8 : 6.5));
    if (subtitle) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(230, 210, 215);
      doc.text(fit(subtitle, CONTENT_W - 22), MARGIN + 14, y + 12);
    }
    y += barH + 5;
  };

  // ---- Wrapped body paragraph ----
  const body = (str, indent = 0) => {
    const size = 8.5;
    // Set the exact render font BEFORE measuring so the wrap width matches
    // what the text will actually occupy once drawn.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...INK);
    const lines = wrap(str, CONTENT_W - indent);
    lines.forEach((line) => {
      ensureSpace(size * 0.5);
      doc.text(line, MARGIN + indent, y);
      y += size * 0.55;
    });
    return lines.length;
  };

  const insightBlock = (name, data) => {
    const insights = getInsights(name, data);
    if (!insights) return;
    ensureSpace(6);

    body(insights.situation.join(" "));
    y += 1.5;
  };

  // ---- KPI stat cards (2 per row when 3-4, filling width) ----
  const kpiGrid = (kpis) => {
    if (!kpis || kpis.length === 0) return;
    const items = kpis.slice(0, 4);
    const cols = items.length <= 2 ? items.length : items.length === 3 ? 3 : 4;
    const gap = 4;
    const cardW = (CONTENT_W - gap * (cols - 1)) / cols;
    const cardH = 17;
    const rows = Math.ceil(items.length / cols);

    ensureSpace(rows * (cardH + gap) + gap);

    items.forEach((kpi, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = MARGIN + col * (cardW + gap);
      const cy = y + row * (cardH + gap);

      doc.setFillColor(...CARD_BG);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, cy, cardW, cardH, 2, 2, "FD");

      // Top accent strip
      doc.setFillColor(...(col % 2 === 0 ? MAROON : GOLD));
      doc.roundedRect(x, cy, cardW, 1.4, 0.7, 0.7, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(...MAROON);
      doc.text(fit(String(kpi.value ?? "—"), cardW - 7), x + 3.5, cy + 8.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...SLATE);
      const labelLines = doc.splitTextToSize(
        String(kpi.label).toUpperCase(),
        cardW - 7,
      );
      doc.text(labelLines, x + 3.5, cy + 13.5);
    });
    y += rows * (cardH + gap);
  };

  // ---- Bordered chart panel with value labels ----
  const barChart = (chart) => {
    if (!chart || !chart.labels || chart.labels.length === 0) return;
    const maxSeries = Math.max(
      1,
      ...chart.series.flatMap((s) => s.values.map((v) => Number(v) || 0)),
    );
    const labels = chart.labels.slice(0, 10);
    const n = labels.length;
    const groupW = CONTENT_W / n;
    const barW = Math.min(groupW / (chart.series.length + 1.6), 7);

    // Panel dimensions
    const pad = 5;
    const titleRow = 7;
    const legendRow = 6;
    const plotH = 34;
    const panelH = pad + titleRow + 2 + plotH + 4 + legendRow + pad;
    ensureSpace(panelH + 4);

    const px = MARGIN;
    const py = y;
    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(px, py, CONTENT_W, panelH, 2, 2, "FD");

    // Panel title row
    doc.setFillColor(...MAROON_SOFT);
    doc.roundedRect(
      px + 0.6,
      py + 0.6,
      CONTENT_W - 1.2,
      titleRow,
      1.4,
      1.4,
      "F",
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...MAROON);
    doc.text(fit(chart.title, CONTENT_W - 10), px + 4, py + titleRow - 2.2);

    const plotTop = py + pad + titleRow + 2;
    const plotX = px + 8;

    // Gridlines
    const steps = 4;
    for (let i = 0; i <= steps; i += 1) {
      const val = (maxSeries * i) / steps;
      const yy = plotTop + plotH - (plotH * i) / steps;
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.2);
      doc.line(plotX, yy, px + CONTENT_W - pad, yy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(...SLATE);
      doc.text(
        val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${Math.round(val)}`,
        plotX - 2,
        yy,
        { align: "right" },
      );
    }

    // Bars with value labels
    const plotW = CONTENT_W - 2 * pad - 8;
    const usablePlotW = plotW;
    labels.forEach((labelName, i) => {
      const groupW2 = usablePlotW / n;
      const x0 = plotX + i * groupW2 + groupW2 * 0.2;
      chart.series.forEach((s, j) => {
        const v = Number(s.values[i]) || 0;
        const bh = (v / maxSeries) * plotH;
        const bx = x0 + j * (barW + 1.2);
        doc.setFillColor(...s.color);
        doc.roundedRect(
          bx,
          plotTop + plotH - bh,
          barW,
          Math.max(bh, 0.6),
          0.6,
          0.6,
          "F",
        );
        // Value label above bar
        if (bh > 3) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(5);
          doc.setTextColor(...SLATE_DARK);
          const shortVal =
            v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
          doc.text(shortVal, bx + barW / 2, plotTop + plotH - bh - 1, {
            align: "center",
          });
        }
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(...SLATE);
      const l = doc.splitTextToSize(String(labelName), groupW2 - 2);
      doc.text(l, plotX + i * groupW2 + groupW2 / 2, plotTop + plotH + 3.5, {
        align: "center",
      });
    });

    // Legend row
    let lx = px + pad;
    const legendY = plotTop + plotH + 11;
    const legendEnd = px + CONTENT_W - pad;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...SLATE_DARK);
    chart.series.forEach((s) => {
      const remaining = legendEnd - lx - 4.5;
      const labelText = fit(s.label, Math.max(remaining, 10));
      doc.setFillColor(...s.color);
      doc.roundedRect(lx, legendY - 1.5, 3, 3, 0.6, 0.6, "F");
      doc.text(labelText, lx + 4.5, legendY);
      lx += doc.getTextWidth(labelText) + 12;
    });

    y = py + panelH + 5;
  };

  // ---- Styled table: filled header + zebra rows ----
  const table = (tbl) => {
    if (!tbl || !tbl.columns || !tbl.rows || tbl.rows.length === 0) return;
    const colWidths = tbl.columns.map((_, i) => {
      const maxLen = Math.max(
        tbl.columns[i].length,
        ...tbl.rows.map((r) => String(r[i] ?? "").length),
      );
      return Math.min(Math.max(maxLen * 1.6 + 4, 18), 80);
    });
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    const scale = CONTENT_W / Math.max(totalW, 1);
    const widths = colWidths.map((w) => w * scale);

    ensureSpace(14 + tbl.rows.length * 6);

    const headerH = 7;
    const rowH = 5.6;

    const drawHeader = () => {
      doc.setFillColor(...MAROON);
      doc.roundedRect(MARGIN, y, CONTENT_W, headerH, 1.2, 1.2, "F");
      let x = MARGIN;
      tbl.columns.forEach((col, i) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.8);
        doc.setTextColor(...WHITE);
        const headerLines = doc.splitTextToSize(
          String(col).toUpperCase(),
          widths[i] - 5,
        );
        doc.text(headerLines[0], x + 2.5, y + headerH - 2.4);
        x += widths[i];
      });
      y += headerH;
    };

    const drawRow = (cells, i) => {
      // Set the cell render font BEFORE measuring so splitTextToSize wraps to
      // the actual width the text will occupy once drawn (avoids right-edge
      // clipping from a stale, smaller font state).
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...SLATE_DARK);
      const cellLines = cells.map((cell, ci) =>
        doc.splitTextToSize(String(cell), widths[ci] - 5),
      );
      const linesNeeded = Math.max(1, ...cellLines.map((l) => l.length));
      const rowH2 = Math.max(rowH, 3.4 + linesNeeded * 3);
      ensureSpace(rowH2 + 1);
      if (i % 2 === 1) {
        doc.setFillColor(...ZEBRA);
        doc.rect(MARGIN, y - rowH2 + 0.8, CONTENT_W, rowH2, "F");
      }
      let x = MARGIN;
      cells.forEach((cell, ci) => {
        cellLines[ci].forEach((line, li) => {
          doc.text(line, x + 2.5, y - 2 + li * 3);
        });
        x += widths[ci];
      });
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.15);
      doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
      y += rowH2;
    };

    drawHeader();
    tbl.rows.forEach((r, i) => drawRow(r, i));
    y += 3;
  };

  return {
    doc,
    letterhead,
    sectionHeading,
    insightBlock,
    kpiGrid,
    barChart,
    table,
    body,
    space,
    getY: () => y,
  };
};

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

/**
 * Generates and saves the PDF for the given reports array.
 * @param {Array<{name: string, data: object}>} reports
 */
export const generateReportPdf = (reports) => {
  const b = createBuilder();
  const { doc } = b;

  b.letterhead(
    new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  );

  reports.forEach((report, idx) => {
    const data = report.data;
    if (!data || data.found === false) {
      if (idx > 0) b.space(6);
      const title = report.name
        .replace(/^get/, "")
        .replace(/([A-Z])/g, " $1")
        .toUpperCase();
      b.sectionHeading(idx + 1, title, "");
      b.body(data?.message || "No data available.");
      return;
    }

    if (idx > 0) b.space(6);
    const [title, subtitle] = TOOL_TITLES[report.name] || [report.name, ""];
    b.sectionHeading(idx + 1, title, subtitle);

    const extracted = extractors[report.name]?.(data) || {};
    b.insightBlock(report.name, data);
    b.kpiGrid(extracted.kpis);
    b.barChart(extracted.chart);
    b.table(extracted.table);
    b.space(2);
  });

  // ---- Footer (all pages) ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFillColor(...MAROON);
    doc.rect(0, PAGE_H - 5, PAGE_W, 5, "F");
    doc.setFillColor(...GOLD);
    doc.rect(0, PAGE_H - 5, PAGE_W, 0.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...WHITE);
    doc.text("MarSU Executive Dashboard · Confidential", MARGIN, PAGE_H - 2);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 2, {
      align: "right",
    });
  }

  doc.save(
    `Empower-Intelligence-Report-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
};
