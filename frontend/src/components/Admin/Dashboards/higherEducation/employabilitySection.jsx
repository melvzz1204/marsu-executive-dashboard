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
  bgSlate: "#f8fafc",
};

// Skeleton Loader Component
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200/60 rounded ${className}`}></div>
);

const CHART_SKELETON_HEIGHTS = [
  "h-[35%]",
  "h-[60%]",
  "h-[45%]",
  "h-[75%]",
  "h-[55%]",
];

export default function EmployabilityMetrics() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table Sort & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "year",
    direction: "desc",
  });

  // Fetch Stats Data from Backend
  const fetchTracerStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/higher-education/stats");
      setStatsData(response.data.data);
    } catch (err) {
      console.error("Error fetching employability stats:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to connect to the server";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(fetchTracerStats, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchTracerStats]);

  // Map Backend Payload
  const tracerMatrix = useMemo(
    () => statsData?.tracerStudyMatrix || [],
    [statsData],
  );
  const kpis = useMemo(() => statsData?.kpis || {}, [statsData]);
  const cumulativeRate = kpis.cumulativeEmployabilityPercentage || 0;
  const totalGraduatesSum = kpis.totalGraduates || 0;
  const totalEmployedSum = kpis.totalEmployed || 0;

  // Highest Performing Class
  const peakClass = useMemo(() => {
    if (!tracerMatrix.length) return null;
    return [...tracerMatrix].sort(
      (a, b) =>
        (b.employabilityPercentage || 0) - (a.employabilityPercentage || 0),
    )[0];
  }, [tracerMatrix]);

  // Processed Data for Smart Matrix Table
  const processedMatrix = useMemo(() => {
    if (!tracerMatrix.length) return [];

    let filtered = tracerMatrix.filter(
      (row) =>
        `CY ${row.year}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(row.year).includes(searchQuery),
    );

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tracerMatrix, searchQuery, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Dual-Axis Chart Data Structure
  // Dual-Axis Chart Data Structure
  const chartData = useMemo(() => {
    const labels = tracerMatrix.map((d) => `CY ${d.year}`);
    const graduates = tracerMatrix.map((d) => d.totalGraduates || 0);
    const employed = tracerMatrix.map((d) => d.employedCount || 0);
    const rates = tracerMatrix.map((d) => d.employabilityPercentage || 0);

    return {
      labels,
      datasets: [
        {
          type: "line",
          label: "Employability Rate (%)",
          data: rates,
          borderColor: PALETTE.gold,
          backgroundColor: "rgba(212, 175, 55, 0.08)",
          borderWidth: 3.5,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: PALETTE.gold,
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.3,
          order: 1,
          yAxisID: "yPercentage",
        },
        {
          type: "bar",
          label: "Employed Alumni",
          data: employed,
          backgroundColor: PALETTE.maroon,
          hoverBackgroundColor: PALETTE.maroonHover,
          borderRadius: {
            topLeft: 4,
            topRight: 0,
            bottomLeft: 0,
            bottomRight: 0,
          },
          barPercentage: 1.0, // Removes internal gap between left and right bar
          categoryPercentage: 0.4, // Width ratio of the bar group per year
          order: 2,
          yAxisID: "yCount",
        },
        {
          type: "bar",
          label: "Total Cohort Size",
          data: graduates,
          backgroundColor: "rgba(203, 213, 225, 0.6)",
          hoverBackgroundColor: "rgba(203, 213, 225, 0.8)",
          borderRadius: {
            topLeft: 0,
            topRight: 4,
            bottomLeft: 0,
            bottomRight: 0,
          },
          barPercentage: 1.0, // Removes internal gap between left and right bar
          categoryPercentage: 0.4, // Width ratio of the bar group per year
          order: 3,
          yAxisID: "yCount",
        },
      ],
    };
  }, [tracerMatrix]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
          font: { size: 11, family: "Oswald, sans-serif", weight: "600" },
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
            if (context.dataset.type === "line") {
              return ` Placement Rate: ${context.raw}%`;
            }
            return ` ${context.dataset.label}: ${context.raw.toLocaleString()}`;
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
        ticks: {
          color: PALETTE.slateMuted,
          font: { size: 11 },
        },
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
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 antialiased rounded-2xl font-sans">
      <div className="max-w-7xl mx-auto space-y-6 p-10">
        {/* HEADER CONTROL LAYER */}
        <div
          id="block-employability-tracer"
          className="scroll-mt-24 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#660033]">
              Institutional Career Services & Alumni Affairs
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Graduate Employability Metrics
            </h1>
          </div>
        </div>

        {error && (
          <div
            className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex justify-between items-center"
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

        {/* KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* PRIMARY KPI CARD */}
          <div className="relative bg-[#660033] text-white p-6 rounded-2xl shadow-[0_4px_0_0_#D4AF37] flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-300 block uppercase font-sans mb-1">
                Cumulative Placement Rate
              </span>
              {loading ? (
                <Skeleton className="h-8 w-24 mt-2 mb-2 bg-white/20" />
              ) : (
                <span className="text-3xl font-black text-[#FFD700] leading-none block mt-1 tracking-tight my-1">
                  {cumulativeRate}%
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/10">
              <span className="text-[11px] font-medium text-slate-200/90 font-sans lowercase tracking-wide">
                benchmark average across all cycles
              </span>
            </div>
          </div>

          {/* SECONDARY KPI CARD 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Total Employed Alumni
              </span>
              {loading ? (
                <Skeleton className="h-8 w-28 mt-2" />
              ) : (
                <h3 className="text-3xl font-black text-slate-900 font-sans tracking-tight mt-1.5">
                  {totalEmployedSum.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    / {totalGraduatesSum.toLocaleString()}
                  </span>
                </h3>
              )}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 capitalize tracking-wide mt-auto pt-2 border-t border-slate-100">
              total confirmed workforce entries
            </span>
          </div>

          {/* SECONDARY KPI CARD 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[140px] min-w-0">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Peak Performance Class
              </span>
              {loading ? (
                <Skeleton className="h-5 w-3/4 mt-3" />
              ) : (
                <h3
                  className="text-base font-black text-[#660033] mt-2 block tracking-tight"
                  title={peakClass ? `Class of ${peakClass.year}` : "N/A"}
                >
                  {peakClass
                    ? `Class of ${peakClass.year} (${peakClass.employabilityPercentage}%)`
                    : "None Listed"}
                </h3>
              )}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 capitalize tracking-wide mt-auto pt-2 border-t border-slate-100">
              highest recorded placement cycle
            </span>
          </div>
        </div>

        {/* VISUALIZATION ROW: DUAL-AXIS CHART */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900">
              Multi-Year Graduate Placement & Employment Output
            </h4>
            <p className="text-xs text-slate-400">
              Comparative view of overall graduate cohort size against verified
              employment count and placement rate percentage.
            </p>
          </div>

          {/* FIXED HEIGHT CONTAINER */}
          <div className="h-[300px] min-h-[200px] relative w-full">
            {loading ? (
              <div className="absolute inset-0 flex items-end justify-between px-4 pb-4 gap-4">
                {CHART_SKELETON_HEIGHTS.map((heightClass) => (
                  <Skeleton
                    key={heightClass}
                    className={`w-full ${heightClass}`}
                  />
                ))}
              </div>
            ) : tracerMatrix.length > 0 ? (
              <Chart type="bar" data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No tracer study data available.
              </div>
            )}
          </div>
        </div>

        {/* CHRONOLOGICAL BREAKDOWN MATRIX TABLE */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Chronological Tracer Study Matrix
              </h4>
              <p className="text-xs text-slate-400">
                Granular headcount and employment performance records per
                academic year cycle.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 text-xs">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search class year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#660033] focus:ring-1 focus:ring-[#660033] transition-shadow"
                aria-label="Search tracer records"
              />
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto relative">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 sticky top-0 text-slate-400 font-semibold text-[11px] uppercase tracking-wider z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 w-16 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                    Rank
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("year")}
                  >
                    Graduating Class{" "}
                    {sortConfig.key === "year" &&
                      (sortConfig.direction === "desc" ? "▼" : "▲")}
                  </th>
                  <th
                    className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("totalGraduates")}
                  >
                    Total Cohort{" "}
                    {sortConfig.key === "totalGraduates" &&
                      (sortConfig.direction === "desc" ? "▼" : "▲")}
                  </th>
                  <th
                    className="px-6 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("employedCount")}
                  >
                    Employed Alumni{" "}
                    {sortConfig.key === "employedCount" &&
                      (sortConfig.direction === "desc" ? "▼" : "▲")}
                  </th>
                  <th
                    className="px-6 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("employabilityPercentage")}
                  >
                    Placement Rate{" "}
                    {sortConfig.key === "employabilityPercentage" &&
                      (sortConfig.direction === "desc" ? "▼" : "▲")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-8 mx-auto" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-6 py-4 flex justify-end">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-6 py-4 flex justify-end">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-20 mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : processedMatrix.length > 0 ? (
                  processedMatrix.map((row, idx) => {
                    const rate = row.employabilityPercentage || 0;
                    return (
                      <tr
                        key={row.year}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        <td className="px-6 py-4 text-center font-mono text-slate-400 text-xs font-semibold">
                          #{String(idx + 1).padStart(2, "0")}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-500/80 text-[10px] uppercase tracking-wider group-hover:text-[#660033] transition-colors">
                          Class of {row.year}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600 font-bold whitespace-nowrap">
                          {(row.totalGraduates || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-[#660033] font-bold whitespace-nowrap">
                          {(row.employedCount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              rate >= 75
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : rate >= 50
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {rate}% Placement
                          </span>
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
                      No records found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-[10px] text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-700 uppercase block mb-0.5">
              Context Data Frame Note:
            </span>
            Calculated directly using verified direct headcount metrics (
            <code>employedCount</code> and <code>totalGraduates</code>) as
            populated by official institutional tracer surveys.
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          <span>Office of Alumni Relations & Career Services</span>
          <span className="text-[#D4AF37] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            Live Data Feed Connected
          </span>
        </div>
      </div>
    </div>
  );
}
