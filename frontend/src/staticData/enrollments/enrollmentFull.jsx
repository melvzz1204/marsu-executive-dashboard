import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
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

const PROGRAM_ABBREVIATIONS = {
  "Bachelor of Science in Industrial Technology": "BS Industrial Technology",
  "Bachelor of Science in Information Technology": "BS Information Technology",
  "Bachelor of Science in Business Administration": "BS Business Administration",
  "Bachelor of Science in Civil Engineering": "BS Civil Engineering",
  "Bachelor of Science in Nursing": "BS Nursing",
  "Bachelor of Secondary Education": "BS Education",
  "Bachelor of Science in Tourism Management": "BS Tourism Management",
  "Bachelor of Science in Law Enforcement Administration": "BS Law Enforcement Admin",
  "Bachelor of Science in Social Works": "BS Social Works",
  "Bachelor of Science in Entrepreneurship-Entrepreneurial Management": "BS Entrepreneurship-EM",
  "Bachelor of Science in Information Systems": "BS Information Systems",
  "Bachelor of Science in Public Administration": "BS Public Admin",
  "Bachelor of Arts in Communication": "BA Communication",
  "Bachelor of Arts in English Language Studies": "BA English Language Studies",
  "Bachelor of Arts major in English Language Studies": "BA English Language Studies",
  "Bachelor of Science in Electrical Engineering": "BS Electrical Engineering",
  "Bachelor of Science in Mechanical Engineering": "BS Mechanical Engineering",
  "Bachelor of Science in Computer Engineering": "BS Computer Engineering",
  "Bachelor of Science in Environmental Science": "BS Environmental Science",
  "Bachelor of Science in Accountancy": "BS Accountancy",
  "Bachelor of Science in Accounting Information System": "BS Accounting Info System",
  "Bachelor of Culture and Arts Education": "BCAEd",
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
  const [selectedYear, setSelectedYear] = useState(2021); 
  const [selectedCampus, setSelectedCampus] = useState("Boac");
  
  // Dynamic API state buffers
  const [currentData, setCurrentData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // File Upload State Controls
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const campuses = ["Boac", "Gasan", "Santa Cruz", "Torrijos"];

  // 💡 Dynamic Year Extraction Engine: Computes available years on the fly from the database trend response
  const dynamicYearsList = useMemo(() => {
    if (!trendData || trendData.length === 0) {
      return [2021, 2022, 2023]; // Robust fallback window if database records haven't loaded yet
    }
    
    // Parse years out of 'academicYear' or 'year' or 'label' properties depending on trend object payload shape
    const extractedYears = trendData.map((item) => item.academicYear || item.year || item.label);
    
    // De-duplicate array items and sort them cleanly chronologically
    const uniqueSortedYears = [...new Set(extractedYears)]
      .filter(Boolean)
      .map(Number)
      .sort((a, b) => a - b);
      
    return uniqueSortedYears.length > 0 ? uniqueSortedYears : [2021, 2022, 2023];
  }, [trendData]);

  // Core Data Fetch Routine
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryYear = String(selectedYear);
      const queryCampus = encodeURIComponent(selectedCampus);
      const token = localStorage.getItem("token"); 

      const headers = {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
      };

      // 1. Fetch multi-year trends first to know which years exist in the collection window
      const trendRes = await fetch(
        `http://localhost:5000/api/v1/enrollment/trend?campus=${queryCampus}`,
        { method: "GET", headers }
      );
      const trendJson = await trendRes.json();

      let dynamicTrendData = [];
      if (trendJson.success && trendJson.data) {
        dynamicTrendData = trendJson.data;
        setTrendData(trendJson.data);
      } else {
        setTrendData([]);
      }

      // 2. Safely pick a target year if current selection falls out of bounds
      let targetYear = queryYear;
      if (dynamicTrendData.length > 0) {
        const extracted = dynamicTrendData.map((item) => item.academicYear || item.year || item.label).map(Number);
        // If the selectedYear isn't found in the trends list, automatically switch to the newest available year
        if (!extracted.includes(Number(selectedYear))) {
          const newestYear = Math.max(...extracted);
          targetYear = String(newestYear);
          setSelectedYear(newestYear);
        }
      }

      // 3. Fetch single year context report metrics
      const snapshotRes = await fetch(
        `http://localhost:5000/api/v1/enrollment?year=${targetYear}&campus=${queryCampus}`,
        { method: "GET", headers }
      );
      const snapshotJson = await snapshotRes.json();

      if (snapshotJson.success && snapshotJson.data) {
        setCurrentData(snapshotJson.data);
      } else {
        setCurrentData(null);
      }
    } catch (err) {
      setError("Failed to stream analytical parameters from database server registry.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading sequences upon selector adjustments
  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedCampus]);

  // Excel Upload Submission Logic handler updated to robust Axios deployment
  const handleFileUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadMessage({ type: "error", text: "Please select an Excel document first." });
      return;
    }

    setUploading(true);
    setUploadMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile); // Ingest raw file stream binary payload

      // Fire payload across pipeline using Axios safely
      const response = await axios.post(
        "http://localhost:5000/api/v1/enrollment/upload",
        formData,
        {
          headers: {
            "Authorization": `Bearer ${token}`
            // ❌ NO Content-Type specified here. Axios auto-appends boundaries.
          }
        }
      );

      if (response.data && response.data.success) {
        setUploadMessage({ 
          type: "success", 
          text: response.data.message || "Spreadsheet telemetry integrated successfully!" 
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Auto refresh dashboard view metrics behind the modal closure delay
        fetchDashboardData();
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadMessage({ type: "", text: "" });
        }, 1800);
      } else {
        setUploadMessage({ 
          type: "error", 
          text: response.data.error || "Failed parsing operational file parameters." 
        });
      }
    } catch (err) {
      console.error("Axios file upload processing failure trace:", err);
      const backendErrorMessage = err.response?.data?.error || "Network pipeline validation timeout.";
      setUploadMessage({ type: "error", text: backendErrorMessage });
    } finally {
      setUploading(false);
    }
  };

  // Reverse mapping for restoring full text names inside tooltips dynamically
  const labelToFullNameMap = useMemo(() => {
    const map = new Map();
    if (currentData && currentData.programs) {
      currentData.programs.forEach((p) => {
        const abbrev = PROGRAM_ABBREVIATIONS[p.programName] || p.programName;
        map.set(abbrev, p.programName);
      });
    }
    return map;
  }, [currentData]);

  // Dynamic Abbreviated Bar Allocation Engine
  const dynamicTopChartData = useMemo(() => {
    if (!currentData || !currentData.programs || currentData.programs.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sorted = [...currentData.programs].sort(
      (a, b) => (b.studentCount || 0) - (a.studentCount || 0)
    );

    const top6 = sorted.slice(0, 6);
    const remainder = sorted.slice(6);
    const remainderSum = remainder.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);

    const labels = top6.map((p) => PROGRAM_ABBREVIATIONS[p.programName] || p.programName);
    const values = top6.map((p) => p.studentCount || 0);
    const backgroundColors = top6.map(
      (p) => PALETTE.categories[p.department] || PALETTE.categories.Other
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
    if (!trendData || trendData.length === 0) {
      return { labels: [], datasets: [] };
    }
    return {
      labels: trendData.map((t) => `AY ${t.academicYear || t.label || t.year || ""}`),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">
        Syncing live data registers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-4 md:p-8 rounded-2xl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP COMPACT CONTROL LAYER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#660033]">
              Institutional Registrar Dashboard
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Campus Enrollment Trends
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 shadow transition-all flex items-center gap-2 border border-slate-700/50 order-2 sm:order-1"
            >
              <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Upload Sheet
            </button>

            <div className="flex items-center gap-3 order-1 sm:order-2">
              {/* 💡 Year Selection controls updated to display fully dynamic data lists from backend logs */}
              <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap gap-1">
                {dynamicYearsList.map((year) => (
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
        </div>

        {/* SUMMARY KPI BLOCKS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="relative bg-[#660033] text-white p-6 rounded-2xl shadow-[0_4px_0_0_#D4AF37] flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-300 block uppercase font-sans mb-1">
                Campus Enrollment
              </span>
              <span className="text-3xl font-black text-[#FFD700] leading-none block mt-1 tracking-tight my-1">
                {currentData?.summaryKpis?.totalStudents?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/10">
              <span className="text-[11px] font-medium text-slate-200/90 font-sans lowercase tracking-wide">
                total students on campus
              </span>
              {currentData?.summaryKpis?.yoYGrowthPercentage !== undefined && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#660033] ">
                  {currentData.summaryKpis.yoYGrowthPercentage >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(currentData.summaryKpis.yoYGrowthPercentage).toFixed(1)}% YoY Growth
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Active Programs
              </span>
              <h3 className="text-3xl font-black text-slate-900 font-sans tracking-tight mt-1.5">
                {currentData?.summaryKpis?.activeProgramsCount || 0}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 capitalize tracking-wide mt-auto pt-2 border-t border-slate-100">
              degree offerings this campus
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[140px] min-w-0">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Priority Program Enrollees
              </span>
              <h3 className="text-3xl font-black text-[#660033] tracking-tight mt-1.5">
                {currentData?.summaryKpis?.priorityEnrollmentPercentage || 0.0}%
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 capitalize tracking-wide mt-auto pt-2 border-t border-slate-100 truncate">
              CHED/RDC Priority Track Metric Alignment
            </span>
          </div>
        </div>

        {/* FULL WIDTH OPTIMIZED BAR GRAPH */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="mb-4">
              <h4 className="text-base font-bold text-slate-900">
                Highest Enrollment Programs
              </h4>
              <p className="text-xs text-slate-400">Top courses by headcount</p>
            </div>
            <div className="h-[340px] relative flex-1">
              {currentData?.programs && currentData.programs.length > 0 ? (
                <Chart
                  type="bar"
                  data={dynamicTopChartData}
                  options={horizontalOptions}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400 italic">
                  No program distributions compiled for selection matrix.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LONGITUDINAL TRAJECTORY */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900">
              Multi-Year Enrollment Growth
            </h4>
            <p className="text-xs text-slate-400">
              Overall university system student registration trace
            </p>
          </div>
          <div className="h-[160px] relative">
            {trendData && trendData.length > 0 ? (
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
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400 italic">
                No historic multi-year timeline telemetry mapped.
              </div>
            )}
          </div>
        </div>

        {/* AUDIT MATRIX */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-base font-bold text-slate-900">
              Complete Course & Program List
            </h4>
            <p className="text-xs text-slate-400">
              Detailed campus reference directory
            </p>
          </div>

          <div className="max-h-[350px] overflow-y-auto relative">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-semibold text-[11px] uppercase tracking-wider z-10">
                <tr>
                  <th className="px-6 py-3 w-16">Rank</th>
                  <th className="px-6 py-3 min-w-[240px]">Program Title</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3 text-right">Students</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                {currentData?.programs && currentData.programs.length > 0 ? (
                  [...currentData.programs]
                    .sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))
                    .map((program, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-slate-400 text-xs font-semibold">
                          #{String(idx + 1).padStart(2, "0")}
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-900 max-w-md break-words leading-relaxed">
                          {program.programName}
                          {program.isPriorityProgram && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Priority
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600">
                            {program.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-[#660033] font-bold whitespace-nowrap">
                          {(program.studentCount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              program.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-100"
                            }`}
                          >
                            {program.isActive ? "active" : "inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-xs font-medium text-slate-400 italic">
                      No active database row aggregates match current year and campus filter arguments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          <span>Office of the University Registrar // MarSU</span>
          <span className="text-[#D4AF37] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            Active System Online
          </span>
        </div>

      </div>

      {/* OVERLAY MODAL FOR EXCEL UPLOADS WITH AXIOS REFINEMENTS */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all scale-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload Registry Source</h3>
                <p className="text-[11px] text-slate-400">Import structured institution spreadsheets</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                  setUploadMessage({ type: "", text: "" });
                }}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFileUploadSubmit} className="p-6 space-y-4">
              
              {/* Drag & Drop Visual Field */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  selectedFile 
                    ? "border-emerald-300 bg-emerald-50/20" 
                    : "border-slate-200 hover:border-[#660033] hover:bg-slate-50/50"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onClick={(e) => e.stopPropagation()} // Stop bubbling trigger loops
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className={`p-2.5 rounded-xl ${selectedFile ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  
                  {selectedFile ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[280px]">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-700">Click to locate workbook source</p>
                      <p className="text-[10px] text-slate-400">Supports standard Microsoft Excel format (.xlsx)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Operational Banners */}
              {uploadMessage.text && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  uploadMessage.type === "success" 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                    : "bg-rose-50 text-rose-800 border-rose-100"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <p className="flex-1">{uploadMessage.text}</p>
                </div>
              )}

              {/* Action Operations Tray */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setSelectedFile(null);
                    setUploadMessage({ type: "", text: "" });
                  }}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="flex-1 py-2 bg-[#660033] hover:bg-[#520029] text-white rounded-xl font-bold text-xs shadow-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {uploading ? "Parsing Rows..." : "Execute Sync"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}