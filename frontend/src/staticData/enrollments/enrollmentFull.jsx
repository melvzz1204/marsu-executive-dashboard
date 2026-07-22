import React, { useState, useEffect, useMemo } from "react";
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
import { Chart as ReactChart } from "react-chartjs-2";

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

const API_BASE_URL = "http://localhost:5000/api/v1/enrollment";

const PALETTE = {
  maroon: "#660033",
  gold: "#D4AF37",
  slateDark: "#0f172a",
  slateMuted: "#64748b",
  categories: {
    Engineering: "#660033",
    Business: "#1e293b",
    Technology: "#334155",
    Sciences: "#475569",
    Education: "#64748b",
    Agriculture: "#8492a6",
    General: "#94a3b8",
    Other: "#cbd5e1",
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
  "Bachelor of Science in Accountancy": "BS Accountancy",
};

export default function EnrollmentDashboard() {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState("Boac");

  const [years, setYears] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const campuses = ["Boac", "Gasan", "Santa Cruz", "Torrijos"];

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Fetch Multi-Year Trend for current campus
        const trendRes = await fetch(
          `${API_BASE_URL}/trend?campus=${encodeURIComponent(selectedCampus)}`,
          { headers: authHeaders },
        );
        const trendJson = await trendRes.json();

        let extractedYears = [];
        if (trendRes.ok && trendJson.success && Array.isArray(trendJson.data)) {
          if (isMounted) {
            // Normalize trend data to ensure 'label' exists for Chart.js
            const normalizedTrend = trendJson.data.map((item) => ({
              ...item,
              label: item.label || item._id || item.academicYear || item.year,
              totalStudents: item.totalStudents || 0,
            }));
            setTrendData(normalizedTrend);
          }

          // 💡 Extract 4-digit year cleanly (checking _id, academicYear, year, and label)
          extractedYears = [
            ...new Set(
              trendJson.data
                .map((item) => {
                  const raw =
                    item._id ||
                    item.academicYear ||
                    item.year ||
                    item.label ||
                    "";
                  const match = String(raw).match(/\b(20\d{2})\b/);
                  return match ? parseInt(match[1], 10) : null;
                })
                .filter((y) => y !== null),
            ),
          ].sort((a, b) => a - b);

          if (isMounted) setYears(extractedYears);
        }

        // Determine target year to query for snapshot
        let targetYear = selectedYear;

        // Auto-select latest year if current selection is invalid or null
        if (extractedYears.length > 0) {
          if (!targetYear || !extractedYears.includes(Number(targetYear))) {
            targetYear = extractedYears[extractedYears.length - 1];
            if (isMounted) setSelectedYear(targetYear);
          }
        }

        // 2. Fetch Snapshot for active campus & targetYear
        if (targetYear) {
          // 💡 Pass both 'academicYear' and 'year' to avoid backend key mismatches
          const snapshotRes = await fetch(
            `${API_BASE_URL}?academicYear=${targetYear}&year=${targetYear}&campus=${encodeURIComponent(
              selectedCampus,
            )}`,
            { headers: authHeaders },
          );
          const snapshotJson = await snapshotRes.json();

          if (isMounted) {
            if (snapshotRes.ok && snapshotJson.success && snapshotJson.data) {
              // Handle array or object return format from backend
              const activeData = Array.isArray(snapshotJson.data)
                ? snapshotJson.data[0]
                : snapshotJson.data;
              setSnapshot(activeData || null);
            } else {
              setSnapshot(null);
              setError(
                snapshotJson.error || "No data recorded for this selection.",
              );
            }
          }
        } else {
          if (isMounted) {
            setSnapshot(null);
            setError("No uploaded enrollment data available for this campus.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to connect to the backend server.");
          setSnapshot(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedYear, selectedCampus]);
  const labelToFullNameMap = useMemo(() => {
    const map = new Map();
    if (snapshot && snapshot.programs) {
      snapshot.programs.forEach((p) => {
        const abbrev =
          PROGRAM_ABBREVIATIONS[p.programName] ||
          p.programCode ||
          p.programName;
        map.set(abbrev, p.programName);
      });
    }
    return map;
  }, [snapshot]);

  const dynamicTopChartData = useMemo(() => {
    if (!snapshot || !snapshot.programs || snapshot.programs.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sorted = [...snapshot.programs].sort(
      (a, b) => b.studentCount - a.studentCount,
    );
    const top6 = sorted.slice(0, 6);
    const remainder = sorted.slice(6);
    const remainderSum = remainder.reduce((acc, p) => acc + p.studentCount, 0);

    const labels = top6.map(
      (p) =>
        PROGRAM_ABBREVIATIONS[p.programName] || p.programCode || p.programName,
    );
    const values = top6.map((p) => p.studentCount);
    const backgroundColors = top6.map(
      (p) => PALETTE.categories[p.department] || PALETTE.categories.General,
    );

    if (remainderSum > 0) {
      labels.push("Other Programs");
      values.push(remainderSum);
      backgroundColors.push(PALETTE.categories.Other);
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
  }, [snapshot]);

  const macroTrendData = useMemo(() => {
    return {
      labels: trendData.map((t) => t.label),
      datasets: [
        {
          type: "line",
          label: "Total Campus Enrollment",
          data: trendData.map((t) => t.totalStudents),
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
        callbacks: {
          title: (context) =>
            labelToFullNameMap.get(context[0].label) || context[0].label,
        },
      },
    },
    scales: {
      x: { grid: { color: "#f1f5f9" }, ticks: { color: PALETTE.slateMuted } },
      y: {
        grid: { display: false },
        ticks: { color: PALETTE.slateDark, font: { weight: "700" } },
      },
    },
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6 font-oswald">
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        {/* CONTROLS HEADER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#660033]">
              Institutional Registrar Dashboard
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Campus Enrollment Trends
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Dynamic Academic Year Selector */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 flex-wrap">
              {years.length > 0 ? (
                years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedYear === year
                        ? "bg-[#660033] text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {year}
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-400 px-3 py-1.5 font-sans">
                  No uploaded years
                </span>
              )}
            </div>

            {/* Campus Selector */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
              {campuses.map((campus) => (
                <button
                  key={campus}
                  onClick={() => setSelectedCampus(campus)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCampus === campus
                      ? "bg-[#660033] text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {campus}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LOADING & ERROR INDICATORS */}
        {loading && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 font-sans text-xs">
            Fetching metrics for {selectedCampus} Campus...
          </div>
        )}

        {error && !loading && (
          <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200 text-rose-700 font-sans text-xs flex justify-between items-center">
            <span>⚠ {error}</span>
            <span className="font-mono text-[10px] uppercase bg-rose-100 px-2 py-1 rounded">
              {selectedYear ? `AY ${selectedYear}` : "N/A"} / {selectedCampus}
            </span>
          </div>
        )}

        {/* SUMMARY KPI CARDS */}
        {snapshot && !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Headcount */}
              <div className="bg-[#660033] text-white p-6 rounded-2xl shadow-[0_4px_0_0_#D4AF37] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-300 block uppercase font-sans">
                    Campus Enrollment
                  </span>
                  <span className="text-3xl font-black text-[#FFD700] leading-none block my-2">
                    {snapshot.summaryKpis?.totalStudents?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 font-sans text-[11px]">
                  <span className="text-slate-200">Total students</span>
                  <span className="px-2 py-0.5 rounded bg-[#D4AF37] text-[#660033] font-bold">
                    {snapshot.summaryKpis?.yoYGrowthPercentage >= 0 ? "▲" : "▼"}{" "}
                    {snapshot.summaryKpis?.yoYGrowthPercentage}% YoY Growth
                  </span>
                </div>
              </div>

              {/* Active Programs */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block">
                    Active Programs
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 font-sans mt-1.5">
                    {snapshot.summaryKpis?.activeProgramsCount || 0}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 font-sans border-t border-slate-100 pt-2">
                  CHED Priority:{" "}
                  {snapshot.summaryKpis?.priorityEnrollmentPercentage}%
                </span>
              </div>

              {/* Top Degree Track */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block">
                    Largest Program
                  </span>
                  <h3 className="text-base font-black text-[#660033] mt-2 truncate font-sans">
                    {snapshot.summaryKpis?.largestProgramName || "N/A"}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 font-sans border-t border-slate-100 pt-2">
                  Highest student count track
                </span>
              </div>
            </div>

            {/* TOP PROGRAM BAR CHART */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-base font-bold text-slate-900">
                Highest Enrollment Programs
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Top degree tracks by headcount
              </p>
              <div className="h-[340px] relative">
                <ReactChart
                  type="bar"
                  data={dynamicTopChartData}
                  options={horizontalOptions}
                />
              </div>
            </div>
          </>
        )}

        {/* LONGITUDINAL TREND CHART */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-base font-bold text-slate-900">
            Multi-Year Enrollment Growth
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Historical enrollment trajectory for {selectedCampus}
          </p>
          <div className="h-[180px] relative">
            <ReactChart
              type="line"
              data={macroTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: "#f1f5f9" } },
                },
              }}
            />
          </div>
        </div>

        {/* FULL AUDIT DATA TABLE */}
        {snapshot && snapshot.programs && snapshot.programs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900">
                Complete Program Directory
              </h4>
              <p className="text-xs text-slate-400">
                AY {selectedYear} campus matrix breakdowns
              </p>
            </div>

            <div className="max-h-[350px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Program Title</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3 text-right">Headcount</th>
                    <th className="px-6 py-3 text-center">CHED Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {snapshot.programs.map((program, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4 font-mono font-bold text-slate-400 text-xs">
                        {program.programCode}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {program.programName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600">
                          {program.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-[#660033] font-bold">
                        {program.studentCount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            program.isPriorityProgram
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          {program.isPriorityProgram ? "Priority" : "Standard"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
