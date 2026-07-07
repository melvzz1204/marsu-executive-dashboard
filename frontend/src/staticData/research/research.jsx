import React, { useState, useMemo, useEffect } from "react";
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
import { research_data } from "./research.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function ResearchDashboard() {
  // Data Normalization Core
  const { fullDataset, baseSummary } = useMemo(() => {
    let list = [];
    let sum = null;
    if (research_data) {
      if (Array.isArray(research_data)) {
        list = research_data;
      } else if (Array.isArray(research_data.research_data)) {
        list = research_data.research_data;
        sum = research_data.summary;
      } else if (Array.isArray(research_data.data)) {
        list = research_data.data;
        sum = research_data.summary;
      }
    }
    return { fullDataset: list, baseSummary: sum };
  }, []);

  // UI Modal Toggle State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedForumType, setSelectedForumType] = useState("All");
  const [selectedResearchType, setSelectedResearchType] = useState("All");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedYear, selectedForumType, selectedResearchType]);

  // Filter Pipeline Logic
  const filteredData = useMemo(() => {
    return fullDataset.filter((item) => {
      if (!item) return false;

      const titleStr = item.title?.toLowerCase() || "";
      const forumStr = item.forum?.toLowerCase() || "";
      const researchersArr = Array.isArray(item.researchers)
        ? item.researchers
        : [];

      const matchesSearch =
        titleStr.includes(searchTerm.toLowerCase()) ||
        forumStr.includes(searchTerm.toLowerCase()) ||
        researchersArr.some((r) =>
          r.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesYear =
        selectedYear === "All" || item.year?.toString() === selectedYear;
      const matchesForum =
        selectedForumType === "All" || item.forum_type === selectedForumType;
      const matchesType =
        selectedResearchType === "All" ||
        item.research_type === selectedResearchType;

      return matchesSearch && matchesYear && matchesForum && matchesType;
    });
  }, [
    searchTerm,
    selectedYear,
    selectedForumType,
    selectedResearchType,
    fullDataset,
  ]);

  // Pagination Computations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // General Dashboard Metrics
  const analytics = useMemo(() => {
    const forums = { Regional: 0, International: 0, National: 0 };
    const types = {};
    const years = new Set();
    let totalDuration = 0;
    let itemsWithDuration = 0;

    fullDataset.forEach((item) => {
      if (item.year) years.add(item.year.toString());
      if (forums[item.forum_type] !== undefined) forums[item.forum_type]++;
      if (item.research_type)
        types[item.research_type] = (types[item.research_type] || 0) + 1;
      if (item.duration_days && item.duration_days > 0) {
        totalDuration += item.duration_days;
        itemsWithDuration++;
      }
    });

    return {
      forums,
      types,
      yearOptions: Array.from(years).sort((a, b) => b - a),
      avgDuration:
        itemsWithDuration > 0
          ? Math.round(totalDuration / itemsWithDuration)
          : 0,
    };
  }, [fullDataset]);

  // Top Researchers List Logic
  const topResearchersList = useMemo(() => {
    if (baseSummary?.top_researchers)
      return Object.entries(baseSummary.top_researchers).slice(0, 5);
    const counts = {};
    fullDataset.forEach((item) => {
      (item.researchers || []).forEach((r) => {
        counts[r] = (counts[r] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [baseSummary, fullDataset]);

  // Bar Chart Configuration
  const barChartData = useMemo(() => {
    const sortedTypes = Object.entries(analytics.types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    return {
      labels: sortedTypes.map(([name]) => name),
      datasets: [
        {
          data: sortedTypes.map(([, val]) => val),
          backgroundColor: "#660033",
          hoverBackgroundColor: "#4a0025",
          borderRadius: 4,
          barThickness: 12,
        },
      ],
    };
  }, [analytics]);

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
              {baseSummary?.total_research || fullDataset.length}+
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
                  {analytics.forums.International}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">
                  National Scope
                </span>
                <span className=" font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm">
                  {analytics.forums.National}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">
                  Regional Scope
                </span>
                <span className=" font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                  {analytics.forums.Regional}
                </span>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-[10px] text-slate-400 font-medium">
                Average Duration
              </span>
              <span className="text-lg  font-bold text-slate-900">
                {analytics.avgDuration}{" "}
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
              {topResearchersList.slice(0, 5).map(([name, count], idx) => (
                <div
                  key={name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-4 h-4 bg-slate-50 border border-slate-100 text-[9px]  font-bold rounded-sm flex items-center justify-center text-slate-400">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 font-semibold truncate">
                      {name}
                    </span>
                  </div>
                  <span className="text-[10px]  font-medium text-slate-400">
                    {count} papers
                  </span>
                </div>
              ))}
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
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end text-[11px] font-semibold">
                    <div className="flex bg-slate-200/60 p-0.5 rounded-md border border-slate-200/30">
                      <button
                        onClick={() => setSelectedYear("All")}
                        className={`px-2.5 py-1 rounded-sm transition-all ${selectedYear === "All" ? "bg-[#660033] text-white shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"}`}
                      >
                        All Years
                      </button>
                      {analytics.yearOptions.map((yr) => (
                        <button
                          key={yr}
                          onClick={() => setSelectedYear(yr)}
                          className={`px-2.5 py-1 rounded-sm transition-all ${selectedYear === yr ? "bg-[#660033] text-white shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"}`}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>

                    <select
                      className="bg-white border border-slate-200 text-slate-700 p-1.5 rounded-md cursor-pointer focus:outline-hidden shadow-2xs"
                      value={selectedForumType}
                      onChange={(e) => setSelectedForumType(e.target.value)}
                    >
                      <option value="All">All Scopes</option>
                      <option value="Regional">Regional Scope</option>
                      <option value="International">International Scope</option>
                      <option value="National">National Scope</option>
                    </select>

                    <select
                      className="bg-white border border-slate-200 text-slate-700 p-1.5 rounded-md cursor-pointer focus:outline-hidden shadow-2xs"
                      value={selectedResearchType}
                      onChange={(e) => setSelectedResearchType(e.target.value)}
                    >
                      <option value="All">All Categories</option>
                      {Object.keys(analytics.types).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* MODAL LIST OF CARDS */}
              <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50 flex-1 min-h-[300px]">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => {
                    const isInternational = item.forum_type === "International";
                    const isNational = item.forum_type === "National";
                    return (
                      <article
                        key={index}
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
                              {item.forum_type} Scope
                            </span>
                            <span className="h-0.5 w-0.5 bg-slate-300 rounded-full" />
                            <span
                              className="text-slate-500 font-medium truncate max-w-[280px]"
                              title={item.forum}
                            >
                              {item.forum?.replace(/\?/g, "—")}
                            </span>

                            <span
                              className={`ml-auto  text-[9px] uppercase tracking-wider flex items-center gap-1 ${item.status?.trim() === "Completed" ? "text-emerald-600" : "text-blue-500"}`}
                            >
                              <span
                                className={`h-1 w-1 rounded-full ${item.status?.trim() === "Completed" ? "bg-emerald-500" : "bg-blue-400"}`}
                              />
                              {item.status || "Ongoing"}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug group-hover:text-[#660033] transition-colors">
                            {item.title?.replace(/\?/g, "—")}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-1">
                            <span className="text-slate-300  text-[9px] mr-1 uppercase font-bold">
                              Authors
                            </span>
                            <span className="text-slate-700 font-semibold">
                              {(item.researchers || []).join(", ")}
                            </span>
                          </p>

                          <div className="mt-1 pt-2 border-t border-slate-100 flex flex-wrap gap-x-6 text-[11px] font-medium text-slate-400">
                            <span>
                              <strong className="text-slate-500">
                                Category:
                              </strong>{" "}
                              {item.research_type}
                            </span>
                            {item.venue && (
                              <span>
                                <strong className="text-slate-500">
                                  Venue:
                                </strong>{" "}
                                {item.venue}
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
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs  text-slate-400 shrink-0 px-6">
                  <span>
                    Showing page {currentPage} of {totalPages} (
                    {filteredData.length} papers found)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-md disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
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
