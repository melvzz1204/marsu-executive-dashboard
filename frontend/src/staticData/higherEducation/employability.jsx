// components/EmployabilityMetrics.jsx
import React, { useMemo } from "react";
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
} from "chart.js";
import { Chart } from "react-chartjs-2";
import employability from "./employability.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
);

export default function EmployabilityMetrics({ isDarkMode = false }) {
  const coreData = employability[0];
  const trendData = coreData?.trend_analysis_data || [];

  // Chart configuration with premium color distributions
  const chartData = useMemo(() => {
    const labels = trendData.map((d) => `CY ${d.year}`);
    const graduates = trendData.map((d) => d.graduate_count);
    const rates = trendData.map((d) => parseFloat(d.employability_rate));

    return {
      labels,
      datasets: [
        {
          type: "line",
          label: "Employability Rate",
          data: rates,
          borderColor: "#D4AF37", // 10% Accent Jewel (Champagne Gold)
          backgroundColor: "#D4AF37",
          borderWidth: 3,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#D4AF37",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.25,
          yAxisID: "yPercentage",
        },
        {
          type: "bar",
          label: "Total Graduate Output",
          data: graduates,
          backgroundColor: isDarkMode ? "#500014" : "#600018", // 30% Secondary Character (Maroon)
          hoverBackgroundColor: isDarkMode ? "#600018" : "#7A001E",
          borderRadius: 12, // Premium soft architecture radius
          barThickness: 32,
          yAxisID: "yCount",
        },
      ],
    };
  }, [trendData, isDarkMode]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          color: isDarkMode ? "#94a3b8" : "#475569",
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 11, family: "Inter, sans-serif", weight: "600" },
        },
      },
      tooltip: {
        padding: 12,
        backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
        titleColor: isDarkMode ? "#ffffff" : "#0f172a",
        bodyColor: isDarkMode ? "#94a3b8" : "#475569",
        borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        borderWidth: 1,
        titleFont: { size: 12, weight: "700" },
        bodyFont: { size: 12 },
        cornerStyle: "round",
        borderRadius: 8,
        callbacks: {
          label: (context) =>
            context.dataset.type === "line"
              ? ` Placement Rate: ${context.raw}%`
              : ` Confirmed Cohort: ${context.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: isDarkMode ? "#64748b" : "#94a3b8",
        },
      },
      yCount: {
        type: "linear",
        position: "left",
        grid: { display: false },
        ticks: {
          color: isDarkMode ? "#64748b" : "#94a3b8",
          font: { size: 11 },
        },
      },
      yPercentage: {
        type: "linear",
        position: "right",
        min: 0,
        max: 100,
        grid: {
          color: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          drawTicks: false,
        },
        ticks: {
          color: isDarkMode ? "#64748b" : "#94a3b8",
          font: { size: 11 },
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <div
      className={`p-8 rounded-2xl transition-all duration-500 ${
        isDarkMode
          ? "bg-slate-900/60 border-slate-800/80 text-white backdrop-blur-xl"
          : "bg-white border-slate-200/50 text-slate-900"
      }`}
    >
      {/* 1. Header Hero Segment */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-slate-100 dark:border-slate-800/60">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase  text-[#D4AF37]">
              Tracer Study Matrix
            </span>
          </div>
          <h3 className="text-2xl font-black font-sans tracking-tight uppercase max-w-lg leading-tight">
            {coreData?.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {coreData?.description?.summary}
          </p>
        </div>

        {/* 10% Accent Callout Hero Block */}
        {/* 10% Accent Callout Hero Block */}
        <div
          className={`flex items-center gap-5 p-5 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-[#660033] border-[#660033] shadow-[0_4px_0_0_#D4AF37]"
              : "bg-[#660033] border-[#660033] shadow-[0_4px_0_0_#D4AF37]"
          }`}
        >
          <div>
            <span className="text-[9px] font-bold text-slate-300 block uppercase tracking-widest mb-1">
              Cumulative Metric
            </span>
            <span
              className={`text-4xl font-black block tracking-tighter font-sans ${
                isDarkMode ? "text-[#D4AF37]" : "text-[#FFD700]"
              }`}
            >
              {coreData?.highlighted_rate}
            </span>
          </div>

          <div className="h-10 w-[1px] bg-white/20" />

          <p className="text-[10px] max-w-[150px] text-slate-200 font-medium leading-normal">
            Institutional performance benchmark across multi-year cycles.
          </p>
        </div>
      </div>

      {/* 2. Visual Split Grid (Data Matrix left, Chart Canvas right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pt-8">
        {/* Left Side: Premium Row Minimalist Breakdown Cards */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-800 block ">
              Chronological Performance
            </span>
            <div className="space-y-2.5">
              {trendData.map((row) => (
                <div
                  key={row.year}
                  className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    isDarkMode
                      ? "bg-slate-950/20 border-slate-800/40 hover:border-slate-800 hover:bg-slate-950/40"
                      : "bg-slate-50/40 border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block text-[#600018] ">
                      Class of {row.year}
                    </span>
                    <span className="text-[12px]  text-slate-800 block">
                      {row.graduate_count.toLocaleString()} Registered Degrees
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#600018] dark:text-slate-800 ">
                    {row.employability_rate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border text-[9px] leading-relaxed text-slate-400 ${
              isDarkMode
                ? "bg-slate-950/10 border-slate-800/30"
                : "bg-slate-50/20 border-slate-100"
            }`}
          >
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase block mb-0.5">
              Context Data Frame:
            </span>
            {coreData?.description?.context}
          </div>
        </div>

        {/* Right Side: Dual Axis Canvas Engine */}
        <div className="lg:col-span-3 min-h-[300px] flex items-center p-2">
          <div className="w-full h-full relative">
            <Chart type="bar" data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
