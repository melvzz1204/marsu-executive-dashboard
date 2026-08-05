import React, { useMemo, useState, useEffect } from "react";
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

import api from "../../../../api/axios";

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
  const [accreditationData, setAccreditationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedBranchIdx, setSelectedBranchIdx] = useState(0);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Fetch and Transform Data using Axios
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/higher-education/programs?limit=1000");
        const json = response.data;
        const flatPrograms = json.data || [];

        const groupedByCampus = flatPrograms.reduce((acc, curr) => {
          const branch = curr.campusBranch || "Unknown Campus";

          if (!acc[branch]) {
            acc[branch] = { branchName: branch, programs: [] };
          }

          acc[branch].programs.push({
            programId: curr._id,
            programName: curr.programName,
            accreditationStatus: curr.accreditationStatus,
            endDate: curr.endDate,
            yearOfInitialOperation: curr.yearInitialOperation,
          });

          return acc;
        }, {});

        const formattedData = Object.values(groupedByCampus).sort((a, b) =>
          a.branchName.localeCompare(b.branchName),
        );

        setAccreditationData(formattedData);
      } catch (err) {
        console.error("Error fetching higher ed data:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to connect to the server";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

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

    if (accreditationData && accreditationData.length > 0) {
      accreditationData.forEach((branch) => {
        branchLabels.push(branch.branchName);
        branchProgramCounts.push(branch.programs?.length || 0);

        if (branch.programs) {
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
        }
      });
    }

    return {
      totalPrograms,
      expiredCount,
      ongoingCount,
      statusMap,
      branchLabels,
      branchProgramCounts,
    };
  }, [accreditationData, currentYear]);

  // Dynamic status options for the filter dropdown
  const availableStatuses = useMemo(() => {
    const statuses = new Set();
    accreditationData.forEach((branch) => {
      branch.programs?.forEach((prog) => {
        let normStatus = prog.accreditationStatus || "Not Accredited";
        if (normStatus === "Level 3") normStatus = "Level III Re-Accredited";
        if (normStatus === "Level 2") normStatus = "Level II Re-Accredited";
        statuses.add(normStatus);
      });
    });
    return Array.from(statuses);
  }, [accreditationData]);

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

  const activeBranchPrograms =
    accreditationData[selectedBranchIdx]?.programs || [];

  // Filter programs by selected Accreditation Level
  const filteredBranchPrograms = useMemo(() => {
    if (selectedStatusFilter === "ALL") return activeBranchPrograms;

    return activeBranchPrograms.filter((prog) => {
      let normStatus = prog.accreditationStatus || "Not Accredited";
      if (normStatus === "Level 3") normStatus = "Level III Re-Accredited";
      if (normStatus === "Level 2") normStatus = "Level II Re-Accredited";

      return normStatus === selectedStatusFilter;
    });
  }, [activeBranchPrograms, selectedStatusFilter]);

  // Loading State UI
  if (loading) {
    return (
      <div className="bg-slate-50 min-h-[600px] flex flex-col items-center justify-center p-8 text-slate-800 rounded-2xl animate-pulse">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-[#660033] rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
          Synchronizing Accreditation Data...
        </p>
      </div>
    );
  }

  // Error State UI
  if (error) {
    return (
      <div className="bg-rose-50 min-h-[600px] flex flex-col items-center justify-center p-8 text-rose-800 rounded-2xl border border-rose-200">
        <span className="text-4xl mb-4">⚠️</span>
        <h3 className="text-lg font-bold tracking-tight mb-2">
          Connection Error
        </h3>
        <p className="text-sm text-rose-600/80 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-8 text-slate-800 rounded-2xl font-sans">
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
          <div className="p-6 pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400 block">
                Program Registry
              </span>
              <h2 className="text-base font-black text-slate-900 font-sans tracking-tight mt-0.5">
                Detailed Status List
              </h2>
            </div>

            {/* Controls Layer: Level Filter Dropdown + Campus Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Accreditation Level Selector Dropdown */}
              <div className="relative">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  aria-label="Filter by accreditation level"
                  className="w-full sm:w-auto appearance-none bg-slate-100/80 hover:bg-slate-200/60 text-slate-700 text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#660033]/20 cursor-pointer transition-all"
                >
                  <option value="ALL">All Accreditation Levels</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500 text-[10px]">
                  ▼
                </div>
              </div>

              {/* Campus Selector Tabs */}
              {accreditationData.length > 0 && (
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
                  {accreditationData.map((branch, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedBranchIdx(idx)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        selectedBranchIdx === idx
                          ? "bg-white text-[#660033] shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {branch.branchName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Scrollable Grid Items */}
          <div className="p-6 max-h-[360px] overflow-y-auto no-scrollbar">
            {filteredBranchPrograms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredBranchPrograms.map((prog, idx) => {
                  let normStatus = prog.accreditationStatus || "Not Accredited";
                  if (normStatus === "Level 3")
                    normStatus = "Level III Re-Accredited";
                  if (normStatus === "Level 2")
                    normStatus = "Level II Re-Accredited";

                  const isCandidacy =
                    normStatus === "Accreditable" ||
                    normStatus === "Candidate Status";
                  const isExpired =
                    prog.endDate &&
                    new Date(prog.endDate).getFullYear() < currentYear;

                  return (
                    <div
                      key={prog.programId || idx}
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
                              : `Expires ${
                                  prog.endDate
                                    ? new Date(prog.endDate).toLocaleDateString(
                                        undefined,
                                        { month: "short", year: "numeric" },
                                      )
                                    : "N/A"
                                }`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <span className="text-2xl mb-1">🔍</span>
                <p className="text-xs font-bold text-slate-600">
                  No programs found
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  There are no programs matching "{selectedStatusFilter}" for
                  this campus.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
