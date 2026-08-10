import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart, Doughnut } from "react-chartjs-2";
import { API_BASE_URL } from "../../../../api/axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const PALETTE = {
  maroon: "#660033",
  gold: "#D4AF37",
  slateDark: "#0f172a",
  slateMuted: "#64748b",
  bgSlate: "#f8fafc",
  categories: {
    Engineering: "#660033",
    Business: "#1e293b",
    Technology: "#334155",
    Sciences: "#475569",
    Education: "#64748b",
    Agriculture: "#8492a6",
    Other: "#94a3b8",
    Aggregated: "#cbd5e1",
  },
};

const formatAYLabel = (startYear) => {
  if (!startYear) return "";
  const numericYear = Number(startYear);
  return !isNaN(numericYear)
    ? `AY ${numericYear}–${numericYear + 1}`
    : startYear;
};

// Skeleton Loader Component
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200/60 rounded ${className}`}></div>
);

export default function EnrollmentDashboard({ isPublicView = false }) {
  // GLOBAL FILTERS (These control the entire dashboard)
  const [availableYears, setAvailableYears] = useState([]);
  const [availableCampuses, setAvailableCampuses] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("1st Semester");

  // DEEP DIVE STATE (Program only. Semester is now handled by global selectedSemester)
  const [selectedDetailEntity, setSelectedDetailEntity] = useState("");

  // Table Sort & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "enrollment",
    direction: "desc",
  });

  const [currentData, setCurrentData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [programTrendData, setProgramTrendData] = useState([]);
  const [isProgramTrendLoading, setIsProgramTrendLoading] = useState(false);

  const API_BASE = `${API_BASE_URL}/enrollment`;

  // NEW FETCH LOGIC FOR PROGRAM TRAJECTORY
  useEffect(() => {
    if (!selectedDetailEntity || !selectedCampus || !selectedSemester) {
      setProgramTrendData([]);
      return;
    }

    const fetchProgramTrend = async () => {
      setIsProgramTrendLoading(true);
      try {
        const token = localStorage.getItem("token");
        const queryParams = new URLSearchParams({
          programName: selectedDetailEntity,
          campus: selectedCampus === "All" ? "" : selectedCampus,
          semester: selectedSemester,
        });

        const response = await fetch(
          `${API_BASE}/program-trend?${queryParams}`,
          {
            headers: { Authorization: `Bearer ${token || ""}` },
          },
        );

        const json = await response.json();

        if (json.success) {
          setProgramTrendData(json.data || []);
        } else {
          setProgramTrendData([]);
        }
      } catch (err) {
        console.error("Failed to fetch program trajectory:", err);
        setProgramTrendData([]);
      } finally {
        setIsProgramTrendLoading(false);
      }
    };

    fetchProgramTrend();
  }, [selectedDetailEntity, selectedCampus, selectedSemester]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/filters`, {
          headers: { Authorization: `Bearer ${token || ""}` },
        });

        const json = await response.json();

        if (json.success && json.data) {
          const { years, campuses, semesters } = json.data;
          const sortedYears = (years || []).sort((a, b) => b - a);

          setAvailableYears(sortedYears);
          setAvailableCampuses(campuses || []);
          setAvailableSemesters(semesters || ["1st Semester", "2nd Semester"]);

          if (sortedYears.length > 0) setSelectedYear(sortedYears[0]);
          if (campuses && campuses.length > 0) setSelectedCampus(campuses[0]);
          if (semesters && semesters.length > 0) {
            setSelectedSemester(semesters[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch enrollment filters:", err);
      }
    };

    fetchFilters();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!selectedYear || !selectedCampus) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token || ""}` };

      const snapshotUrl = `${API_BASE}?year=${selectedYear}&campus=${encodeURIComponent(
        selectedCampus,
      )}&semester=${encodeURIComponent(selectedSemester)}`;
      const snapshotRes = await fetch(snapshotUrl, { headers });
      const snapshotJson = await snapshotRes.json();

      if (!snapshotRes.ok || !snapshotJson.success) {
        throw new Error(snapshotJson.error || "Failed to load snapshot.");
      }

      setCurrentData(snapshotJson.data);

      const trendUrl = `${API_BASE}/trend?campus=${encodeURIComponent(
        selectedCampus,
      )}&semester=${encodeURIComponent(selectedSemester)}`;
      const trendRes = await fetch(trendUrl, { headers });
      const trendJson = await trendRes.json();

      if (trendRes.ok && trendJson.success) {
        setTrendData(trendJson.data || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard payload:", err);
      setError(err.message);
      setCurrentData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedCampus, selectedSemester]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // CASCADING DROPDOWN LOGIC: Extract programs dynamically based on the selected campus's currentData
  const availableProgramsForCampus = useMemo(() => {
    if (!currentData || !Array.isArray(currentData.programs)) return [];
    // Extract unique program names and sort them alphabetically
    const uniquePrograms = [
      ...new Set(currentData.programs.map((p) => p.name)),
    ].sort();
    return uniquePrograms;
  }, [currentData]);

  // Auto-select the first program when the available programs list changes (e.g., when switching campuses)
  useEffect(() => {
    if (availableProgramsForCampus.length > 0) {
      if (!availableProgramsForCampus.includes(selectedDetailEntity)) {
        setSelectedDetailEntity(availableProgramsForCampus[0]);
      }
    } else {
      setSelectedDetailEntity("");
    }
  }, [availableProgramsForCampus, selectedDetailEntity]);

  // SMART TABLE LOGIC: Filter and Sort
  const processedPrograms = useMemo(() => {
    if (!currentData || !Array.isArray(currentData.programs)) return [];

    let filtered = currentData.programs.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category &&
          p.category.toLowerCase().includes(searchQuery.toLowerCase())),
    );

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [currentData, searchQuery, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const macroTrendData = useMemo(() => {
    return {
      labels: trendData.map((t) => formatAYLabel(t.academicYear)),
      datasets: [
        {
          type: "line",
          label: "Total Enrollment",
          data: trendData.map((t) => t.totalStudents || 0),
          borderColor: PALETTE.gold,
          borderWidth: 3.5,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: PALETTE.gold,
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          fill: true,
          backgroundColor: "rgba(212, 175, 55, 0.08)",
          tension: 0.3,
        },
      ],
    };
  }, [trendData]);

  const compositionData = useMemo(() => {
    if (!currentData || !Array.isArray(currentData.programs)) return null;

    const categoryCounts = {};
    currentData.programs.forEach((p) => {
      const cat = p.category || "Other";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + (p.enrollment || 0);
    });

    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    const bgColors = labels.map(
      (label) => PALETTE.categories[label] || PALETTE.categories.Other,
    );

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverOffset: 4,
        },
      ],
    };
  }, [currentData]);

  const detailTrajectoryData = useMemo(() => {
    // Return empty configuration if loading or no data
    if (isProgramTrendLoading || programTrendData.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Map real API data to chart axes
    const labels = programTrendData.map(
      (t) => t.label || `AY ${t.academicYear}`,
    );
    const data = programTrendData.map((t) => t.enrolledStudents || 0);

    return {
      labels,
      datasets: [
        {
          type: "line",
          label: `${selectedDetailEntity || "Select a Program"} (${selectedSemester})`,
          data: data,
          borderColor: PALETTE.maroon,
          borderWidth: 3.5,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: PALETTE.maroon,
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          fill: true,
          backgroundColor: "rgba(102, 0, 51, 0.08)",
          tension: 0.35, // Keeps your nice curve
        },
      ],
    };
  }, [
    programTrendData,
    selectedDetailEntity,
    selectedSemester,
    isProgramTrendLoading,
  ]);
  const renderYoYBadge = (growthVal, hasBaseline) => {
    if (!hasBaseline || growthVal === null || growthVal === undefined) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full bg-[#D4AF37] text-[#660033] border border-amber-200 shadow-sm">
          ✦ Baseline Year
        </span>
      );
    }

    if (growthVal > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-sm backdrop-blur-md">
          ▲ +{growthVal}% YoY
        </span>
      );
    }

    if (growthVal < 0) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-400/50 shadow-sm backdrop-blur-md">
          ▼ {growthVal}% YoY
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full bg-[#D4AF37] text-[#660033] border border-amber-300 shadow-sm">
        ▲ 0.0% YoY Growth
      </span>
    );
  };

  if (!loading && availableYears.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
        <div className="text-4xl">📊</div>
        <h3 className="text-lg font-bold text-slate-800 uppercase">
          No Enrollment Datasets Ingested
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          No enrollment records were found in the database. Please visit the
          Admin Panel to upload official Excel files.
        </p>
      </div>
    );
  }

  const kpis = currentData?.summaryKpis || {};

  return (
    <div className="min-h-screen bg-white text-slate-800 antialiased rounded-2xl font-sans">
      <div className="max-w-7xl mx-auto space-y-6 p-10">
        {/* HEADER CONTROL LAYER (Global Controls) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#660033]">
              Institutional Registrar Dashboard
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Campus Enrollment Trends
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {availableYears.length > 0 && (
              <div className="relative">
                <select
                  aria-label="Select Academic Year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold px-3.5 py-2 pr-8 rounded-xl border-none focus:outline-none appearance-none cursor-pointer transition-all"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {formatAYLabel(year)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            )}

            <div
              className="bg-slate-100 p-1 rounded-xl flex gap-1 overflow-x-auto max-w-xs scrollbar-none"
              role="group"
              aria-label="Campus Selection"
            >
              {availableCampuses.map((campus) => (
                <button
                  key={campus}
                  aria-pressed={selectedCampus === campus}
                  onClick={() => setSelectedCampus(campus)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCampus === campus
                      ? "bg-[#660033] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {campus}
                </button>
              ))}
            </div>

            {availableSemesters.length > 0 && (
              <div className="relative">
                <select
                  aria-label="Select Global Semester"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold px-3.5 py-2 pr-8 rounded-xl border-none focus:outline-none appearance-none cursor-pointer transition-all"
                >
                  {availableSemesters.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div
            className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex justify-between items-center"
            role="alert"
          >
            <span>⚠️ {error}</span>
            <button
              onClick={fetchDashboardData}
              className="font-bold underline hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="relative bg-[#660033] text-white p-6 rounded-2xl shadow-[0_4px_0_0_#D4AF37] flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-300 block uppercase font-sans mb-1">
                Campus Enrollment
              </span>
              {loading ? (
                <Skeleton className="h-8 w-24 mt-2 mb-2 bg-white/20" />
              ) : (
                <span className="text-3xl font-black text-[#FFD700] leading-none block mt-1 tracking-tight my-1">
                  {(kpis.totalStudents || 0).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/10">
              <span className="text-[11px] font-medium text-slate-200/90 font-sans lowercase tracking-wide">
                total students on campus
              </span>
              {!loading &&
                renderYoYBadge(kpis.yoYGrowthPercentage, kpis.hasYoYBaseline)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Active Programs
              </span>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <h3 className="text-3xl font-black text-slate-900 font-sans tracking-tight mt-1.5">
                  {kpis.activeProgramsCount || 0}
                </h3>
              )}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 capitalize tracking-wide mt-auto pt-2 border-t border-slate-100">
              degree offerings at {selectedCampus} campus
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[140px] min-w-0">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Largest Program
              </span>
              {loading ? (
                <Skeleton className="h-5 w-3/4 mt-3" />
              ) : (
                <h3
                  className="text-base font-black text-[#660033] mt-2 block truncate font-sans tracking-tight"
                  title={kpis.largestProgramName}
                >
                  {kpis.largestProgramName || "None Listed"}
                </h3>
              )}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 capitalize tracking-wide mt-auto pt-2 border-t border-slate-100">
              highest student headcount
            </span>
          </div>
        </div>

        {/* VISUALIZATION ROW: MACRO TREND & COMPOSITION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900">
                Multi-Year Total Enrollment Growth
              </h4>
              <p className="text-xs text-slate-400">
                Macro university registration trajectory for {selectedCampus}{" "}
                Campus ({selectedSemester})
              </p>
            </div>
            <div className="h-[240px] relative w-full flex-1">
              {loading ? (
                <div className="absolute inset-0 flex items-end justify-between px-4 pb-4 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="w-full"
                      style={{ height: `${Math.random() * 60 + 20}%` }}
                    />
                  ))}
                </div>
              ) : trendData.length > 0 ? (
                <Chart
                  type="line"
                  data={macroTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: {
                          color: PALETTE.slateMuted,
                          font: { size: 11 },
                        },
                      },
                      y: {
                        grid: { color: "#f1f5f9" },
                        ticks: {
                          color: PALETTE.slateMuted,
                          font: { size: 11 },
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No trend data available.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900">
                College Distribution
              </h4>
              <p className="text-xs text-slate-400">
                Student breakdown for {formatAYLabel(selectedYear)}
              </p>
            </div>
            <div className="h-[240px] relative w-full flex-1 flex items-center justify-center">
              {loading ? (
                <Skeleton className="h-48 w-48 rounded-full" />
              ) : compositionData ? (
                <Doughnut
                  data={compositionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { boxWidth: 10, font: { size: 10 } },
                      },
                      tooltip: {
                        callbacks: {
                          label: (c) =>
                            ` ${c.label}: ${c.raw.toLocaleString()} students`,
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-xs text-slate-400">
                  No program data available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MICRO / DRILL-DOWN TRAJECTORY CHART */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Program Trajectory
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Isolate and analyze multi-year growth for a specific degree
                track at {selectedCampus}.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Dynamically populated Program Dropdown based on Global Campus */}
                <select
                  aria-label="Select Specific Program"
                  value={selectedDetailEntity}
                  onChange={(e) => setSelectedDetailEntity(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-[#660033] appearance-none cursor-pointer w-72 truncate"
                >
                  {availableProgramsForCampus.length > 0 ? (
                    availableProgramsForCampus.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No programs available
                    </option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>
          </div>

          <div className="h-[200px] relative">
            {isProgramTrendLoading ? (
              <div className="absolute inset-0 flex items-end justify-between px-4 pb-4 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className="w-full"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                ))}
              </div>
            ) : detailTrajectoryData?.datasets?.length > 0 ? (
              <Chart
                type="line"
                data={detailTrajectoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: PALETTE.slateDark,
                      padding: 12,
                      cornerRadius: 8,
                      titleFont: { size: 12, weight: "bold" },
                      bodyFont: { size: 12 },
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: PALETTE.slateMuted, font: { size: 11 } },
                    },
                    y: {
                      grid: { color: "#f1f5f9" },
                      ticks: { color: PALETTE.slateMuted, font: { size: 11 } },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No trajectory data available for this program.
              </div>
            )}
          </div>
        </div>

        {/* ENHANCED SMART PROGRAM MATRIX TABLE */}
        {!isPublicView && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Complete Program Directory
                </h4>
                <p className="text-xs text-slate-400">
                  Detailed headcount reference for {formatAYLabel(selectedYear)}
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search programs or colleges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#660033] focus:ring-1 focus:ring-[#660033] transition-shadow"
                  aria-label="Search programs"
                />
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto relative">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 sticky top-0 text-slate-400 font-semibold text-[11px] uppercase tracking-wider z-10 shadow-sm">
                  <tr>
                    <th
                      className="px-6 py-3 w-16 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("enrollment")}
                    >
                      Rank{" "}
                      {sortConfig.key === "enrollment" &&
                        (sortConfig.direction === "desc" ? "▼" : "▲")}
                    </th>
                    <th
                      className="px-6 py-3 min-w-[240px] cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      Program Title{" "}
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "desc" ? "▼" : "▲")}
                    </th>
                    <th
                      className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("category")}
                    >
                      College{" "}
                      {sortConfig.key === "category" &&
                        (sortConfig.direction === "desc" ? "▼" : "▲")}
                    </th>
                    <th
                      className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("enrollment")}
                    >
                      Students{" "}
                      {sortConfig.key === "enrollment" &&
                        (sortConfig.direction === "desc" ? "▼" : "▲")}
                    </th>
                    <th
                      className="px-6 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("isPriority")}
                    >
                      CHED Priority{" "}
                      {sortConfig.key === "isPriority" &&
                        (sortConfig.direction === "desc" ? "▼" : "▲")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-8 mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-48" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-6 py-4 flex justify-end">
                          <Skeleton className="h-4 w-12" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton className="h-4 w-16 mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : processedPrograms.length > 0 ? (
                    processedPrograms.map((program, idx) => {
                      const isPriority = Boolean(
                        program.isPriority ?? program.is_priority,
                      );
                      return (
                        <tr
                          key={program._id || idx}
                          className="hover:bg-slate-50/60 transition-colors group"
                        >
                          <td className="px-6 py-4 text-center font-mono text-slate-400 text-xs font-semibold">
                            #{String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900 max-w-md break-words leading-relaxed group-hover:text-[#660033] transition-colors">
                            {program.name}
                            {program.code && (
                              <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-500 rounded uppercase">
                                {program.code}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600">
                              {program.category || "General"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-[#660033] font-bold whitespace-nowrap">
                            {(program.enrollment || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            {isPriority ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ★ Priority
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200">
                                Standard
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-xs text-slate-400 bg-slate-50/30"
                      >
                        <div className="text-3xl mb-2">📭</div>
                        No programs found matching "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          <span>Office of the University Registrar</span>
          <span className="text-[#D4AF37] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            Live Data Feed Connected
          </span>
        </div>
      </div>
    </div>
  );
}
