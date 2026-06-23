import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { boardExam } from "./boardExam.js";

// Register Filler for the premium subtle background glow on the rate line
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function BoardExam() {
  const dynamicSummary = boardExam?.summary || [];
  const labels = dynamicSummary.map((item) => String(item.Year));

  const performanceDelta =
    dynamicSummary.length >= 2
      ? (
          (dynamicSummary[dynamicSummary.length - 1]["Passing Rate"] -
            dynamicSummary[dynamicSummary.length - 2]["Passing Rate"]) *
          100
        ).toFixed(1)
      : "0.0";

  // ==========================================
  // PANEL 1: PASSING EFFICIENCY RATE (LINE/AREA)
  // ==========================================
  const rateChartData = {
    labels,
    datasets: [
      {
        type: "line",
        label: "Passing Efficiency Rate",
        data: dynamicSummary.map((item) =>
          Number((item["Passing Rate"] * 100).toFixed(1)),
        ),
        borderColor: "#D4AF37", // 10% Accent Gold
        borderWidth: 3,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#D4AF37",
        pointHoverRadius: 6,
        fill: true,
        backgroundColor: "rgba(212, 175, 55, 0.06)", // Soft Gold Under-glow
        tension: 0.2,
      },
    ],
  };

  const rateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { display: false }, // Hidden to merge seamlessly into the panel below
      },
      y: {
        type: "linear",
        position: "left", // Left aligned to lock bounds with the volume chart
        min: 0,
        max: 100,
        grid: { color: "#f8fafc" },
        ticks: {
          color: "#94a3b8",
          font: { family: "monospace", size: 10, weight: "bold" },
          callback: (value) => `${value}%`,
          stepSize: 25,
        },
      },
    },
  };

  // ==========================================
  // PANEL 2: CANDIDATE VOLUMETRICS (BAR)
  // ==========================================
  const volumeChartData = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "1st Time Passers",
        data: dynamicSummary.map(
          (item) => item["Number of 1st Time Passers"] || 0,
        ),
        backgroundColor: "#660033", // 30% Secondary Core Maroon
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        type: "bar",
        label: "1st Time Takers",
        data: dynamicSummary.map(
          (item) => item["Number of 1st Time Takers"] || 0,
        ),
        backgroundColor: "rgba(15, 23, 42, 0.08)", // 60% System Slate Neutral
        borderColor: "rgba(15, 23, 42, 0.12)",
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const volumeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 6,
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) =>
            ` ${context.dataset.label}: ${context.raw.toLocaleString()} Candidates`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#475569",
          font: { family: "Oswald, sans-serif", size: 11, weight: "bold" },
        },
      },
      y: {
        type: "linear",
        position: "left",
        max: 500,
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#94a3b8",
          font: { family: "monospace", size: 10, weight: "bold" },
          stepSize: 100,
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_30px_60px_-15px_rgba(15,23,42,0.02)] border border-slate-100 flex flex-col gap-6 font-oswald animate-fade-in">
      {/* HEADER MATRIX BLOCK */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-widest text-[#660033] font-bold block">
            Institutional Growth Parameters
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
            Board Examination Performance Metrics
          </h2>
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
            Synchronized analysis of passing efficiency vector relative to
            cohort scale
          </p>
        </div>

        {/* GROWTH KPI FLAG */}
        <div className="bg-[#660033] text-white px-5 py-3 rounded-xl flex items-center gap-4 border-b-4 border-[#D4AF37] self-start lg:self-center shrink-0">
          <div className="flex items-center justify-center bg-white/10 w-10 h-10 rounded-lg text-sm font-bold text-[#D4AF37] shadow-inner">
            {Number(performanceDelta) >= 0 ? "▲" : "▼"}
          </div>
          <div>
            <span className="block text-2xl font-black text-[#D4AF37] leading-none tracking-tight">
              {Number(performanceDelta) >= 0 ? "+" : ""}
              {performanceDelta}%
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-slate-200 mt-1 font-sans font-semibold">
              Passing Rate Delta YoY
            </span>
          </div>
        </div>
      </div>

      {/* CHART LEGEND CONTAINER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs font-bold uppercase tracking-wide">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300" />
            <span className="text-slate-700">1st Time Takers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#660033]" />
            <span className="text-slate-700">1st Time Passers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-4 bg-[#D4AF37] relative flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white border border-[#D4AF37] absolute" />
            </span>
            <span className="text-slate-700 ml-1">
              Passing Efficiency Rate (%)
            </span>
          </div>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">
          Synchronized Panel Matrix
        </span>
      </div>

      {/* VIEWPORT CONTROLLER (STACKED SYNCHRONIZED LAYOUT) */}
      <div className="overflow-x-auto no-scrollbar pt-2">
        <div className="min-w-[700px] flex flex-col gap-4">
          {/* Top Panel: Efficiency Spark-Area */}
          <div className="relative h-[130px]">
            <div className="absolute top-0 left-12 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider bg-white pr-2 z-10">
              Metric Vector // Efficiency Index
            </div>
            <Chart type="line" data={rateChartData} options={rateOptions} />
          </div>

          {/* Bottom Panel: Volume Breakdown */}
          <div className="relative h-[210px] border-t border-dashed border-slate-100 pt-2">
            <div className="absolute top-2 left-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white pr-2 z-10">
              Volume Stream // Candidate Counts
            </div>
            <Chart type="bar" data={volumeChartData} options={volumeOptions} />
          </div>
        </div>
      </div>

      {/* DATA FOOTER STATUS TRACK */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 tracking-wider uppercase font-bold">
        <span>
          Information Stream: Office of Vice President for Academic Affairs
        </span>
        <span className="text-[#660033] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>{" "}
          Verified Academic Board Audit
        </span>
      </div>
    </div>
  );
}
