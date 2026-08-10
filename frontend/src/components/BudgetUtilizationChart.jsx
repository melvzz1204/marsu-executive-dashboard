import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

// Register the required Chart.js plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

function BudgetUtilization() {
  // --- 1. DATA FOR BAR CHART (Allocation vs Obligation) ---
  const barData = {
    labels: ["Personnel Services (PS)", "MOOE", "Capital Outlay (CO)"],
    datasets: [
      {
        label: "Approved Allocation",
        data: [215.4, 142.8, 54.3], // Figures in Millions (PHP)
        backgroundColor: "#cbd5e1", // Light Grey Slate
        borderRadius: 8,
      },
      {
        label: "Actual Obligations",
        data: [198.2, 121.5, 40.8], // Figures in Millions (PHP)
        backgroundColor: "#600018", // MarSU Burgundy
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#334155", // Slate 700 text color
          font: { family: "Inter, sans-serif", size: 12, weight: "500" },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)", // Clean semantic tooltip
        callbacks: {
          label: (context) => ` ₱${context.raw}M`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b" }, // Muted slate labels
      },
      y: {
        grid: { color: "#f1f5f9" }, // Soft subtle border rule grids
        ticks: {
          color: "#64748b",
          callback: (value) => `₱${value}M`,
        },
      },
    },
  };

  // --- 2. DATA FOR DOUGHNUT CHART (Overall BUR % Target) ---
  const overallBUR = 87.4; // 87.4% Utilization rate
  const remainingBUR = 100 - overallBUR;

  const doughnutData = {
    labels: ["Utilized Rate", "Remaining Balance"],
    datasets: [
      {
        data: [overallBUR, remainingBUR],
        backgroundColor: ["#C5A059", "#f1f5f9"], // Satin Gold vs Clean Light Track Background
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "78%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] sm:p-6 lg:p-8">
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#600018]/80 block mb-1">
            Fiscal Accountability Matrix
          </span>
          <h2 className="text-xl font-bold text-slate-900 font-oswald uppercase tracking-tight">
            Budget Utilization Rate (BUR)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparative analysis of institutional GAA allotment expenditure
            tracking.
          </p>
        </div>

        {/* Quick Total KPI Badges */}
        <div className="flex w-full gap-2 rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm sm:w-auto sm:gap-4 sm:rounded-2xl">
          <div className="min-w-0 flex-1 px-1 sm:px-2">
            <span className="text-[10px] uppercase text-slate-400 block font-medium tracking-wide">
              Total Allotment
            </span>
            <span className="text-sm font-bold text-slate-800 font-oswald">
              ₱412.5M
            </span>
          </div>
          <div className="w-[1px] bg-slate-200"></div>
          <div className="min-w-0 flex-1 px-1 sm:px-2">
            <span className="text-[10px] uppercase text-slate-400 block font-medium tracking-wide">
              Total Obligated
            </span>
            <span className="text-sm font-bold text-[#600018] font-oswald">
              ₱360.5M
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        {/* Left Side: Major Bar Component (Takes up 2/3 space) */}
        <div className="h-[240px] w-full min-w-0 sm:h-[280px] lg:col-span-2">
          <Bar data={barData} options={barOptions} />
        </div>

        {/* Right Side: Total Efficiency Gauges */}
        <div className="relative flex h-[260px] flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm sm:h-[280px] sm:p-6">
          <div className="h-[170px] w-[170px] relative flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />

            {/* Center Absolute Absolute Text Label inside Doughnut */}
            <div className="absolute text-center pointer-events-none">
              <span className="block text-3xl font-black text-slate-900 font-oswald leading-none">
                {overallBUR}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 block">
                BUR Efficiency
              </span>
            </div>
          </div>

          <div className="text-center mt-5">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              Target Pace: 90.0%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetUtilization;
