import { useEffect, useState } from "react";
import { getInsights } from "./reportInsights";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const PALETTE = {
  maroon: "#600018",
  maroonDark: "#3A0010",
  gold: "#D4AF37",
  slate: "#64748b",
  slateDark: "#0f172a",
  series: [
    "#600018",
    "#D4AF37",
    "#334155",
    "#8B2635",
    "#B8860B",
    "#475569",
    "#A52A2A",
    "#64748b",
  ],
};

const TOOL_META = {
  getEnrollmentSnapshot: {
    title: "Enrollment Snapshot Report",
    subtitle: "Campus headcount & program breakdown",
  },
  getEnrollmentTrend: {
    title: "Enrollment Trend Report",
    subtitle: "Multi-year enrollment analysis",
  },
  getResearchMetrics: {
    title: "Research Output Report",
    subtitle: "Publications, scope & funding analysis",
  },
  getLicensurePerformance: {
    title: "Licensure Performance Report",
    subtitle: "Exam results by program",
  },
  getBudgetUtilization: {
    title: "Budget Utilization Report",
    subtitle: "Approved vs obligated (BUR)",
  },
  getAccreditationStatus: {
    title: "Program Accreditation Report",
    subtitle: "Accreditation status by campus & program",
  },
  getEmployabilityTracer: {
    title: "Graduate Employability Report",
    subtitle: "Tracer study — graduates vs employment",
  },
  getGlobalRecognition: {
    title: "Global Recognition Report",
    subtitle: "International rankings (THE / WURI / QS / Shanghai)",
  },
  getCollegeLicensurePerformance: {
    title: "College Licensure Performance Report",
    subtitle: "Target vs actual passing performance",
  },
};

const formatNumber = (n) =>
  n === null || n === undefined ? "—" : Number(n).toLocaleString();

const formatPHP = (n) =>
  n === null || n === undefined
    ? "—"
    : `₱${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;

// ---------------------------------------------------------------------------
// KPI card row
// ---------------------------------------------------------------------------
const KpiCard = ({ label, value, accent }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
      {label}
    </p>
    <p
      className={`mt-1 text-xl font-bold ${accent || "text-slate-800"}`}
      style={accent ? { color: accent } : undefined}
    >
      {value}
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Chart cards
// ---------------------------------------------------------------------------
const ChartCard = ({ title, children, className = "" }) => (
  <div
    className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${className}`}
  >
    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
      {title}
    </h4>
    <div className="h-[220px]">{children}</div>
  </div>
);

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#0f172a",
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: {
      beginAtZero: true,
      grid: { color: "#f1f5f9" },
      ticks: { font: { size: 10 } },
    },
  },
};

// ---------------------------------------------------------------------------
// Report sections per tool
// ---------------------------------------------------------------------------

const EnrollmentSnapshotReport = ({ data }) => (
  <>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard
        label="Total Students"
        value={formatNumber(data.totalStudents)}
        accent={PALETTE.maroon}
      />
      <KpiCard
        label="YoY Growth"
        value={
          data.yoyGrowthPercentage === null ||
          data.yoyGrowthPercentage === undefined
            ? "—"
            : `${data.yoyGrowthPercentage > 0 ? "+" : ""}${data.yoyGrowthPercentage}%`
        }
        accent={
          data.yoyGrowthPercentage > 0
            ? "#059669"
            : data.yoyGrowthPercentage < 0
              ? "#dc2626"
              : PALETTE.slateDark
        }
      />
      <KpiCard
        label="Active Programs"
        value={formatNumber(data.activePrograms)}
      />
      <KpiCard
        label="Priority Enroll. %"
        value={
          data.priorityEnrollmentPercentage === null
            ? "—"
            : `${data.priorityEnrollmentPercentage}%`
        }
        accent={PALETTE.gold}
      />
    </div>

    <ChartCard
      title={`Program Enrollment — ${data.campus} Campus, ${data.academicYear}`}
    >
      <Bar
        data={{
          labels: (data.programs || [])
            .slice(0, 12)
            .map((p) => p.code || p.program),
          datasets: [
            {
              data: (data.programs || []).slice(0, 12).map((p) => p.students),
              backgroundColor: (data.programs || [])
                .slice(0, 12)
                .map((p) => (p.isPriority ? PALETTE.gold : PALETTE.maroon)),
              borderRadius: 6,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          plugins: {
            ...baseChartOptions.plugins,
            tooltip: {
              ...baseChartOptions.plugins.tooltip,
              callbacks: {
                label: (ctx) => {
                  const p = data.programs[ctx.dataIndex];
                  return [
                    `${formatNumber(ctx.parsed.y)} students`,
                    p?.department ? `Dept: ${p.department}` : "",
                    p?.isPriority ? "★ Priority program" : "",
                  ].filter(Boolean);
                },
              },
            },
          },
        }}
      />
    </ChartCard>

    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm inline-block"
          style={{ background: PALETTE.gold }}
        />
        CHED/RDC priority program
      </span>
      <span className="inline-flex items-center gap-1.5 ml-4">
        <span
          className="w-3 h-3 rounded-sm inline-block"
          style={{ background: PALETTE.maroon }}
        />
        Regular program
      </span>
      {data.largestProgram && (
        <span className="ml-4">
          Largest:{" "}
          <strong className="text-slate-700">{data.largestProgram}</strong>
        </span>
      )}
    </div>
  </>
);

const EnrollmentTrendReport = ({ data }) => {
  const labels = (data.series || []).map((s) => s.academicYear);
  const totals = (data.series || []).map((s) => s.totalStudents);

  // Per-program breakdown when a single program was requested.
  const programNames = [
    ...new Set(
      (data.series || []).flatMap((s) =>
        (s.matchedPrograms || []).map((p) => p.program),
      ),
    ),
  ].slice(0, 6);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard
          label="Years Covered"
          value={labels.length}
          accent={PALETTE.maroon}
        />
        <KpiCard
          label="Latest Total"
          value={formatNumber(totals[totals.length - 1])}
        />
        <KpiCard
          label="Overall Change"
          value={
            totals.length >= 2 && totals[0] > 0
              ? `${totals[totals.length - 1] - totals[0] > 0 ? "+" : ""}${(
                  ((totals[totals.length - 1] - totals[0]) / totals[0]) *
                  100
                ).toFixed(1)}%`
              : "—"
          }
          accent={
            totals.length >= 2 && totals[totals.length - 1] >= totals[0]
              ? "#059669"
              : "#dc2626"
          }
        />
      </div>

      <ChartCard
        title={`Enrollment Trend — ${data.campus} Campus${data.programFilter ? ` (${data.programFilter})` : ""}`}
      >
        <Line
          data={{
            labels,
            datasets: [
              {
                data: totals,
                borderColor: PALETTE.maroon,
                backgroundColor: `${PALETTE.maroon}18`,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: PALETTE.gold,
                pointBorderColor: PALETTE.maroon,
                pointRadius: 4,
                borderWidth: 2.5,
              },
            ],
          }}
          options={baseChartOptions}
        />
      </ChartCard>

      {programNames.length > 0 && (
        <ChartCard title="Matched Programs by Year">
          <Bar
            data={{
              labels,
              datasets: programNames.map((name, i) => ({
                label: name,
                data: (data.series || []).map(
                  (s) =>
                    (s.matchedPrograms || []).find((p) => p.program === name)
                      ?.students ?? 0,
                ),
                backgroundColor: PALETTE.series[i % PALETTE.series.length],
                borderRadius: 4,
              })),
            }}
            options={{
              ...baseChartOptions,
              plugins: {
                ...baseChartOptions.plugins,
                legend: {
                  display: true,
                  position: "bottom",
                  labels: { boxWidth: 10, font: { size: 9 } },
                },
              },
            }}
          />
        </ChartCard>
      )}
    </>
  );
};

const ResearchMetricsReport = ({ data }) => {
  const yearLabels = Object.keys(data.papersByYear || {}).sort();
  const yearCounts = yearLabels.map((y) => data.papersByYear[y]);
  const scopeLabels = Object.keys(data.papersByScope || {});
  const scopeCounts = scopeLabels.map((s) => data.papersByScope[s]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total Papers"
          value={formatNumber(data.totalPapers)}
          accent={PALETTE.maroon}
        />
        <KpiCard
          label="Published"
          value={formatNumber(data.published)}
          accent="#059669"
        />
        <KpiCard
          label="With IP"
          value={formatNumber(data.withIntellectualProperty)}
          accent={PALETTE.gold}
        />
        <KpiCard
          label="Funding"
          value={formatPHP(data.totalFundingMillionsPHP)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <ChartCard title="Research Output by Year">
          <Bar
            data={{
              labels: yearLabels,
              datasets: [
                {
                  data: yearCounts,
                  backgroundColor: PALETTE.maroon,
                  borderRadius: 6,
                },
              ],
            }}
            options={baseChartOptions}
          />
        </ChartCard>

        <ChartCard title="Distribution by Scope">
          <div className="h-[220px] flex items-center justify-center">
            <div className="relative h-[200px] w-[200px]">
              <Doughnut
                data={{
                  labels: scopeLabels,
                  datasets: [
                    {
                      data: scopeCounts,
                      backgroundColor: PALETTE.series,
                      borderColor: "#fff",
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "62%",
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { boxWidth: 10, font: { size: 9 } },
                    },
                  },
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-2xl font-bold text-slate-800">
                  {data.totalPapers}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400">
                  papers
                </span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {(data.recentTitles || []).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Recent Research
          </h4>
          <ul className="space-y-2">
            {data.recentTitles.map((t, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 text-xs border-b border-slate-100 pb-2 last:border-0"
              >
                <span className="text-slate-700 font-medium">{t.title}</span>
                <span className="flex-shrink-0 flex gap-1.5">
                  <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-semibold">
                    {t.year}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      background: `${PALETTE.maroon}12`,
                      color: PALETTE.maroon,
                    }}
                  >
                    {t.scope}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

const LicensurePerformanceReport = ({ data }) => {
  const top = (data.topPrograms || []).slice(0, 10);
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard
          label="Overall Passing Rate"
          value={
            data.overallPassingRate === null
              ? "—"
              : `${data.overallPassingRate}%`
          }
          accent={
            data.overallPassingRate >= 70
              ? "#059669"
              : data.overallPassingRate >= 50
                ? PALETTE.gold
                : "#dc2626"
          }
        />
        <KpiCard
          label="Programs Covered"
          value={formatNumber(data.programsCovered)}
          accent={PALETTE.maroon}
        />
        <KpiCard label="Year Filter" value={data.yearFilter || "All years"} />
      </div>

      <ChartCard title="Passing Rate by Program (Top 10)">
        <Bar
          data={{
            labels: top.map((p) => p.program),
            datasets: [
              {
                data: top.map((p) => p.passingRatePercent),
                backgroundColor: top.map((p) =>
                  p.passingRatePercent >= 70
                    ? "#059669"
                    : p.passingRatePercent >= 50
                      ? PALETTE.gold
                      : "#dc2626",
                ),
                borderRadius: 6,
              },
            ],
          }}
          options={{
            ...baseChartOptions,
            indexAxis: "y",
            scales: {
              ...baseChartOptions.scales,
              x: {
                ...baseChartOptions.scales.x,
                max: 100,
                grid: { color: "#f1f5f9" },
              },
              y: {
                ...baseChartOptions.scales.y,
                grid: { display: false },
                ticks: { font: { size: 9 } },
              },
            },
            plugins: {
              ...baseChartOptions.plugins,
              tooltip: {
                ...baseChartOptions.plugins.tooltip,
                callbacks: {
                  label: (ctx) => {
                    const p = top[ctx.dataIndex];
                    return [
                      `${p.passingRatePercent}% passing`,
                      `${formatNumber(p.passed)} of ${formatNumber(p.takers)} takers`,
                      p.resultsPending ? "⚠ Results pending (NDA)" : "",
                    ].filter(Boolean);
                  },
                },
              },
            },
          }}
        />
      </ChartCard>
    </>
  );
};

const BudgetUtilizationReport = ({ data }) => {
  const years = data.fiscalYears || [];
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {years.slice(0, 4).map((y) => (
          <KpiCard
            key={y.fiscalYear}
            label={`FY ${y.fiscalYear} BUR`}
            value={`${y.burEfficiencyPercent}%`}
            accent={
              y.burEfficiencyPercent >= y.targetPacePercent
                ? "#059669"
                : PALETTE.gold
            }
          />
        ))}
      </div>

      <ChartCard title="Approved vs Obligated by Fiscal Year">
        <Bar
          data={{
            labels: years.map((y) => `FY ${y.fiscalYear}`),
            datasets: [
              {
                label: "Approved",
                data: years.map((y) => y.totalAllotment),
                backgroundColor: PALETTE.slate,
                borderRadius: 4,
              },
              {
                label: "Obligated",
                data: years.map((y) => y.totalObligated),
                backgroundColor: PALETTE.maroon,
                borderRadius: 4,
              },
            ],
          }}
          options={{
            ...baseChartOptions,
            plugins: {
              ...baseChartOptions.plugins,
              legend: {
                display: true,
                position: "bottom",
                labels: { boxWidth: 10, font: { size: 9 } },
              },
              tooltip: {
                ...baseChartOptions.plugins.tooltip,
                callbacks: {
                  label: (ctx) =>
                    `${ctx.dataset.label}: ₱${formatNumber(ctx.parsed.y)}`,
                },
              },
            },
          }}
        />
      </ChartCard>

      <div className="grid md:grid-cols-3 gap-3">
        {years.slice(0, 3).map((y) => (
          <ChartCard
            key={y.fiscalYear}
            title={`FY ${y.fiscalYear} Utilization`}
          >
            <div className="h-[220px] flex items-center justify-center">
              <div className="relative h-[200px] w-[200px]">
                <Doughnut
                  data={{
                    labels: ["Obligated", "Remaining"],
                    datasets: [
                      {
                        data: [
                          y.burEfficiencyPercent,
                          Math.max(100 - y.burEfficiencyPercent, 0),
                        ],
                        backgroundColor: [
                          y.burEfficiencyPercent >= y.targetPacePercent
                            ? "#059669"
                            : PALETTE.gold,
                          "#f1f5f9",
                        ],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "68%",
                    plugins: { legend: { display: false } },
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-800">
                    {y.burEfficiencyPercent}%
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400">
                    of {formatPHP(y.totalAllotment)}
                  </span>
                </div>
              </div>
            </div>
          </ChartCard>
        ))}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Accreditation status (Higher Education programs)
// ---------------------------------------------------------------------------

const AccreditationStatusReport = ({ data }) => {
  const campuses = Object.keys(data.byCampus || {});
  const accreditationRate =
    data.totalPrograms > 0
      ? Math.round((data.accreditedPrograms / data.totalPrograms) * 1000) / 10
      : 0;
  const programs = (data.programs || []).slice(0, 10);
  const chartTitle =
    data.campusFilter && data.campusFilter !== "all campuses"
      ? `Accreditation Coverage — ${data.campusFilter} Campus`
      : "Accreditation Coverage by Campus";

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total Programs"
          value={formatNumber(data.totalPrograms)}
          accent={PALETTE.maroon}
        />
        <KpiCard
          label="Accredited"
          value={formatNumber(data.accreditedPrograms)}
          accent="#059669"
        />
        <KpiCard
          label="Review Overdue"
          value={formatNumber(data.reviewOverdue)}
          accent={data.reviewOverdue > 0 ? "#dc2626" : PALETTE.slateDark}
        />
        <KpiCard
          label="Accreditation Rate"
          value={`${accreditationRate}%`}
          accent={PALETTE.gold}
        />
      </div>

      {campuses.length > 0 && (
        <ChartCard title={chartTitle}>
          <Bar
            data={{
              labels: campuses,
              datasets: [
                {
                  label: "Accredited",
                  data: campuses.map((c) => data.byCampus[c].accredited),
                  backgroundColor: "#059669",
                  borderRadius: 4,
                  stack: "accreditation",
                },
                {
                  label: "Not yet accredited",
                  data: campuses.map(
                    (c) => data.byCampus[c].total - data.byCampus[c].accredited,
                  ),
                  backgroundColor: PALETTE.slate,
                  borderRadius: 4,
                  stack: "accreditation",
                },
              ],
            }}
            options={{
              ...baseChartOptions,
              scales: {
                ...baseChartOptions.scales,
                x: { ...baseChartOptions.scales.x, stacked: true },
                y: { ...baseChartOptions.scales.y, stacked: true },
              },
              plugins: {
                ...baseChartOptions.plugins,
                legend: {
                  display: true,
                  position: "bottom",
                  labels: { boxWidth: 10, font: { size: 9 } },
                },
              },
            }}
          />
        </ChartCard>
      )}

      {programs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Program Accreditation Status
          </h4>
          <ul className="space-y-2">
            {programs.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 text-xs border-b border-slate-100 pb-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-slate-700 font-medium truncate">
                    {p.program}
                  </p>
                  <p className="text-slate-400">
                    {p.campus}
                    {p.validUntil ? ` · valid until ${p.validUntil}` : ""}
                  </p>
                </div>
                <span className="flex-shrink-0 flex gap-1.5">
                  <span
                    className="px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      background: p.isAccredited
                        ? "#05966915"
                        : `${PALETTE.gold}15`,
                      color: p.isAccredited ? "#059669" : PALETTE.gold,
                    }}
                  >
                    {p.accreditationStatus}
                  </span>
                  {p.reviewStatus === "Review Overdue" && (
                    <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                      Overdue
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Graduate employability tracer
// ---------------------------------------------------------------------------

const EmployabilityTracerReport = ({ data }) => {
  const series = data.series || [];
  const labels = series.map((s) => s.year);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Latest Year"
          value={data.latest?.year ?? "—"}
          accent={PALETTE.maroon}
        />
        <KpiCard
          label="Graduates"
          value={formatNumber(data.latest?.graduates)}
        />
        <KpiCard
          label="Employed"
          value={formatNumber(data.latest?.employed)}
          accent="#059669"
        />
        <KpiCard
          label="Employability Rate"
          value={data.latest ? `${data.latest.employabilityRatePercent}%` : "—"}
          accent={PALETTE.gold}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <ChartCard title="Graduates vs Employed">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "Graduates",
                  data: series.map((s) => s.graduates),
                  backgroundColor: PALETTE.slate,
                  borderRadius: 4,
                },
                {
                  label: "Employed",
                  data: series.map((s) => s.employed),
                  backgroundColor: PALETTE.maroon,
                  borderRadius: 4,
                },
              ],
            }}
            options={{
              ...baseChartOptions,
              plugins: {
                ...baseChartOptions.plugins,
                legend: {
                  display: true,
                  position: "bottom",
                  labels: { boxWidth: 10, font: { size: 9 } },
                },
              },
            }}
          />
        </ChartCard>

        <ChartCard title="Employability Rate Trend">
          <Line
            data={{
              labels,
              datasets: [
                {
                  data: series.map((s) => s.employabilityRatePercent),
                  borderColor: PALETTE.gold,
                  backgroundColor: `${PALETTE.gold}18`,
                  fill: true,
                  tension: 0.35,
                  pointBackgroundColor: PALETTE.maroon,
                  pointBorderColor: PALETTE.gold,
                  pointRadius: 4,
                  borderWidth: 2.5,
                },
              ],
            }}
            options={{
              ...baseChartOptions,
              scales: {
                ...baseChartOptions.scales,
                y: {
                  ...baseChartOptions.scales.y,
                  max: 100,
                  ticks: {
                    ...baseChartOptions.scales.y.ticks,
                    callback: (v) => `${v}%`,
                  },
                },
              },
            }}
          />
        </ChartCard>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Global recognition rankings (THE / WURI / QS / Shanghai)
// ---------------------------------------------------------------------------

const GlobalRecognitionReport = ({ data }) => {
  const entries = data.entries || [];
  const years = entries.map((e) => e.year).filter(Boolean);
  const latestYear = years.length > 0 ? Math.max(...years) : "—";
  const bodies = new Set(entries.map((e) => e.rankingBody));

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard
          label="Ranking Entries"
          value={entries.length}
          accent={PALETTE.maroon}
        />
        <KpiCard label="Latest Ranking Year" value={latestYear} />
        <KpiCard
          label="Ranking Bodies"
          value={bodies.size}
          accent={PALETTE.gold}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Ranking Highlights
        </h4>
        {entries.map((e, i) => (
          <div
            key={i}
            className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  {e.rankingBody}
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    {e.ratingName} · {e.year}
                  </span>
                </p>
                {e.overallContext && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {e.overallContext}
                  </p>
                )}
              </div>
              <span
                className="flex-shrink-0 px-2.5 py-1 rounded-lg text-sm font-bold text-white"
                style={{ background: PALETTE.maroon }}
              >
                {e.overallRank ?? "—"}
              </span>
            </div>
            {(e.metrics || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {e.metrics.map((m, j) => (
                  <span
                    key={j}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${PALETTE.gold}18`,
                      color: "#8B6914",
                    }}
                  >
                    {m.label}: {m.rank}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// College licensure performance (target vs actual)
// ---------------------------------------------------------------------------

const CollegeLicensurePerformanceReport = ({ data }) => {
  const records = data.records || [];
  const latest = records[0];
  const chronological = [...records].reverse();
  const latestPrograms = (latest?.programs || []).slice(0, 10);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Latest Year"
          value={latest?.year ?? "—"}
          accent={PALETTE.maroon}
        />
        <KpiCard
          label="Target"
          value={latest ? `${latest.targetPercent}%` : "—"}
        />
        <KpiCard
          label="Actual"
          value={latest ? `${latest.actualPercent}%` : "—"}
          accent={
            latest && latest.actualPercent >= latest.targetPercent
              ? "#059669"
              : "#dc2626"
          }
        />
        <KpiCard
          label="Variance"
          value={
            latest && latest.variance !== null && latest.variance !== undefined
              ? `${latest.variance > 0 ? "+" : ""}${latest.variance}%`
              : "—"
          }
          accent={latest && latest.variance >= 0 ? "#059669" : "#dc2626"}
        />
      </div>

      <ChartCard
        title={`Target vs Actual Passing Rate — ${data.scope || "Institution-wide"}`}
      >
        <Bar
          data={{
            labels: chronological.map((r) => r.year),
            datasets: [
              {
                label: "Target",
                data: chronological.map((r) => r.targetPercent),
                backgroundColor: PALETTE.slate,
                borderRadius: 4,
              },
              {
                label: "Actual",
                data: chronological.map((r) => r.actualPercent),
                backgroundColor: PALETTE.maroon,
                borderRadius: 4,
              },
            ],
          }}
          options={{
            ...baseChartOptions,
            scales: {
              ...baseChartOptions.scales,
              y: {
                ...baseChartOptions.scales.y,
                max: 100,
                ticks: {
                  ...baseChartOptions.scales.y.ticks,
                  callback: (v) => `${v}%`,
                },
              },
            },
            plugins: {
              ...baseChartOptions.plugins,
              legend: {
                display: true,
                position: "bottom",
                labels: { boxWidth: 10, font: { size: 9 } },
              },
            },
          }}
        />
      </ChartCard>

      {latestPrograms.length > 0 && (
        <ChartCard title={`Program Passing Rates — ${latest.year}`}>
          <Bar
            data={{
              labels: latestPrograms.map((p) => p.program),
              datasets: [
                {
                  data: latestPrograms.map((p) => p.percentage),
                  backgroundColor: latestPrograms.map((p) =>
                    p.percentage >= (latest.targetPercent ?? 0)
                      ? "#059669"
                      : PALETTE.gold,
                  ),
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              ...baseChartOptions,
              indexAxis: "y",
              scales: {
                ...baseChartOptions.scales,
                x: {
                  ...baseChartOptions.scales.x,
                  max: 100,
                  grid: { color: "#f1f5f9" },
                },
                y: {
                  ...baseChartOptions.scales.y,
                  grid: { display: false },
                  ticks: { font: { size: 9 } },
                },
              },
              plugins: {
                ...baseChartOptions.plugins,
                tooltip: {
                  ...baseChartOptions.plugins.tooltip,
                  callbacks: {
                    label: (ctx) => {
                      const p = latestPrograms[ctx.dataIndex];
                      return [
                        `${p.percentage}% passing`,
                        `${formatNumber(p.passed)} of ${formatNumber(p.total)} candidates`,
                      ];
                    },
                  },
                },
              },
            }}
          />
        </ChartCard>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Insight narrative block (situation analysis + recommendations)
// ---------------------------------------------------------------------------

const InsightBlock = ({ reportName, data }) => {
  const insights = getInsights(reportName, data);
  if (!insights) return null;

  return (
    <div className="space-y-3">
      <div
        className="bg-white border-l-4 rounded-r-xl border-slate-200 p-4 shadow-sm"
        style={{ borderLeftColor: PALETTE.maroon }}
      >
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Situation Analysis
        </h4>
        <div className="space-y-2">
          {insights.situation.map((para, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-slate-600">
              {para}
            </p>
          ))}
        </div>
      </div>

      <div
        className="bg-white border-l-4 rounded-r-xl border-slate-200 p-4 shadow-sm"
        style={{ borderLeftColor: PALETTE.gold }}
      >
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          Recommendations
        </h4>
        <ul className="space-y-1.5">
          {insights.recommendations.map((rec, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-600"
            >
              <span
                className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ background: PALETTE.gold }}
              />
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const REPORT_SECTIONS = {
  getEnrollmentSnapshot: EnrollmentSnapshotReport,
  getEnrollmentTrend: EnrollmentTrendReport,
  getResearchMetrics: ResearchMetricsReport,
  getLicensurePerformance: LicensurePerformanceReport,
  getBudgetUtilization: BudgetUtilizationReport,
  getAccreditationStatus: AccreditationStatusReport,
  getEmployabilityTracer: EmployabilityTracerReport,
  getGlobalRecognition: GlobalRecognitionReport,
  getCollegeLicensurePerformance: CollegeLicensurePerformanceReport,
};

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
const ChatReportModal = ({ reports, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!reports || reports.length === 0) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Data-driven PDF builder — no DOM/canvas rendering, so it avoids
      // Tailwind v4 (oklch) colors and backdrop-blur capture issues entirely.
      const { generateReportPdf } = await import("./reportPdf");
      generateReportPdf(reports);
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.alert(
        "Sorry, the PDF could not be generated. Please try again or contact the administrator.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      id="empower-report-root"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Print-only styles */}
      <style>{`
        /* Print-only helpers for the browser's native Print dialog.
           The Download PDF button uses the data-driven jsPDF generator
           (reportPdf.js) which does not touch the DOM at all. */
        .print-mode #empower-report-root,
        #empower-report-root.print-mode {
          position: static !important;
          background: #ffffff !important;
          padding: 0 !important;
          max-height: none !important;
          overflow: visible !important;
        }
        #empower-report-root.print-mode .print-header {
          display: block !important;
        }
        #empower-report-root.print-mode .screen-only {
          display: none !important;
        }
        #empower-report-root.print-mode .print-sheet {
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          max-height: none !important;
          overflow: visible !important;
          width: 100% !important;
        }
        #empower-report-root.print-mode .print-sheet .overflow-y-auto {
          overflow: visible !important;
          max-height: none !important;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }
          #empower-report-root,
          #empower-report-root * {
            visibility: visible !important;
          }
          #empower-report-root {
            position: static !important;
            background: #ffffff !important;
            padding: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          #empower-report-root .print-header {
            display: block !important;
          }
          #empower-report-root .screen-only {
            display: none !important;
          }
          #empower-report-root .print-sheet {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            width: 100% !important;
          }
          #empower-report-root .print-sheet .overflow-y-auto {
            overflow: visible !important;
            max-height: none !important;
          }
        }
      `}</style>

      {/* Print-only header */}
      <div className="hidden print-header">
        <div className="flex items-center justify-between border-b-2 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#600018] flex items-center justify-center text-[#D4AF37] font-bold">
              M
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#600018]">
                Marinduque State University
              </h1>
              <p className="text-xs text-slate-500">
                Executive Dashboard · Empower Intelligence Report
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>
              Generated:{" "}
              {new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p>Confidential — for internal use</p>
          </div>
        </div>
      </div>

      <div
        className="print-sheet bg-[#FAFAFA] w-full max-w-3xl max-h-[88vh] rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.5)] border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#600018] to-[#3A0010] px-6 py-4 text-white flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border border-[#D4AF37]/50">
              <svg
                className="w-4 h-4 text-[#D4AF37]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide text-[#D4AF37] uppercase">
                Empower Intelligence Report
              </h3>
              <p className="text-[11px] text-white/60">
                Generated by the MarSU AI Assistant ·{" "}
                {new Date().toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="screen-only flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#600018] bg-[#D4AF37] hover:bg-[#c8a031] rounded-lg transition-colors disabled:opacity-60 disabled:cursor-wait"
              title="Download report as PDF"
            >
              {downloading ? (
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              )}
              {downloading ? "Preparing PDF…" : "Download PDF"}
            </button>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors p-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          {reports.map((report, idx) => {
            const Section = REPORT_SECTIONS[report.name];
            const meta = TOOL_META[report.name] || {
              title: "Report",
              subtitle: "",
            };
            if (!Section) return null;
            const isEmpty = report.data && report.data.found === false;
            return (
              <section key={idx} className="space-y-4">
                {reports.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: PALETTE.maroon }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {meta.title}
                      </h3>
                      {meta.subtitle && (
                        <p className="text-[11px] text-slate-400">
                          {meta.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {isEmpty ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
                    <p className="text-sm text-slate-500">
                      {report.data.message ||
                        "No data available for this report."}
                    </p>
                  </div>
                ) : (
                  <>
                    <InsightBlock reportName={report.name} data={report.data} />
                    <Section data={report.data} />
                  </>
                )}
                {idx < reports.length - 1 && (
                  <hr className="border-slate-200" />
                )}
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <div className="screen-only px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            MarSU Executive Dashboard · Live data
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors"
            style={{ background: PALETTE.maroon }}
          >
            Close Report
          </button>
        </div>

        {/* Print-only footer */}
        <div className="hidden print-header border-t border-slate-200 mt-6 pt-3 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Marinduque State University · Executive Dashboard</span>
          <span>
            Page {new Date().getFullYear()} · Empower Intelligence Report
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatReportModal;
