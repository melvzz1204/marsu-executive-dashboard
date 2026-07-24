import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
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

const PROGRAM_ABBREVIATIONS = {
  "Bachelor of Science in Industrial Technology": "BS Industrial Technology",
  "Bachelor of Science in Information Technology": "BS Information Technology",
  "Bachelor of Science in Business Administration":
    "BS Business Administration",
  "Bachelor of Science in Civil Engineering": "BS Civil Engineering",
  "Bachelor of Science in Nursing": "BS Nursing",
  "Bachelor of Secondary Education": "BS Education",
  "Bachelor of Science in Tourism Management": "BS Tourism Management",
  "Bachelor of Science in Law Enforcement Administration":
    "BS Law Enforcement Admin",
  "Bachelor of Science in Social Works": "BS Social Works",
  "Bachelor of Science in Information Systems": "BS Information Systems",
  "Bachelor of Science in Public Administration": "BS Public Administration",
  "Bachelor of Arts in Communication": "BA Communication",
  "Bachelor of Science in Electrical Engineering": "BS Electrical Engineering",
  "Bachelor of Science in Mechanical Engineering": "BS Mechanical Engineering",
  "Bachelor of Science in Computer Engineering": "BS Computer Engineering",
  "Bachelor of Science in Accountancy": "BS Accountancy",
  "Bachelor of Science in Agriculture": "BS Agriculture",
};

const formatAYLabel = (startYear) => {
  if (!startYear) return "";
  const numericYear = Number(startYear);
  return !isNaN(numericYear)
    ? `AY ${numericYear}–${numericYear + 1}`
    : startYear;
};

export default function EnrollmentDashboard() {
  const [availableYears, setAvailableYears] = useState([]);
  const [availableCampuses, setAvailableCampuses] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("1st Semester");

  const [currentData, setCurrentData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = "http://127.0.0.1:5000/api/v1/enrollment";

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
          if (semesters && semesters.length > 0)
            setSelectedSemester(semesters[0]);
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

  const labelToFullNameMap = useMemo(() => {
    const map = new Map();
    if (currentData && currentData.programs) {
      currentData.programs.forEach((p) => {
        const abbrev = PROGRAM_ABBREVIATIONS[p.name] || p.name;
        map.set(abbrev, p.name);
      });
    }
    return map;
  }, [currentData]);

  // Permanently sorted from highest to lowest enrollment
  const sortedPrograms = useMemo(() => {
    if (!currentData || !Array.isArray(currentData.programs)) return [];

    return [...currentData.programs].sort(
      (a, b) => (b.enrollment || 0) - (a.enrollment || 0),
    );
  }, [currentData]);

  const dynamicTopChartData = useMemo(() => {
    if (!currentData || !Array.isArray(currentData.programs)) {
      return { labels: [], datasets: [] };
    }

    const sorted = [...currentData.programs].sort(
      (a, b) => (b.enrollment || 0) - (a.enrollment || 0),
    );

    const top6 = sorted.slice(0, 6);
    const remainder = sorted.slice(6);
    const remainderSum = remainder.reduce(
      (acc, curr) => acc + (curr.enrollment || 0),
      0,
    );

    const labels = top6.map((p) => PROGRAM_ABBREVIATIONS[p.name] || p.name);
    const values = top6.map((p) => p.enrollment || 0);
    const backgroundColors = top6.map(
      (p) => PALETTE.categories[p.category] || PALETTE.categories.Other,
    );

    if (remainderSum > 0) {
      labels.push("Other Programs");
      values.push(remainderSum);
      backgroundColors.push(PALETTE.categories.Aggregated);
    }

    return {
      labels,
      datasets: [
        {
          label: "Students",
          data: values,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          barPercentage: 0.55,
        },
      ],
    };
  }, [currentData]);

  const macroTrendData = useMemo(() => {
    return {
      labels: trendData.map((t) => formatAYLabel(t.academicYear)),
      datasets: [
        {
          type: "line",
          label: "Total Enrollment",
          data: trendData.map((t) => t.totalStudents || 0),
          borderColor: PALETTE.gold,
          borderWidth: 4,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: PALETTE.gold,
          pointHoverRadius: 7,
          fill: true,
          backgroundColor: "rgba(212, 175, 55, 0.05)",
          tension: 0.25,
        },
      ],
    };
  }, [trendData]);

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

  const horizontalOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: PALETTE.slateDark,
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 12 },
        callbacks: {
          title: function (context) {
            const shortLabel = context[0].label;
            return labelToFullNameMap.get(shortLabel) || shortLabel;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "#f1f5f9" },
        ticks: { color: PALETTE.slateMuted, font: { size: 11 } },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: PALETTE.slateDark,
          font: { size: 12, weight: "700" },
          autoSkip: false,
        },
      },
    },
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
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased  rounded-2xl font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER CONTROL LAYER */}
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
            {/* ACADEMIC YEAR DROPDOWN */}
            {availableYears.length > 0 && (
              <div className="relative">
                <select
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

            {/* CAMPUS SELECTION BUTTONS */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 overflow-x-auto max-w-xs scrollbar-none">
              {availableCampuses.map((campus) => (
                <button
                  key={campus}
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

            {/* SEMESTER DROPDOWN */}
            {availableSemesters.length > 0 && (
              <div className="relative">
                <select
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

        {/* ERROR ALERT */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex justify-between items-center">
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
          {/* CARD 1: Campus Enrollment */}
          <div className="relative bg-[#660033] text-white p-6 rounded-2xl shadow-[0_4px_0_0_#D4AF37] flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-300 block uppercase font-sans mb-1">
                Campus Enrollment
              </span>
              <span className="text-3xl font-black text-[#FFD700] leading-none block mt-1 tracking-tight my-1">
                {loading ? "..." : (kpis.totalStudents || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/10">
              <span className="text-[11px] font-medium text-slate-200/90 font-sans lowercase tracking-wide">
                total students on campus
              </span>
              {!loading &&
                renderYoYBadge(kpis.yoYGrowthPercentage, kpis.hasYoYBaseline)}
            </div>
          </div>

          {/* CARD 2: Active Programs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Active Programs
              </span>
              <h3 className="text-3xl font-black text-slate-900 font-sans tracking-tight mt-1.5">
                {loading ? "..." : kpis.activeProgramsCount || 0}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 capitalize tracking-wide mt-auto pt-2 border-t border-slate-100">
              degree offerings at {selectedCampus} campus
            </span>
          </div>

          {/* CARD 3: Largest Program */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[140px] min-w-0">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Largest Program
              </span>
              <h3
                className="text-base font-black text-[#660033] mt-2 block truncate font-sans tracking-tight"
                title={kpis.largestProgramName}
              >
                {loading ? "..." : kpis.largestProgramName || "None Listed"}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 capitalize tracking-wide mt-auto pt-2 border-t border-slate-100">
              highest student headcount
            </span>
          </div>
        </div>

        {/* MULTI-YEAR TREND LINE CHART */}
        {trendData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900">
                Multi-Year Enrollment Growth
              </h4>
              <p className="text-xs text-slate-400">
                Longitudinal registration trajectory for {selectedCampus} Campus
                ({selectedSemester})
              </p>
            </div>
            <div className="h-[160px] relative">
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
                      ticks: { color: PALETTE.slateMuted, font: { size: 11 } },
                    },
                    y: {
                      grid: { color: "#f1f5f9" },
                      ticks: { color: PALETTE.slateMuted, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* TOP PROGRAMS HORIZONTAL BAR CHART */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900">
                Highest Enrollment Programs
              </h4>
              <p className="text-xs text-slate-400">
                Top degree tracks by student headcount
              </p>
            </div>
            <div className="h-[340px] relative flex-1">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                  Loading Chart...
                </div>
              ) : dynamicTopChartData.labels.length > 0 ? (
                <Chart
                  type="bar"
                  data={dynamicTopChartData}
                  options={horizontalOptions}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No program data available for this selection.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COMPLETE PROGRAM MATRIX TABLE */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-base font-bold text-slate-900">
              Complete Course & Program List
            </h4>
            <p className="text-xs text-slate-400">
              Detailed program headcount reference directory
            </p>
          </div>

          <div className="max-h-[350px] overflow-y-auto relative">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-semibold text-[11px] uppercase tracking-wider z-10">
                <tr>
                  <th className="px-6 py-3 w-16 text-center">Rank</th>
                  <th className="px-6 py-3 min-w-[240px]">Program Title</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3 text-right">Students</th>
                  <th className="px-6 py-3 text-center">CHED Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest"
                    >
                      Fetching program table data...
                    </td>
                  </tr>
                ) : sortedPrograms.length > 0 ? (
                  sortedPrograms.map((program, idx) => {
                    const isPriority = Boolean(
                      program.isPriority ?? program.is_priority,
                    );

                    return (
                      <tr
                        key={program._id || idx}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* CLEAN NUMBERED RANK */}
                        <td className="px-6 py-4 text-center font-mono text-slate-400 text-xs font-semibold">
                          #{String(idx + 1).padStart(2, "0")}
                        </td>

                        {/* PROGRAM TITLE */}
                        <td className="px-6 py-4 font-medium text-slate-900 max-w-md break-words leading-relaxed">
                          {program.name}
                          {program.code && (
                            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-500 rounded uppercase">
                              {program.code}
                            </span>
                          )}
                        </td>

                        {/* DEPARTMENT */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600">
                            {program.category || "General"}
                          </span>
                        </td>

                        {/* STUDENT ENROLLMENT COUNT */}
                        <td className="px-6 py-4 text-right font-mono text-[#660033] font-bold whitespace-nowrap">
                          {(program.enrollment || 0).toLocaleString()}
                        </td>

                        {/* CHED PRIORITY */}
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
                      className="px-6 py-8 text-center text-xs text-slate-400"
                    >
                      No programs found for this year, campus, and semester
                      selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          <span>Office of the University Registrar</span>
          <span className="text-[#D4AF37] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            Active System Online
          </span>
        </div>
      </div>
    </div>
  );
}
