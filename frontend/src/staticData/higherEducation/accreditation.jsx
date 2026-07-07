import React, { useMemo, useState } from "react";
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
import { accreditationData } from "./accreditation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

export default function AccreditationDashboard() {
  // Track which campus/branch is selected for the program details list
  const [selectedBranchIdx, setSelectedBranchIdx] = useState(0);
  const currentYear = useMemo(() => new Date().getFullYear(), []); // 2026

  // Data Aggregator Logic
  const processedData = useMemo(() => {
    let totalPrograms = 0;
    let expiredCount = 0;
    let ongoingCount = 0;

    const statusMap = {
      "Level III Re-Accredited": 0,
      "Level II Re-Accredited": 0,
      Accreditable: 0,
    };
    const branchLabels = [];
    const branchProgramCounts = [];

    accreditationData.forEach((branch) => {
      branchLabels.push(branch.branchName);
      branchProgramCounts.push(branch.programs.length);

      branch.programs.forEach((prog) => {
        totalPrograms++;

        let status = prog.accreditationStatus;
        if (status === "Level 3") status = "Level III Re-Accredited";
        if (status === "Level 2") status = "Level II Re-Accredited";

        if (statusMap[status] !== undefined) {
          statusMap[status]++;
        }

        if (prog.endDate) {
          const expirationYear = new Date(prog.endDate).getFullYear();
          if (expirationYear < currentYear) {
            expiredCount++;
          } else {
            ongoingCount++;
          }
        } else {
          ongoingCount++;
        }
      });
    });

    return {
      totalPrograms,
      expiredCount,
      ongoingCount,
      statusMap,
      branchLabels,
      branchProgramCounts,
    };
  }, [currentYear]);

  // Chart Setup: Status
  const doughnutData = {
    labels: ["Level III Status", "Level II Status", "Accreditable Candidates"],
    datasets: [
      {
        data: [
          processedData.statusMap["Level III Re-Accredited"],
          processedData.statusMap["Level II Re-Accredited"],
          processedData.statusMap["Accreditable"],
        ],
        backgroundColor: ["#660033", "#D4AF37", "#94A3B8"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  // Chart Setup: Capacity
  const barData = {
    labels: processedData.branchLabels,
    datasets: [
      {
        label: "Total Programs",
        data: processedData.branchProgramCounts,
        backgroundColor: "#660033",
        borderRadius: 6,
      },
    ],
  };

  // Safe reference to the active branch's programs
  const activeBranchPrograms =
    accreditationData[selectedBranchIdx]?.programs || [];

  return (
    <div className="bg-slate-50 min-h-screen p-8 text-slate-800 rounded-2xl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Grid */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Institutional Accreditation
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Overview of academic programs across all campuses
          </p>
        </div>

        {/* Dynamic Metric Rows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="relative bg-[#660033] text-white p-6 rounded-2xl shadow-[0_4px_0_0_#D4AF37] flex flex-col justify-between min-h-[120px]">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-300 block uppercase font-sans mb-1">
                Total Programs
              </span>
              <span className="text-3xl font-black text-[#D4AF37] block font-sans tracking-tight leading-none my-1">
                {processedData.totalPrograms}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-200/90 block font-sans capitalize tracking-wide mt-2 pt-2 border-t border-white/10">
              tracked courses of study
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Active Accreditations
              </span>
              <h3 className="text-3xl font-black text-slate-900 font-sans tracking-tight mt-1">
                {processedData.ongoingCount}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 tracking-wide mt-2 pt-2 border-t border-slate-100 capitalize">
              up to date or in progress
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Expired / Pending Review
              </span>
              <h3 className="text-3xl font-black text-rose-700 font-sans tracking-tight mt-1">
                {processedData.expiredCount}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-rose-500 capitalize tracking-wide mt-2 pt-2 border-t border-slate-100">
              requires immediate renewal
            </span>
          </div>
        </div>

        {/* Charts Container */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] md:col-span-2 flex flex-col justify-start">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 block mb-4">
              Breakdown by Level
            </span>
            <div className="w-full max-w-[210px] mx-auto pt-2">
              <Doughnut
                data={doughnutData}
                options={{ plugins: { legend: { display: false } } }}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#660033]" />{" "}
                  Level III
                </span>
                <span className="font-bold">
                  {processedData.statusMap["Level III Re-Accredited"]}
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />{" "}
                  Level II
                </span>
                <span className="font-bold">
                  {processedData.statusMap["Level II Re-Accredited"]}
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />{" "}
                  Candidates
                </span>
                <span className="font-bold">
                  {processedData.statusMap["Accreditable"]}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] md:col-span-3 flex flex-col justify-start">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 block mb-4">
              Programs per Campus
            </span>
            <div className="w-full h-full min-h-[220px] flex items-center">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { display: false }, ticks: { stepSize: 5 } },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* PROGRAM ACCREDITATION REGISTRY DETAIL ROWS */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden flex flex-col">
          {/* Section Heading & Interactive Tab Selection Bar */}
          <div className="p-6 pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 block">
                Program Registry
              </span>
              <h2 className="text-base font-black text-slate-900 font-sans tracking-tight mt-0.5">
                Detailed Status List
              </h2>
            </div>

            {/* Campus Selector Controls */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              {accreditationData.map((branch, idx) => (
                <button
                  key={branch._id}
                  onClick={() => setSelectedBranchIdx(idx)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedBranchIdx === idx
                      ? "bg-white text-[#660033] shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {branch.branchName}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Scrollable Grid Items */}
          <div className="p-6 max-h-[360px] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeBranchPrograms.map((prog) => {
                let normStatus = prog.accreditationStatus;
                if (normStatus === "Level 3")
                  normStatus = "Level III Re-Accredited";
                if (normStatus === "Level 2")
                  normStatus = "Level II Re-Accredited";

                const isCandidacy = normStatus === "Accreditable";
                const isExpired =
                  prog.endDate &&
                  new Date(prog.endDate).getFullYear() < currentYear;

                return (
                  <div
                    key={prog.programId}
                    className="bg-slate-50/60 border border-slate-100 p-4 rounded-xl flex items-start justify-between gap-4 min-w-0"
                  >
                    <div className="min-w-0 flex flex-col">
                      <span className="font-bold text-slate-800 tracking-wide text-xs break-words leading-normal block">
                        {prog.programName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                        Started: {prog.yearOfInitialOperation || "N/A"}
                      </span>
                    </div>

                    <div className="text-right shrink-0 pt-0.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider mb-1 ${
                          isCandidacy
                            ? "bg-slate-200 text-slate-700"
                            : isExpired
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-[#660033]/10 text-[#660033]"
                        }`}
                      >
                        {normStatus}
                      </span>

                      <span className="text-[9px] text-slate-400 block tracking-tight font-mono whitespace-nowrap mt-1">
                        {isCandidacy
                          ? "Candidacy Valid"
                          : isExpired
                            ? "Review Overdue"
                            : `Expires ${prog.endDate ? new Date(prog.endDate).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : ""}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
