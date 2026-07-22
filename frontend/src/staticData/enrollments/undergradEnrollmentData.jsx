import "./enrollmentData.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  CAMPUS_ENROLLMENT_DATA,
  ENROLLMENT_GROWTH_KPI,
} from "./enrollmentData";

// Register Core Chart.js Components and Engines
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function UndergradEnrollment() {
  // Extract and format labels and datasets dynamically from raw file data array
  const labels = CAMPUS_ENROLLMENT_DATA.map((row) => row.semester);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Main Campus",
        data: CAMPUS_ENROLLMENT_DATA.map((row) => row.main || 0),
        backgroundColor: "#660033", // Executive MarSU Maroon
        borderRadius: {
          topLeft: 0,
          topRight: 0,
          bottomLeft: 0,
          bottomRight: 0,
        },
      },
      {
        label: "Sta. Cruz",
        data: CAMPUS_ENROLLMENT_DATA.map((row) => row.stacruz || 0),
        backgroundColor: "#0284c7", // Sky-600 Blue
      },
      {
        label: "Torrijos",
        data: CAMPUS_ENROLLMENT_DATA.map((row) => row.torrijos || 0),
        backgroundColor: "#16a34a", // Emerald-600 Green
      },
      {
        label: "Gasan",
        data: CAMPUS_ENROLLMENT_DATA.map((row) => row.gasan || 0),
        backgroundColor: "#b45309", // Amber-700
        // Apply smooth rounding cap only to top dataset block in stack context
        borderRadius: {
          topLeft: 6,
          topRight: 6,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
      },
    ],
  };

  // Configure Chart Interactions and Strict Axis Caps
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hidden because your beautiful custom layout legend row handles this!
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)", // Slate-900 Context Look
        titleFont: { family: "Oswald, sans-serif", size: 12 },
        bodyFont: { family: "monospace", size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) =>
            ` ${context.dataset.label}: ${context.raw.toLocaleString()}`,
          footer: (tooltipItems) => {
            const sum = tooltipItems.reduce((a, b) => a + b.parsed.y, 0);
            return `TOTAL AUDIT: ${sum.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          color: "#64748b", // Slate-500
          font: { family: "Oswald, sans-serif", size: 10, weight: "bold" },
        },
      },
      y: {
        stacked: true,
        max: 10000, // Explicitly locks axis scale ceiling capacity
        grid: {
          color: "#f1f5f9", // Slate-100 dashed gridlines
        },
        ticks: {
          color: "#94a3b8", // Slate-400
          font: { family: "monospace", size: 10, weight: "bold" },
          stepSize: 2500,
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col gap-6 font-oswald animate-fade-in">
      {/* EXECUTIVE HEADER BLOCK */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-widest text-[#660033] font-bold block">
            Institutional Growth Parameters
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
            Higher Education Program Enrollment
          </h2>
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
            Undergraduate registration distribution metrics per semester branch
            audit
          </p>
        </div>

        {/* GROWTH KPI BANNER FLAG */}
        <div className="bg-[#660033] text-white px-5 py-3 rounded-xl flex items-center gap-4 border-b-4 border-[#D4AF37] self-start lg:self-center shrink-0">
          <div className="flex items-center justify-center bg-white/10 w-10 h-10 rounded-lg text-lg font-bold text-emerald-400 shadow-inner">
            ▲
          </div>
          <div>
            <span className="block text-2xl font-black text-emerald-400 leading-none tracking-tight">
              +{ENROLLMENT_GROWTH_KPI?.percentage || "0.00%"}
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-slate-200 mt-1 font-sans font-semibold">
              Growth vs 1st Sem AY 2024-25
            </span>
          </div>
        </div>
      </div>

      {/* DATA IDENTIFIER LEGEND ROW */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs font-bold uppercase tracking-wide">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#660033]" />
            <span className="text-slate-700">Main Campus</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-sky-600" />
            <span className="text-slate-700">Sta. Cruz</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-600" />
            <span className="text-slate-700">Torrijos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-amber-700" />
            <span className="text-slate-700">Gasan</span>
          </div>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">
          Axis Limit: 10,000 Cap
        </span>
      </div>

      {/* CHART.JS CANVAS VIEWPORT FRAME CONTAINER */}
      <div className="overflow-x-auto no-scrollbar pt-2">
        <div className="min-w-[700px] h-[340px] relative">
          <Bar data={chartData} options={options} />
        </div>
      </div>

      {/* RECOGNITION CERTIFICATE REFERENCE BLOCK */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 tracking-wider uppercase font-bold">
        <span>Information Stream: Office of the Institutional Registrar</span>
        <span className="text-emerald-600 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
          Verified Enrollment Audit
        </span>
      </div>
    </div>
  );
}
