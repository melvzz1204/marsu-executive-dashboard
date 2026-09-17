import { useState, useMemo, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line as ChartLine } from "react-chartjs-2";
import api from "../../api/axios";
import AnnualTargetTracker from "./AnnualTargetTracker.jsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

// Sentinel value understood by the backend controller (researchController.js).
const ALL_YEARS = "All Years";

const STATUS_LABELS = {
  COMPLETED: "Completed",
  ONGOING: "Ongoing",
  PUBLISHED: "Published",
  UNDER_REVIEW: "Under Review",
};

const PAGE_LIMIT = 4;

// Drop the trailing "Scope" so we can reuse compact International/National/Regional labels.
const baseScope = (scope) => (scope || "").replace(/\s*Scope$/i, "").trim();
// Spreadsheet ingestion can leave the unicode replacement char behind — soften it.
const clean = (str) => (str || "").replace(/\uFFFD/g, "—");

/**
 * Visually hidden table mirroring a chart's data so screen reader users receive
 * the same information as sighted users (canvas elements expose no text).
 */
function ScreenReaderTable({ caption, columns, rows }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} scope="col">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) =>
              cellIndex === 0 ? (
                <th key={cellIndex} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={cellIndex}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ResearchDashboard() {
  // ---- Dashboard stats (cards, project reach, top authors, category chart) ----
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [statsRetryKey, setStatsRetryKey] = useState(0);

  // Fetch stats on mount and on manual retry (same inline-async shape as the
  // Higher Education dashboard so the fetch stays inside the effect body).
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const res = await api.get("/research/stats");
        setStats(res.data.data);
      } catch (err) {
        setStatsError(
          err.response?.data?.message ||
            err.message ||
            "Failed to connect to the server",
        );
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [statsRetryKey]);

  // ---- Modal + filter state ----
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(ALL_YEARS);
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Paginated papers (server-side search / filter / pagination) ----
  const [papers, setPapers] = useState([]);
  const [papersMeta, setPapersMeta] = useState({
    totalCount: 0,
    totalPages: 1,
  });
  const [papersLoading, setPapersLoading] = useState(false);
  const [papersError, setPapersError] = useState(null);

  // Debounce the free-text search before it hits the API.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Reset pagination to the first page whenever a filter changes.
  // Done in the change handlers (not an effect) to avoid cascading renders.
  const resetPage = () => setCurrentPage(1);

  // Fetch papers whenever the modal is open and the query changes.
  useEffect(() => {
    if (!isModalOpen) return undefined;
    let cancelled = false;

    const fetchPapers = async () => {
      try {
        setPapersLoading(true);
        setPapersError(null);
        const res = await api.get("/research/papers", {
          params: {
            search: debouncedSearch || undefined,
            year: selectedYear,
            page: currentPage,
            limit: PAGE_LIMIT,
          },
        });
        if (cancelled) return;
        setPapers(res.data.data || []);
        setPapersMeta({
          totalCount: res.data.totalCount || 0,
          totalPages: res.data.totalPages || 1,
        });
      } catch (err) {
        if (cancelled) return;
        setPapersError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load research papers",
        );
        setPapers([]);
        setPapersMeta({ totalCount: 0, totalPages: 1 });
      } finally {
        if (!cancelled) setPapersLoading(false);
      }
    };

    fetchPapers();
    return () => {
      cancelled = true;
    };
  }, [
    isModalOpen,
    debouncedSearch,
    selectedYear,
    currentPage,
  ]);

  // ---- Derived values from stats ----
  const totalPapers = stats?.totalPapers ?? 0;
  const topAuthors = stats?.topAuthors ?? [];
  const availableYears = stats?.availableYears ?? [];
  const summary = stats?.summaryMetrics ?? {};
  const departmentalBreakdown = useMemo(
    () => stats?.departmentalBreakdown ?? [],
    [stats],
  );
  const papersByYear = useMemo(() => stats?.papersByYear ?? [], [stats]);
  const papersByMonth = useMemo(() => stats?.papersByMonth ?? [], [stats]);
  const papersByMonthByYear = useMemo(
    () => stats?.papersByMonthByYear ?? {},
    [stats],
  );
  const trackerYear = stats?.trackerYear;

  const completedCount = summary.totalCompleted ?? 0;
  const ongoingCount = summary.totalOngoing ?? 0;
  const publishedCount = summary.totalPublished ?? 0;
  const ipCount = summary.totalIPAcquired ?? 0;

  const pctOfTotal = (n) =>
    totalPapers > 0 ? `${Math.round((n / totalPapers) * 100)}%` : "—";

  // Lifecycle funnel: Completed → Published → IP Acquired. Each
  // stage also reports conversion from the previous stage so stalls are obvious.
  const conversion = (current, previous) =>
    previous > 0 ? Math.round((current / previous) * 100) : null;
  const funnelStages = [
    {
      label: "Completed",
      value: completedCount,
      bar: "bg-[#660033]",
      valueColor: "text-[#660033]",
      conversion: null,
    },
    {
      label: "Published",
      value: publishedCount,
      bar: "bg-[#D4AF37]",
      valueColor: "text-[#8a6d1f]",
      conversion: conversion(publishedCount, completedCount),
    },
    {
      label: "IP Acquired",
      value: ipCount,
      bar: "bg-[#4a0025]",
      valueColor: "text-[#4a0025]",
      conversion: conversion(ipCount, publishedCount),
    },
  ];
  const funnelMax = Math.max(1, completedCount, publishedCount, ipCount);

  // Area line: papers per year trend.
  const yearTrendData = useMemo(() => {
    if (papersByYear.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            data: [0],
            borderColor: "#e2e8f0",
            backgroundColor: "#f1f5f9",
            fill: true,
          },
        ],
      };
    }
    return {
      labels: papersByYear.map((r) => String(r.year)),
      datasets: [
        {
          label: "Papers",
          data: papersByYear.map((r) => r.count),
          borderColor: "#D4AF37",
          borderWidth: 3.5,
          backgroundColor: "rgba(212, 175, 55, 0.12)",
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#D4AF37",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
      ],
    };
  }, [papersByYear]);

  const yearTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#1e293b", font: { size: 10, weight: "600" } },
      },
      y: {
        grid: { color: "#f8fafc" },
        ticks: { color: "#94a3b8", font: { size: 9 }, precision: 0 },
      },
    },
  };

  // Loading State UI (initial stats load)
  if (statsLoading && !stats) {
    return (
      <div className="bg-slate-50 min-h-[600px] flex flex-col items-center justify-center p-8 text-slate-800 rounded-2xl animate-pulse">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-[#660033] rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
          Synchronizing Research Data...
        </p>
      </div>
    );
  }

  // Error State UI
  if (statsError && !stats) {
    return (
      <div className="bg-rose-50 min-h-[600px] flex flex-col items-center justify-center p-8 text-rose-800 rounded-2xl border border-rose-200">
        <span className="text-4xl mb-4">⚠️</span>
        <h3 className="text-lg font-bold tracking-tight mb-2">
          Connection Error
        </h3>
        <p className="text-sm text-rose-600/80 mb-6">{statsError}</p>
        <button
          onClick={() => setStatsRetryKey((k) => k + 1)}
          className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 p-6 md:p-10 antialiased selection:bg-rose-100 rounded-2xl ">
      <div className="w-full">
        {/* MAIN DASHBOARD HEADER */}
        <header className="mb-10 border-b border-slate-200/60 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-1.5 w-1.5 bg-[#D4AF37] rounded-full" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ">
                  Institutional Repository
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Research
              </h1>
            </div>

            <div className="relative bg-[#660033] text-white px-6 py-4 rounded-xl shadow-[0_4px_0_0_#D4AF37] text-center min-w-[160px]">
              <span className="text-[10px] font-extrabold tracking-wider text-slate-300 block uppercase mb-1">
                Total Papers
              </span>
              <span className="text-3xl font-black text-[#FFD700] leading-none block mt-1 tracking-tight">
                {totalPapers}
              </span>
              <span className="text-[11px] font-medium text-slate-200/90 block capitalize tracking-wide mt-1">
                active registry
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-start">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 bg-[#660033] hover:bg-[#4a0025] text-white rounded-xl text-xs font-bold shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View All Research Papers</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* ANNUAL TARGET TRACKER */}
        <div className="mb-10">
          <AnnualTargetTracker
            papersByMonth={papersByMonth}
            papersByMonthByYear={papersByMonthByYear}
            availableYears={availableYears}
            year={trackerYear}
          />
        </div>

        {/* PIPELINE + AUTHORS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-10">
          {/* LIFECYCLE FUNNEL CARD — where research advances or stalls */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-start">
            <span className="text-[9px] font-bold uppercase tracking-wider  text-slate-400 block mb-1">
              Research Pipeline
            </span>
            <p className="text-[11px] text-slate-400 font-medium mb-5">
              Share of registry reaching each stage
            </p>
            <div className="space-y-4 flex-1">
              {funnelStages.map((stage) => {
                const widthPct = Math.max(
                  stage.value > 0 ? 8 : 0,
                  Math.round((stage.value / funnelMax) * 100),
                );
                return (
                  <div key={stage.label}>
                    <div className="flex items-baseline justify-between text-xs mb-1.5">
                      <span className="text-slate-700 font-semibold flex items-center gap-2">
                        {stage.label}
                        {stage.conversion !== null && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              stage.conversion >= 60
                                ? "bg-[#660033]/10 text-[#660033]"
                                : stage.conversion >= 30
                                  ? "bg-[#D4AF37]/25 text-[#8a6d1f]"
                                  : "bg-slate-200/70 text-slate-500"
                            }`}
                            title={`${stage.conversion}% of the previous stage advanced here`}
                          >
                            {stage.conversion}% → prev
                          </span>
                        )}
                      </span>
                      <span className={`font-bold ${stage.valueColor}`}>
                        {stage.value}{" "}
                        <span className="font-medium text-slate-400">
                          ({pctOfTotal(stage.value)})
                        </span>
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stage.bar} transition-all duration-500`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-[10px] text-slate-400 font-medium">
                Ongoing Studies
              </span>
              <span className="text-lg font-bold text-[#660033]">
                {ongoingCount}
              </span>
            </div>
          </div>

          {/* TOP AUTHORS PANEL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-start">
            <span className="text-[9px] font-bold uppercase tracking-wider  text-slate-400 block mb-1">
              Top Authors
            </span>
            <p className="text-[11px] text-slate-400 font-medium mb-4">
              Top 5 authors by paper count
            </p>
            <div className="space-y-3.5">
              {topAuthors.length > 0 ? (
                topAuthors.slice(0, 5).map((author, idx) => (
                  <div
                    key={author.name || idx}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-4 h-4 bg-slate-50 border border-slate-100 text-[9px]  font-bold rounded-sm flex items-center justify-center text-slate-400">
                        {author.rank ?? idx + 1}
                      </span>
                      <span className="text-slate-700 font-semibold truncate">
                        {clean(author.name)}
                      </span>
                    </div>
                    <span className="text-[10px]  font-medium text-slate-400">
                      {author.papers} papers
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  No authors recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* COLLEGE OUTPUT + YEAR TREND ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <section className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-start">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Papers by College
            </span>
            <p className="text-[11px] text-slate-400 font-medium mb-4">
              Paper count per college unit
            </p>
            <div className="space-y-3.5 flex-1">
              {departmentalBreakdown.length > 0 ? (
                departmentalBreakdown.slice(0, 8).map((row, idx) => {
                  const leaderPapers =
                    departmentalBreakdown[0]?.papersPublished || 1;
                  const barPct = Math.max(
                    6,
                    Math.round(
                      ((row.papersPublished || 0) / leaderPapers) * 100,
                    ),
                  );
                  return (
                    <div key={row.collegeCode || idx}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-4 h-4 bg-slate-50 border border-slate-100 text-[9px] font-bold rounded-sm flex items-center justify-center text-slate-400">
                            {idx + 1}
                          </span>
                          <span className="text-slate-700 font-semibold truncate">
                            {row.collegeCode || "UNASSIGNED"}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">
                          {row.papersPublished ?? 0} papers
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden ml-6">
                        <div
                          className="h-full rounded-full bg-[#660033] transition-all duration-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">
                  No college records yet.
                </p>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 pb-2 border-b border-slate-100">
              Papers per Year
            </h3>
            <div
              className="relative h-56 w-full"
              role="img"
              aria-label="Area line chart of total research papers published per year"
            >
              <ChartLine data={yearTrendData} options={yearTrendOptions} />
            </div>
            <ScreenReaderTable
              caption="Papers per year"
              columns={["Year", "Papers"]}
              rows={papersByYear.map((row) => [row.year, row.count])}
            />
          </section>
        </div>

        {/* ======================================================= */}
        {/*           POP-UP MODAL ENGINE SEARCH LIGHTBOX            */}
        {/* ======================================================= */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.12)] max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
              {/* MODAL CONTROLS & HEADER */}
              <div className="p-6 border-b border-slate-100 bg-[#fafafa]/50 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      All Research Papers
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Search by keywords or filter by year.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-500 transition-colors flex items-center justify-center cursor-pointer text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* FILTERS AND SEARCH COMPONENT INSIDE MODAL */}
                <div className="flex flex-col lg:flex-row gap-3 items-center justify-between pt-1">
                  <div className="relative w-full lg:w-[320px]">
                    <span className="absolute left-3 top-[11px]">
                      <svg
                        className="w-3.5 h-3.5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search titles or authors..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 transition-all shadow-2xs"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        resetPage();
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end text-[11px] font-semibold">
                    <div className="flex bg-slate-200/60 p-0.5 rounded-md border border-slate-200/30">
                      <button
                        onClick={() => {
                          setSelectedYear(ALL_YEARS);
                          resetPage();
                        }}
                        className={`px-2.5 py-1 rounded-sm transition-all ${selectedYear === ALL_YEARS ? "bg-[#660033] text-white shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"}`}
                      >
                        All Years
                      </button>
                      {availableYears.map((yr) => {
                        const yrStr = String(yr);
                        return (
                          <button
                            key={yrStr}
                            onClick={() => {
                              setSelectedYear(yrStr);
                              resetPage();
                            }}
                            className={`px-2.5 py-1 rounded-sm transition-all ${selectedYear === yrStr ? "bg-[#660033] text-white shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            {yrStr}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL LIST OF CARDS */}
              <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50 flex-1 min-h-[300px]">
                {papersLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-xs text-slate-400">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-[#660033] rounded-full animate-spin mb-3"></div>
                    <p>Loading research papers...</p>
                  </div>
                ) : papersError ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-xs text-rose-500">
                    <span className="text-2xl mb-2">⚠️</span>
                    <p>{papersError}</p>
                  </div>
                ) : papers.length > 0 ? (
                  papers.map((item) => {
                    const scope = baseScope(item.scope);
                    const isInternational = scope === "International";
                    const isNational = scope === "National";
                    const isCompleted =
                      item.isCompleted || item.status === "COMPLETED";
                    const statusLabel =
                      STATUS_LABELS[item.status] || item.status || "Ongoing";
                    return (
                      <article
                        key={item._id}
                        className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-2xs relative overflow-hidden group transition-all duration-150 hover:border-slate-300"
                      >
                        <div
                          className={`absolute top-0 left-0 bottom-0 w-1 ${isInternational ? "bg-[#660033]" : isNational ? "bg-[#D4AF37]" : "bg-slate-300"}`}
                        />
                        <div className="flex flex-col gap-2 pl-2">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400">
                            <span className="text-slate-800 ">
                              Year {item.year || "—"}
                            </span>
                            <span className="h-0.5 w-0.5 bg-slate-300 rounded-full" />
                            <span
                              className={
                                isInternational
                                  ? "text-[#660033]"
                                  : isNational
                                    ? "text-[#8a6d1f]"
                                    : "text-slate-500"
                              }
                            >
                              {scope || "Regional"} Scope
                            </span>
                            <span className="h-0.5 w-0.5 bg-slate-300 rounded-full" />
                            <span
                              className="text-slate-500 font-medium truncate max-w-[280px]"
                              title={clean(item.conferenceOrJournal)}
                            >
                              {clean(item.conferenceOrJournal)}
                            </span>

                            <span
                              className={`ml-auto  text-[9px] uppercase tracking-wider flex items-center gap-1 ${isCompleted ? "text-[#660033]" : "text-[#8a6d1f]"}`}
                            >
                              <span
                                className={`h-1 w-1 rounded-full ${isCompleted ? "bg-[#660033]" : "bg-[#D4AF37]"}`}
                              />
                              {statusLabel}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug group-hover:text-[#660033] transition-colors">
                            {clean(item.title)}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-1">
                            <span className="text-slate-300  text-[9px] mr-1 uppercase font-bold">
                              Authors
                            </span>
                            <span className="text-slate-700 font-semibold">
                              {(item.authors || []).map(clean).join(", ")}
                            </span>
                          </p>

                          <div className="mt-1 pt-2 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-1 text-[11px] font-medium text-slate-400">
                            <span>
                              <strong className="text-slate-500">
                                Category:
                              </strong>{" "}
                              {item.category}
                            </span>
                            {item.collegeCode && (
                              <span>
                                <strong className="text-slate-500">
                                  College:
                                </strong>{" "}
                                {item.collegeCode}
                                {item.academicProgram &&
                                  item.academicProgram !== "N/A" &&
                                  ` • ${clean(item.academicProgram)}`}
                              </span>
                            )}
                            {item.publicationStatus &&
                              item.publicationStatus !== "N/A" && (
                                <span>
                                  <strong className="text-slate-500">
                                    Publication:
                                  </strong>{" "}
                                  {clean(item.publicationStatus)}
                                  {item.conferenceOrJournal &&
                                    item.conferenceOrJournal !== "N/A" &&
                                    ` • ${clean(item.conferenceOrJournal)}`}
                                </span>
                              )}
                            {item.completionStatus &&
                              item.completionStatus !== "N/A" && (
                                <span>
                                  <strong className="text-slate-500">
                                    Completion:
                                  </strong>{" "}
                                  {clean(item.completionStatus)}
                                </span>
                              )}
                            {item.intellectualPropertyTypeAcquired &&
                              !["None", "N/A", ""].includes(
                                item.intellectualPropertyTypeAcquired,
                              ) && (
                                <span>
                                  <strong className="text-slate-500">
                                    IP:
                                  </strong>{" "}
                                  {clean(item.intellectualPropertyTypeAcquired)}
                                </span>
                              )}
                            {item.venue && item.venue !== "N/A" && (
                              <span>
                                <strong className="text-slate-500">
                                  Venue:
                                </strong>{" "}
                                {clean(item.venue)}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12  text-xs text-slate-400">
                    <p>No results match your search parameters.</p>
                  </div>
                )}
              </div>

              {/* MODAL PAGINATION FOOTER */}
              {papersMeta.totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs  text-slate-400 shrink-0 px-6">
                  <span>
                    Showing page {currentPage} of {papersMeta.totalPages} (
                    {papersMeta.totalCount} papers found)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1 || papersLoading}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-md disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      disabled={
                        currentPage >= papersMeta.totalPages || papersLoading
                      }
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(papersMeta.totalPages, p + 1),
                        )
                      }
                      className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-md disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
