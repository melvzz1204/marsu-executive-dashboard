import { useState, useMemo, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar as ChartBar } from "react-chartjs-2";
import api from "../../api/axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// Sentinel values understood by the backend controller (researchController.js).
const ALL_YEARS = "All Years";
const ALL_SCOPES = "All Scopes";
const ALL_CATEGORIES = "All Categories";

const SCOPE_OPTIONS = [
  "International Scope",
  "National Scope",
  "Regional Scope",
];

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
  const [selectedScope, setSelectedScope] = useState(ALL_SCOPES);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Paginated papers (server-side search / filter / pagination) ----
  const [papers, setPapers] = useState([]);
  const [papersMeta, setPapersMeta] = useState({ totalCount: 0, totalPages: 1 });
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
            scope: selectedScope,
            category: selectedCategory,
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
    selectedScope,
    selectedCategory,
    currentPage,
  ]);

  // ---- Derived values from stats ----
  const totalPapers = stats?.totalPapers ?? 0;
  const reach = stats?.projectReach ?? {};
  const avgDuration = reach.avgDurationDays ?? 0;
  const topAuthors = stats?.topAuthors ?? [];
  const categoryStats = useMemo(() => stats?.categoryStats ?? [], [stats]);
  const availableYears = stats?.availableYears ?? [];

  // Bar chart: top 4 categories by paper count.
  const barChartData = useMemo(() => {
    const sorted = [...categoryStats]
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    if (sorted.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            data: [0],
            backgroundColor: "#e2e8f0",
            borderRadius: 4,
            barThickness: 12,
          },
        ],
      };
    }

    return {
      labels: sorted.map((c) => c.name),
      datasets: [
        {
          data: sorted.map((c) => c.count),
          backgroundColor: "#660033",
          hoverBackgroundColor: "#4a0025",
          borderRadius: 4,
          barThickness: 12,
        },
      ],
    };
  }, [categoryStats]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: "#f8fafc" },
        ticks: { color: "#94a3b8", font: { size: 9 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#1e293b", font: { size: 11, weight: "500" } },
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
      <div className="max-w-6xl mx-auto">
        {/* MAIN DASHBOARD HEADER */}
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-6">
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
              {totalPapers > 0 ? "+" : ""}
            </span>
            <span className="text-[11px] font-medium text-slate-200/90 block capitalize tracking-wide mt-1">
              active registry
            </span>
          </div>
        </header>

        {/* THREE COLUMN STATS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-10">
          {/* MODAL GATEWAY BUTTON CARD */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between items-start group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10 group-hover:bg-rose-50/50 transition-colors duration-300" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider  text-slate-400 block mb-2">
                Database Index
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug mb-2">
                Search & Filter Papers
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[220px]">
                Open the database to search, filter by year, and view individual
                project details.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 w-full py-3 px-4 bg-[#660033] hover:bg-[#4a0025] text-white rounded-xl text-xs font-semibold shadow-xs transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.01] cursor-pointer"
            >
              <span>View All Research Papers</span>
              <svg
                className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform"
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
          {/* PROJECT REACH SUMMARY CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-start">
            {/* Predictable spacing under the header */}
            <span className="text-[9px] font-bold uppercase tracking-wider  text-slate-400 block mb-4">
              Project Reach
            </span>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">
                  International Scope
                </span>
                <span className=" font-bold text-[#660033] bg-rose-50 px-2 py-0.5 rounded-sm">
                  {reach.international ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">
                  National Scope
                </span>
                <span className=" font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm">
                  {reach.national ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">
                  Regional Scope
                </span>
                <span className=" font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                  {reach.regional ?? 0}
                </span>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-[10px] text-slate-400 font-medium">
                Average Duration
              </span>
              <span className="text-lg  font-bold text-slate-900">
                {avgDuration}{" "}
                <span className="text-xs font-normal text-slate-400">Days</span>
              </span>
            </div>
          </div>

          {/* TOP RESEARCHERS PANEL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-start">
            <span className="text-[9px] font-bold uppercase tracking-wider  text-slate-400 block mb-4">
              Top Authors
            </span>
            <div className="space-y-2.5">
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
                <p className="text-xs text-slate-400">No authors recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* LOWER BAR CHART COMPONENT */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <h3 className="text-[10px] font-bold  uppercase tracking-widest text-slate-400 mb-6 pb-2 border-b border-slate-100">
            Papers by Category
          </h3>
          <div className="relative h-40 w-full">
            <ChartBar data={barChartData} options={barOptions} />
          </div>
        </section>

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
                      Search by keywords or use the dropdowns to filter the
                      database.
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

                    <select
                      className="bg-white border border-slate-200 text-slate-700 p-1.5 rounded-md cursor-pointer focus:outline-hidden shadow-2xs"
                      value={selectedScope}
                      onChange={(e) => {
                        setSelectedScope(e.target.value);
                        resetPage();
                      }}
                    >
                      <option value={ALL_SCOPES}>All Scopes</option>
                      {SCOPE_OPTIONS.map((scope) => (
                        <option key={scope} value={scope}>
                          {scope}
                        </option>
                      ))}
                    </select>

                    <select
                      className="bg-white border border-slate-200 text-slate-700 p-1.5 rounded-md cursor-pointer focus:outline-hidden shadow-2xs"
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        resetPage();
                      }}
                    >
                      <option value={ALL_CATEGORIES}>All Categories</option>
                      {categoryStats.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
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
                                    ? "text-amber-700"
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
                              className={`ml-auto  text-[9px] uppercase tracking-wider flex items-center gap-1 ${isCompleted ? "text-emerald-600" : "text-blue-500"}`}
                            >
                              <span
                                className={`h-1 w-1 rounded-full ${isCompleted ? "bg-emerald-500" : "bg-blue-400"}`}
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

                          <div className="mt-1 pt-2 border-t border-slate-100 flex flex-wrap gap-x-6 text-[11px] font-medium text-slate-400">
                            <span>
                              <strong className="text-slate-500">
                                Category:
                              </strong>{" "}
                              {item.category}
                            </span>
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
