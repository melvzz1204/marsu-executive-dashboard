import React, { useState, useMemo } from "react";
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
import { enrollmentFull } from "./enrollmentFull.js";

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

// Balanced 60-30-10 Institutional Color Strategy
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

// COMPREHENSIVE ACADEMIC ABBREVIATION DICTIONARY
const PROGRAM_ABBREVIATIONS = {
  "Bachelor of Science in Industrial Technology": "BS Industrial Technolgy",
  "Bachelor of Science in Information Technology": "BS Information Technology",
  "Bachelor of Science in Business Administration":
    "BS  Business Administration",
  "Bachelor of Science in Civil Engineering": "BS Civil Engineering",
  "Bachelor of Science in Nursing": "BS Nursing",
  "Bachelor of Secondary Education": "BS Education",
  "Bachelor of Science in Tourism Management": "BS Tourism Management",
  "Bachelor of Science in Law Enforcement Administration":
    "BS Law Enforcement Administration",
  "Bachelor of Science in Social Works": "BS Social Works",
  "Bachelor of Science in Entrepreneurship-Entrepreneurial Management":
    "BS Entrepreneurship-Entrepreneurial Management",
  "Bachelor of Science in Information Systems": "BS Information Systems",
  "Bachelor of Science in Public Administration": "BS Public Administration",
  "Bachelor of Arts in Communication": "BA Communication",
  "Bachelor of Arts in English Language Studies": "BA English Language Studies",
  "Bachelor of Arts major in English Language Studies":
    "BA English Language Studies",
  "Bachelor of Science in Electrical Engineering": "BS Electrical Engineering",
  "Bachelor of Science in Mechanical Engineering": "BS Mechanical Engineering",
  "Bachelor of Science in Computer Engineering": "BS Computer Engineering",
  "Bachelor of Science in Environmental Science": "BS Environmental Science",
  "Bachelor of Science in Accountancy": "BS Accountancy",
  "Bachelor of Science in Accounting Information System":
    "BS Accounting Information System",
  "Bachelor of Culture and Arts Education": "BC Culture and Arts Education",
  "Bachelor of Technology and Livelihood Education": "BTLED",
  "Bachelor of Science in Fisheries": "BS Fisheries",
  "Bachelor of Arts in Political Science": "BA Political Science",
  "Bachelor of Elementary Education": "BE Elementary Education",
  "Diploma in Agricultural Technology": "DAT",
  "Bachelor in Agricultural Technology": "BAT",
  "Certificate in Agricultural Science": "CAS",
  "Bachelor of Science in Agriculture": "BSAgr",
  "Bachelor of Science in Entrepreneurship-Agri-Business": "BSEntrep-AB",
  "Diploma in Midwifery": "DipMid",
  "Bachelor of Science in Midwifery": "BSMid",
};

export default function EnrollmentDashboard() {
  const [selectedYear, setSelectedYear] = useState(2023);
  const [selectedCampus, setSelectedCampus] = useState("Boac");

  const years = [2021, 2022, 2023];
  const campuses = ["Boac", "Gasan", "Sta. Cruz", "Torrijos"];

  // ==========================================
  // STREAMLINED DATA PIPELINES
  // ==========================================
  const currentData = useMemo(() => {
    return (enrollmentFull.time_series || []).find(
      (item) => item.year === selectedYear && item.campus === selectedCampus,
    );
  }, [selectedYear, selectedCampus]);

  const summaryData = useMemo(() => {
    return (enrollmentFull.summary || []).find((s) => s.year === selectedYear);
  }, [selectedYear]);

  // Reverse mapping for restoring full text names inside tooltips dynamically
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

  // Dynamic Abbreviated Bar Allocation Engine
  const dynamicTopChartData = useMemo(() => {
    if (!currentData || !currentData.programs)
      return { labels: [], datasets: [] };

    const sorted = [...currentData.programs].sort(
      (a, b) => b.enrollment - a.enrollment,
    );

    // Captured Wide Real-Estate displaying top 6 items
    const top6 = sorted.slice(0, 6);
    const remainder = sorted.slice(6);
    const remainderSum = remainder.reduce(
      (acc, curr) => acc + curr.enrollment,
      0,
    );

    // Swap names with ultra-clean dictionary abbreviations
    const labels = top6.map((p) => PROGRAM_ABBREVIATIONS[p.name] || p.name);
    const values = top6.map((p) => p.enrollment);
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
    const historicalSummary = enrollmentFull.summary || [];
    return {
      labels: historicalSummary.map((s) => `AY ${s.year}`),
      datasets: [
        {
          type: "line",
          label: "Total System Capacity",
          data: historicalSummary.map((s) => s.total_enrollment),
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
  }, []);

  // ==========================================
  // CHART CONFIGURATIONS (ABBREVIATION TOOLTIP SAFEGUARD)
  // ==========================================
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
          // TOOLTIP SAFEGUARD: Restores full curriculum spelling when user hovers an abbreviation
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP COMPACT CONTROL LAYER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#660033]">
              Institutional Registrar Dashboard
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Enrollment Distribution Terminal
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedYear === year
                      ? "bg-[#660033] text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
              {campuses.map((campus) => (
                <button
                  key={campus}
                  onClick={() => setSelectedCampus(campus)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

        {/* SUMMARY KPI BLOCKS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Hub Enrollment Volume
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono">
                {currentData?.metadata?.total_enrollment?.toLocaleString() || 0}
              </h3>
            </div>
            {summaryData?.yoy_growth && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-[#D4AF37] border border-amber-100">
                ▲ {(summaryData.yoy_growth * 100).toFixed(1)}% System SY
              </span>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Campus Programs
            </p>
            <h3 className="text-3xl font-black text-slate-900 mt-1 font-mono">
              {currentData?.metadata?.program_count || 0}
            </h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Leading Campus Array
            </p>
            <h3
              className="text-sm font-bold text-[#660033] mt-2 block truncate"
              title={currentData?.metadata?.top_program}
            >
              {currentData?.metadata?.top_program || "None Listed"}
            </h3>
          </div>
        </div>

        {/* FULL WIDTH OPTIMIZED BAR GRAPH */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900">
                Primary Concentration Nodes
              </h4>
              <p className="text-xs text-slate-400">Top programs</p>
            </div>
            <div className="h-[340px] relative flex-1">
              <Chart
                type="bar"
                data={dynamicTopChartData}
                options={horizontalOptions}
              />
            </div>
          </div>
        </div>

        {/* AUDIT MATRIX (TABLE STAYS DETAILED WITH COMPACT BADGES) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-base font-bold text-slate-900">
              Granular Curriculum Registry Audit
            </h4>
            <p className="text-xs text-slate-400">
              Comprehensive reference directory
            </p>
          </div>

          <div className="max-h-[350px] overflow-y-auto relative">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-semibold text-[11px] uppercase tracking-wider z-10">
                <tr>
                  <th className="px-6 py-3 w-16">Rank</th>
                  <th className="px-6 py-3 w-24">Code</th>
                  <th className="px-6 py-3 min-w-[240px]">
                    Curriculum Designation
                  </th>
                  <th className="px-6 py-3">Classification</th>
                  <th className="px-6 py-3 text-right">Count</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                {(currentData?.programs || [])
                  .sort((a, b) => a.rank - b.rank)
                  .map((program, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-slate-400 text-xs font-semibold">
                        #{String(program.rank).padStart(2, "0")}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 font-mono text-xs">
                        {PROGRAM_ABBREVIATIONS[program.name] || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 max-w-md break-words leading-relaxed">
                        {program.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600">
                          {program.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-[#660033] font-bold whitespace-nowrap">
                        {program.enrollment?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            program.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}
                        >
                          {program.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LONGITUDINAL TRAJECTORY */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900">
              Longitudinal Capacity Velocity
            </h4>
            <p className="text-xs text-slate-400">
              Multi-year global system registration growth trace
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

        {/* FOOTER */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          <span>Office of the University Registrar // MarSU</span>
          <span className="text-[#D4AF37] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            Active Operational Stream
          </span>
        </div>
      </div>
    </div>
  );
}
