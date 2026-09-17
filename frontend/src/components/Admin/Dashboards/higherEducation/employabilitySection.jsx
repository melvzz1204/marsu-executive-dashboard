// components/EmployabilityMetrics.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import api from "../../../../api/axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const PALETTE = {
  maroon: "#660033",
  maroonHover: "#4a0025",
  gold: "#D4AF37",
  brightGold: "#FFD700",
  slateDark: "#0f172a",
  slateMuted: "#64748b",
};

const ALL_PROGRAMS = "All Programs";
const ALL_COLLEGES = "All Colleges";
const ALL_YEARS = "All Years";
const TARGET_RATE = 65;

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200/60 rounded ${className}`}></div>
);

const ChevronDownIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
    <path
      d="m6 8 4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Placement-rate bands used for colour coding and the distribution strip.
const BANDS = [
  { label: "90% and above", min: 90, bar: "#047857", chip: "bg-emerald-600" },
  { label: "75% – 89%", min: 75, bar: "#10b981", chip: "bg-emerald-400" },
  { label: "50% – 74%", min: 50, bar: "#D4AF37", chip: "bg-amber-400" },
  { label: "Below 50%", min: 0, bar: "#e11d48", chip: "bg-rose-500" },
];

const bandIndex = (rate) => {
  if (rate >= 90) return 0;
  if (rate >= 75) return 1;
  if (rate >= 50) return 2;
  return 3;
};

const rateTone = (rate) => {
  const index = bandIndex(rate);
  if (index === 0) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (index === 1) return "bg-teal-50 text-teal-700 border-teal-200";
  if (index === 2) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
};

const formatRate = (value) => `${Math.round((Number(value) || 0) * 10) / 10}%`;

// Shorten long college labels for the chart axis without losing meaning.
// Full names are still shown in tooltips via the chart's title callback.
const shortenCollegeName = (name) =>
  String(name || "")
    .replace(/^(COLLEGE|SCHOOL|INSTITUTE)\s+OF\s+/i, "")
    .replace(/\s+AND\s+/gi, " & ")
    .trim();

export default function EmployabilityMetrics() {
  const [statsData, setStatsData] = useState(null);
  const [programTracer, setProgramTracer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [overviewData, setOverviewData] = useState(null);

  const [selectedCollege, setSelectedCollege] = useState(ALL_COLLEGES);
  const [selectedProgram, setSelectedProgram] = useState(ALL_PROGRAMS);
  const [selectedYear, setSelectedYear] = useState(ALL_YEARS);
  const [yearOptions, setYearOptions] = useState([]);

  const [programSearch, setProgramSearch] = useState("");
  const [leaderboardMode, setLeaderboardMode] = useState("all");
  const [matrixSearch, setMatrixSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "year",
    direction: "desc",
  });

  const fetchTracerStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baseParams = {};
      if (selectedYear !== ALL_YEARS) {
        baseParams.year = selectedYear;
      }

      const scopedParams = { ...baseParams };
      if (selectedCollege !== ALL_COLLEGES) {
        scopedParams.collegeName = selectedCollege;
      }

      // Fetch the scoped stats and, when a college drill-down is active, the
      // institution-wide catalog for the college comparison visual.
      const [scopedResponse, overviewResponse] = await Promise.all([
        api.get("/higher-education/stats", { params: scopedParams }),
        selectedCollege === ALL_COLLEGES
          ? Promise.resolve(null)
          : api.get("/higher-education/stats", { params: baseParams }),
      ]);

      const data = scopedResponse.data.data;
      setStatsData(data);
      setOverviewData(overviewResponse ? overviewResponse.data.data : null);

      // availableYears ignores the year filter so the list stays stable.
      const years = (data.availableYears || []).map(String);
      setYearOptions(years);
      if (selectedYear !== ALL_YEARS && !years.includes(String(selectedYear))) {
        setSelectedYear(ALL_YEARS);
      }

      if (selectedProgram !== ALL_PROGRAMS) {
        const tracerResponse = await api.get("/higher-education/tracer", {
          params: { ...scopedParams, programName: selectedProgram },
        });
        setProgramTracer(tracerResponse.data.data);
      } else {
        setProgramTracer(null);
      }
    } catch (err) {
      console.error("Error fetching employability stats:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to connect to the server",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCollege, selectedProgram, selectedYear]);

  useEffect(() => {
    const initialFetch = window.setTimeout(fetchTracerStats, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchTracerStats]);

  const isProgramScope = selectedProgram !== ALL_PROGRAMS;

  const programList = useMemo(
    () => statsData?.programEmployability || [],
    [statsData],
  );
  const institutionSeries = useMemo(
    () => statsData?.tracerStudyMatrix || [],
    [statsData],
  );

  const tracerMatrix = useMemo(() => {
    if (isProgramScope) return programTracer?.series || [];
    return institutionSeries;
  }, [isProgramScope, programTracer, institutionSeries]);

  const kpis = useMemo(() => statsData?.kpis || {}, [statsData]);
  const effectiveKpis = useMemo(() => {
    if (isProgramScope && programTracer?.summary) {
      return {
        cumulativeEmployabilityPercentage:
          programTracer.summary.employabilityPercentage,
        totalGraduates: programTracer.summary.totalGraduates,
        totalEmployed: programTracer.summary.employedCount,
      };
    }
    return kpis;
  }, [isProgramScope, programTracer, kpis]);

  const cumulativeRate = effectiveKpis.cumulativeEmployabilityPercentage || 0;
  const totalGraduatesSum = effectiveKpis.totalGraduates || 0;
  const totalEmployedSum = effectiveKpis.totalEmployed || 0;

  const peakClass = useMemo(() => {
    if (!tracerMatrix.length) return null;
    return [...tracerMatrix].sort(
      (a, b) =>
        (b.employabilityPercentage || 0) - (a.employabilityPercentage || 0),
    )[0];
  }, [tracerMatrix]);

  // Searchable, ranked program list (highest placement first)
  const rankedPrograms = useMemo(() => {
    const query = programSearch.trim().toLowerCase();
    const rows = query
      ? programList.filter(
          (program) =>
            program.programName.toLowerCase().includes(query) ||
            (program.collegeName || "").toLowerCase().includes(query),
        )
      : programList;

    return [...rows]
      .sort(
        (a, b) =>
          (b.employabilityPercentage || 0) - (a.employabilityPercentage || 0) ||
          (b.totalGraduates || 0) - (a.totalGraduates || 0),
      )
      .map((program, index) => ({ ...program, rank: index + 1 }));
  }, [programList, programSearch]);

  const leaderboardRows = useMemo(() => {
    if (leaderboardMode === "all") return rankedPrograms;
    if (leaderboardMode === "bottom") {
      return rankedPrograms.slice(-10).reverse();
    }
    return rankedPrograms.slice(0, 10);
  }, [rankedPrograms, leaderboardMode]);

  const programOptions = useMemo(() => {
    const seen = new Map();
    programList.forEach((program) => {
      if (!seen.has(program.programName)) {
        seen.set(program.programName, program);
      }
    });
    return [...seen.values()].sort((a, b) =>
      a.programName.localeCompare(b.programName),
    );
  }, [programList]);

  // College-level roll-up (all colleges) for the comparison visual.
  const collegeSource = overviewData || statsData;
  const collegePrograms = useMemo(
    () => collegeSource?.programEmployability || [],
    [collegeSource],
  );

  const collegeEmployability = useMemo(() => {
    const map = new Map();
    collegePrograms.forEach((program) => {
      const key = program.collegeName || "Unassigned college";
      const current = map.get(key) || {
        collegeName: key,
        totalGraduates: 0,
        employedCount: 0,
        programCount: 0,
      };
      current.totalGraduates += program.totalGraduates || 0;
      current.employedCount += program.employedCount || 0;
      current.programCount += 1;
      map.set(key, current);
    });

    return [...map.values()]
      .map((college) => ({
        ...college,
        employabilityPercentage:
          college.totalGraduates > 0
            ? Math.round(
                (college.employedCount / college.totalGraduates) * 10000,
              ) / 100
            : 0,
      }))
      .sort(
        (a, b) =>
          b.employabilityPercentage - a.employabilityPercentage ||
          b.totalGraduates - a.totalGraduates,
      );
  }, [collegePrograms]);

  const collegeOptions = useMemo(
    () =>
      collegeEmployability
        .map((college) => college.collegeName)
        .sort((a, b) => a.localeCompare(b)),
    [collegeEmployability],
  );

  const collegeChartRows = useMemo(
    () => collegeEmployability.slice(0, 12),
    [collegeEmployability],
  );

  const handleCollegeSelect = useCallback((collegeName) => {
    setSelectedCollege((current) =>
      current === collegeName ? ALL_COLLEGES : collegeName,
    );
    setSelectedProgram(ALL_PROGRAMS);
  }, []);

  const collegeChartData = useMemo(
    () => ({
      labels: collegeChartRows.map((college) =>
        shortenCollegeName(college.collegeName),
      ),
      datasets: [
        {
          label: "Placement Rate (%)",
          data: collegeChartRows.map(
            (college) => college.employabilityPercentage,
          ),
          backgroundColor: collegeChartRows.map((college) =>
            college.collegeName === selectedCollege
              ? PALETTE.gold
              : PALETTE.maroon,
          ),
          hoverBackgroundColor: PALETTE.maroonHover,
          borderRadius: 4,
          barPercentage: 0.72,
        },
      ],
    }),
    [collegeChartRows, selectedCollege],
  );

  const collegeChartOptions = useMemo(
    () => ({
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      onClick: (_event, elements) => {
        if (elements && elements.length > 0) {
          const college = collegeChartRows[elements[0].index];
          if (college) handleCollegeSelect(college.collegeName);
        }
      },
      onHover: (event, elements) => {
        if (event?.native?.target) {
          event.native.target.style.cursor =
            elements && elements.length > 0 ? "pointer" : "default";
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          padding: 10,
          backgroundColor: PALETTE.slateDark,
          callbacks: {
            title: (items) => {
              const college =
                items.length > 0
                  ? collegeChartRows[items[0].dataIndex]
                  : null;
              return college ? college.collegeName : "";
            },
            label: (context) => {
              const college = collegeChartRows[context.dataIndex];
              if (!college) return "";
              return ` ${college.employabilityPercentage}% · ${college.employedCount.toLocaleString()} of ${college.totalGraduates.toLocaleString()} employed`;
            },
            afterLabel: (context) => {
              const college = collegeChartRows[context.dataIndex];
              return college ? `${college.programCount} program(s)` : "";
            },
          },
        },
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { color: "#f1f5f9" },
          ticks: {
            color: PALETTE.slateMuted,
            callback: (value) => `${value}%`,
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            autoSkip: false,
            color: PALETTE.slateMuted,
            font: { size: 10, weight: "600" },
          },
        },
      },
    }),
    [collegeChartRows, handleCollegeSelect],
  );

  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0];
    programList.forEach((program) => {
      counts[bandIndex(program.employabilityPercentage || 0)] += 1;
    });
    return counts;
  }, [programList]);

  // Program vs. institution placement comparison for the trend chart
  const chartData = useMemo(() => {
    const labels = tracerMatrix.map((row) => `CY ${row.year}`);
    const graduates = tracerMatrix.map((row) => row.totalGraduates || 0);
    const employed = tracerMatrix.map((row) => row.employedCount || 0);
    const rates = tracerMatrix.map((row) => row.employabilityPercentage || 0);

    const datasets = [
      {
        type: "bar",
        label: "Total Cohort",
        data: graduates,
        backgroundColor: "rgba(203, 213, 225, 0.65)",
        hoverBackgroundColor: "rgba(203, 213, 225, 0.9)",
        borderRadius: 4,
        barPercentage: 0.9,
        categoryPercentage: 0.55,
        order: 3,
        yAxisID: "yCount",
      },
      {
        type: "bar",
        label: "Employed Alumni",
        data: employed,
        backgroundColor: PALETTE.maroon,
        hoverBackgroundColor: PALETTE.maroonHover,
        borderRadius: 4,
        barPercentage: 0.9,
        categoryPercentage: 0.55,
        order: 2,
        yAxisID: "yCount",
      },
      {
        type: "line",
        label: isProgramScope ? "Program Rate (%)" : "Placement Rate (%)",
        data: rates,
        borderColor: PALETTE.gold,
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        borderWidth: 3.5,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: PALETTE.gold,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.35,
        order: 1,
        yAxisID: "yPercentage",
      },
      {
        type: "line",
        label: `Target (${TARGET_RATE}%)`,
        data: labels.map(() => TARGET_RATE),
        borderColor: "rgba(100, 116, 139, 0.45)",
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        order: 0,
        yAxisID: "yPercentage",
      },
    ];

    if (isProgramScope && institutionSeries.length > 0) {
      const institutionByYear = new Map(
        institutionSeries.map((row) => [row.year, row.employabilityPercentage]),
      );
      datasets.splice(3, 0, {
        type: "line",
        label:
          selectedCollege === ALL_COLLEGES
            ? "Institution Avg (%)"
            : "College Avg (%)",
        data: tracerMatrix.map(
          (row) => institutionByYear.get(row.year) ?? null,
        ),
        borderColor: "#64748b",
        borderDash: [3, 3],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        spanGaps: true,
        tension: 0.35,
        order: 1,
        yAxisID: "yPercentage",
      });
    }

    return { labels, datasets };
  }, [
    tracerMatrix,
    institutionSeries,
    isProgramScope,
    selectedCollege,
  ]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            color: PALETTE.slateDark,
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: "circle",
            font: { size: 11, weight: "600" },
          },
        },
        tooltip: {
          padding: 12,
          backgroundColor: PALETTE.slateDark,
          titleColor: "#ffffff",
          bodyColor: "#cbd5e1",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          titleFont: { size: 12, weight: "700" },
          bodyFont: { size: 12 },
          borderRadius: 8,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || "";
              if (label.includes("%")) {
                return ` ${label}: ${context.raw}%`;
              }
              return ` ${label}: ${Number(context.raw).toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: PALETTE.slateMuted, font: { size: 11, weight: "600" } },
        },
        yCount: {
          type: "linear",
          position: "left",
          grid: { color: "#f1f5f9" },
          ticks: { color: PALETTE.slateMuted, font: { size: 11 } },
        },
        yPercentage: {
          type: "linear",
          position: "right",
          min: 0,
          max: 100,
          grid: { display: false },
          ticks: {
            color: PALETTE.slateMuted,
            font: { size: 11 },
            callback: (value) => `${value}%`,
          },
        },
      },
    }),
    [],
  );

  const processedMatrix = useMemo(() => {
    if (!tracerMatrix.length) return [];
    const filtered = tracerMatrix.filter(
      (row) =>
        `CY ${row.year}`.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        String(row.year).includes(matrixSearch),
    );

    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tracerMatrix, matrixSearch, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const scopeLabel = isProgramScope
    ? selectedProgram
    : selectedCollege !== ALL_COLLEGES
      ? selectedCollege
      : "Institution-wide";

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-800 antialiased rounded-2xl font-sans">
      <div className="w-full space-y-6 p-4 sm:p-6 lg:px-8 lg:py-10 2xl:px-10">
        {/* HEADER */}
        <div
          id="block-employability-tracer"
          className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6"
        >
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#660033]">
              Institutional Career Services & Alumni Affairs
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Graduate Employability Metrics
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Viewing{" "}
              <span className="font-semibold text-slate-600">{scopeLabel}</span>
              {isProgramScope && selectedCollege !== ALL_COLLEGES
                ? ` · ${selectedCollege}`
                : ""}
              {selectedYear !== ALL_YEARS ? ` · ${selectedYear}` : ""}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end xl:w-auto">
            <label className="block w-full sm:w-36">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Year
              </span>
              <span className="relative block">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#660033] focus:ring-2 focus:ring-[#660033]/10"
                >
                  <option value={ALL_YEARS}>{ALL_YEARS}</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <ChevronDownIcon />
                </span>
              </span>
            </label>

            <label className="block w-full sm:w-60">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                College
              </span>
              <span className="relative block">
                <select
                  value={selectedCollege}
                  title={selectedCollege}
                  onChange={(e) => {
                    setSelectedCollege(e.target.value);
                    setSelectedProgram(ALL_PROGRAMS);
                  }}
                  className="h-9 w-full appearance-none truncate rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#660033] focus:ring-2 focus:ring-[#660033]/10"
                >
                  <option value={ALL_COLLEGES}>{ALL_COLLEGES}</option>
                  {collegeOptions.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <ChevronDownIcon />
                </span>
              </span>
            </label>

            <label className="block w-full sm:w-72">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Program
              </span>
              <span className="relative block">
                <select
                  value={selectedProgram}
                  title={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="h-9 w-full appearance-none truncate rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#660033] focus:ring-2 focus:ring-[#660033]/10"
                >
                  <option value={ALL_PROGRAMS}>
                    {selectedCollege === ALL_COLLEGES
                      ? "Institution-wide"
                      : "All programs in college"}
                  </option>
                  {programOptions.map((program) => (
                    <option key={program.programName} value={program.programName}>
                      {program.programName}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <ChevronDownIcon />
                </span>
              </span>
            </label>

            {isProgramScope && (
              <button
                type="button"
                onClick={() => setSelectedProgram(ALL_PROGRAMS)}
                className="h-9 shrink-0 cursor-pointer rounded-lg bg-[#660033] px-4 text-xs font-bold text-white transition-colors hover:bg-[#4a0025]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700"
            role="alert"
          >
            <span>⚠️ {error}</span>
            <button
              onClick={fetchTracerStats}
              className="font-bold underline hover:text-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative flex min-h-[140px] flex-col justify-between rounded-2xl bg-[#660033] p-6 text-white shadow-[0_4px_0_0_#D4AF37]">
            <div>
              <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                {isProgramScope ? "Program Placement Rate" : "Cumulative Placement Rate"}
              </span>
              {loading ? (
                <Skeleton className="my-2 h-8 w-24 bg-white/20" />
              ) : (
                <span className="my-1 block text-3xl font-black leading-none tracking-tight text-[#FFD700]">
                  {formatRate(cumulativeRate)}
                </span>
              )}
            </div>
            <span className="mt-4 border-t border-white/10 pt-2 text-[11px] font-medium tracking-wide text-slate-200/90">
              graduate-weighted across collected years
            </span>
          </div>

          <div className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div>
              <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Employed Alumni
              </span>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-28" />
              ) : (
                <h3 className="mt-1.5 text-3xl font-black tracking-tight text-slate-900">
                  {totalEmployedSum.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    / {totalGraduatesSum.toLocaleString()}
                  </span>
                </h3>
              )}
            </div>
            <span className="mt-auto border-t border-slate-100 pt-2 text-[11px] font-semibold capitalize tracking-wide text-slate-400">
              confirmed workforce entries
            </span>
          </div>

          <div className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div>
              <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Programs Tracked
              </span>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-1.5 text-3xl font-black tracking-tight text-slate-900">
                  {programList.length}
                </h3>
              )}
            </div>
            <span className="mt-auto border-t border-slate-100 pt-2 text-[11px] font-semibold capitalize tracking-wide text-slate-400">
              {selectedCollege === ALL_COLLEGES
                ? "with reported outcomes"
                : "in this college"}
            </span>
          </div>

          <div className="flex min-h-[140px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div>
              <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {isProgramScope ? "Peak Placement Year" : "Peak Performance Class"}
              </span>
              {loading ? (
                <Skeleton className="mt-3 h-5 w-3/4" />
              ) : (
                <h3
                  className="mt-2 block text-base font-black tracking-tight text-[#660033]"
                  title={peakClass ? `Class of ${peakClass.year}` : "N/A"}
                >
                  {peakClass
                    ? `Class of ${peakClass.year} (${peakClass.employabilityPercentage}%)`
                    : "None Listed"}
                </h3>
              )}
            </div>
            <span className="mt-auto border-t border-slate-100 pt-2 text-[11px] font-semibold capitalize tracking-wide text-slate-400">
              highest recorded placement cycle
            </span>
          </div>
        </div>

        {/* COLLEGE COMPARISON + DISTRIBUTION */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* College comparison */}
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  College Comparison
                </span>
                <h4 className="mt-0.5 text-base font-bold text-slate-900">
                  Employability by College
                </h4>
                <p className="mt-0.5 text-xs text-slate-400">
                  Click a college bar to drill into its academic programs.
                </p>
              </div>
              {selectedCollege !== ALL_COLLEGES && (
                <button
                  type="button"
                  onClick={() => handleCollegeSelect(ALL_COLLEGES)}
                  className="shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 transition hover:border-[#660033]/40 hover:text-[#660033]"
                >
                  All colleges
                </button>
              )}
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : collegeEmployability.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-400">
                  No college-level data for this scope.
                </p>
              ) : (
                <div
                  className="w-full"
                  style={{
                    height: `${Math.max(260, collegeChartRows.length * 38 + 30)}px`,
                  }}
                >
                  <Chart type="bar" data={collegeChartData} options={collegeChartOptions} />
                </div>
              )}
            </div>
          </div>

          {/* Distribution */}
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Placement Distribution
            </span>
            <h4 className="mt-0.5 text-base font-bold text-slate-900">
              Programs by rate band
            </h4>

            {loading ? (
              <div className="mt-5 space-y-3">
                {BANDS.map((band) => (
                  <Skeleton key={band.label} className="h-6 w-full" />
                ))}
              </div>
            ) : programList.length === 0 ? (
              <p className="mt-6 text-xs text-slate-400">
                No program-level data yet.
              </p>
            ) : (
              <>
                <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  {distribution.map((count, index) =>
                    count > 0 ? (
                      <div
                        key={BANDS[index].label}
                        className="h-full"
                        style={{
                          width: `${(count / programList.length) * 100}%`,
                          backgroundColor: BANDS[index].bar,
                        }}
                        title={`${BANDS[index].label}: ${count}`}
                      />
                    ) : null,
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  {BANDS.map((band, index) => (
                    <div
                      key={band.label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2 font-medium text-slate-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: band.bar }}
                        />
                        {band.label}
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {distribution[index]}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>

        {/* TREND CHART */}
        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Placement Trajectory
              </span>
              <h4 className="mt-0.5 text-base font-bold text-slate-900">
                {isProgramScope
                  ? `${selectedProgram} vs. ${selectedCollege === ALL_COLLEGES ? "Institution" : "College"}`
                  : "Multi-Year Placement & Employment Output"}
              </h4>
              <p className="mt-0.5 text-xs text-slate-400">
                Cohort size and employed alumni (bars) against placement rate
                (line) and the {TARGET_RATE}% target.
              </p>
            </div>
            <div className="relative h-[300px] min-h-[220px] w-full">
              {loading ? (
                <div className="absolute inset-0 flex items-end justify-between gap-4 px-4 pb-4">
                  {["h-[35%]", "h-[60%]", "h-[45%]", "h-[75%]", "h-[55%]"].map(
                    (heightClass) => (
                      <Skeleton key={heightClass} className={`w-full ${heightClass}`} />
                    ),
                  )}
                </div>
              ) : tracerMatrix.length > 0 ? (
                <Chart type="bar" data={chartData} options={chartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No tracer study data available.
                </div>
              )}
            </div>
        </div>

        {/* PROGRAM LEADERBOARD */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5 lg:flex-row lg:items-end">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#660033]">
                Program Breakdown
              </span>
              <h4 className="mt-0.5 text-base font-bold text-slate-900">
                Employability by Academic Program
              </h4>
              <p className="mt-0.5 text-xs text-slate-400">
                Compare individual programs
                {selectedCollege !== ALL_COLLEGES
                  ? ` under ${selectedCollege}`
                  : " across all colleges"}
                — select one to trace its yearly series.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {[
                  { id: "all", label: "All" },
                  { id: "top", label: "Top 10" },
                  { id: "bottom", label: "Lowest 10" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setLeaderboardMode(mode.id)}
                    className={`h-8 cursor-pointer rounded-md px-3 text-[11px] font-bold transition-colors ${
                      leaderboardMode === mode.id
                        ? "bg-white text-[#660033] shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-xs text-slate-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search program or college..."
                  value={programSearch}
                  onChange={(e) => setProgramSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs transition-shadow focus:border-[#660033] focus:outline-none focus:ring-1 focus:ring-[#660033]"
                  aria-label="Search programs"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : leaderboardRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-slate-50/30 py-14 text-slate-400">
              <span className="mb-1 text-2xl">🎓</span>
              <p className="text-xs font-bold text-slate-600">
                No program-level tracer data
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Upload an employability file with per-program totals to populate
                this breakdown.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {leaderboardRows.map((program) => {
                const rate = program.employabilityPercentage || 0;
                const isSelected = program.programName === selectedProgram;
                const color = BANDS[bandIndex(rate)].bar;
                const isTopThree =
                  leaderboardMode !== "bottom" && program.rank <= 3;

                return (
                  <li key={`${program.programName}::${program.campusBranch}`}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedProgram(
                          isSelected ? ALL_PROGRAMS : program.programName,
                        )
                      }
                      className={`grid w-full cursor-pointer grid-cols-[2.5rem_1fr_auto] items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                        isSelected ? "bg-[#D4AF37]/10" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${
                          isTopThree
                            ? "bg-[#660033] text-[#FFD700]"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {program.rank}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-start gap-2">
                          <span
                            className="line-clamp-2 break-words text-sm font-semibold text-slate-800"
                            title={program.programName}
                          >
                            {program.programName}
                          </span>
                          {isSelected && (
                            <span className="mt-0.5 shrink-0 rounded-full bg-[#660033] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span
                            className="text-[11px] text-slate-400"
                            title={program.collegeName || "Unassigned college"}
                          >
                            {program.collegeName || "Unassigned college"}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-slate-400">
                            {program.employedCount.toLocaleString()}/
                            {program.totalGraduates.toLocaleString()} employed
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, rate)}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-black tabular-nums ${rateTone(
                          rate,
                        )}`}
                      >
                        {formatRate(rate)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* CHRONOLOGICAL MATRIX */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                {isProgramScope
                  ? "Program Tracer Study Matrix"
                  : "Chronological Tracer Study Matrix"}
              </h4>
              <p className="text-xs text-slate-400">
                Headcount and employment performance per academic year cycle.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-xs text-slate-400">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search class year..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs transition-shadow focus:border-[#660033] focus:outline-none focus:ring-1 focus:ring-[#660033]"
                aria-label="Search tracer records"
              />
            </div>
          </div>

          <div className="relative max-h-[400px] overflow-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400 shadow-sm">
                <tr>
                  <th className="w-16 px-6 py-3 text-center">Rank</th>
                  <th
                    className="cursor-pointer px-6 py-3 transition-colors hover:bg-slate-100"
                    onClick={() => handleSort("year")}
                  >
                    Graduating Class{" "}
                    {sortConfig.key === "year" &&
                      (sortConfig.direction === "desc" ? "▼" : "▲")}
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-right transition-colors hover:bg-slate-100"
                    onClick={() => handleSort("totalGraduates")}
                  >
                    Total Cohort{" "}
                    {sortConfig.key === "totalGraduates" &&
                      (sortConfig.direction === "desc" ? "▼" : "▲")}
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-right transition-colors hover:bg-slate-100"
                    onClick={() => handleSort("employedCount")}
                  >
                    Employed Alumni{" "}
                    {sortConfig.key === "employedCount" &&
                      (sortConfig.direction === "desc" ? "▼" : "▲")}
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-center transition-colors hover:bg-slate-100"
                    onClick={() => handleSort("employabilityPercentage")}
                  >
                    Placement Rate{" "}
                    {sortConfig.key === "employabilityPercentage" &&
                      (sortConfig.direction === "desc" ? "▼" : "▲")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <Skeleton className="mx-auto h-4 w-8" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="flex justify-end px-6 py-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="flex justify-end px-6 py-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="mx-auto h-4 w-20" />
                      </td>
                    </tr>
                  ))
                ) : processedMatrix.length > 0 ? (
                  processedMatrix.map((row, idx) => {
                    const rate = row.employabilityPercentage || 0;
                    return (
                      <tr
                        key={row.year}
                        className="group transition-colors hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-4 text-center font-mono text-xs font-semibold text-slate-400">
                          #{String(idx + 1).padStart(2, "0")}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500/80 transition-colors group-hover:text-[#660033]">
                          Class of {row.year}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold whitespace-nowrap text-slate-600">
                          {(row.totalGraduates || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold whitespace-nowrap text-[#660033]">
                          {(row.employedCount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${rateTone(
                              rate,
                            )}`}
                          >
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="bg-slate-50/30 px-6 py-12 text-center text-xs text-slate-400"
                    >
                      No records found matching "{matrixSearch}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 p-4 text-[10px] leading-relaxed text-slate-500">
            <span className="mb-0.5 block font-bold uppercase text-slate-700">
              Context Data Frame Note:
            </span>
            Calculated from verified headcount metrics (
            <code>employedCount</code> and <code>totalGraduates</code>) as
            populated by official institutional tracer surveys.
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Office of Alumni Relations & Career Services</span>
          <span className="flex items-center gap-1.5 text-[#D4AF37]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D4AF37]" />
            Live Data Feed Connected
          </span>
        </div>
      </div>
    </div>
  );
}
