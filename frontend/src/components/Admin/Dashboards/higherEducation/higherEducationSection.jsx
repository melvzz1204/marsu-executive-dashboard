// components/AccreditationDashboard.jsx
import { useMemo, useState, useEffect } from "react";
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

const ChevronDownIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
    <path
      d="m6 8 4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function AccreditationDashboard() {
  const [stats, setStats] = useState(null);
  const [accreditationData, setAccreditationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedBranchIdx, setSelectedBranchIdx] = useState(0);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Fetch Stats and Programs from Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, programsRes] = await Promise.all([
          api.get("/higher-education/stats"),
          api.get("/higher-education/programs?limit=1000"),
        ]);

        setStats(statsRes.data.data);

        const flatPrograms = programsRes.data.data || [];

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
            reviewStatus: curr.reviewStatus,
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

    fetchData();
  }, []);

  // Dynamic status options for the filter dropdown
  const availableStatuses = useMemo(() => {
    const statuses = new Set();
    accreditationData.forEach((branch) => {
      branch.programs?.forEach((prog) => {
        if (prog.accreditationStatus) {
          statuses.add(prog.accreditationStatus);
        }
      });
    });
    return Array.from(statuses);
  }, [accreditationData]);

  // Chart Setup: Status Breakdown (Doughnut)
  const doughnutData = useMemo(() => {
    const breakdown = stats?.accreditationBreakdown || [];
    const labels = breakdown.map((item) => item.level);
    const data = breakdown.map((item) => item.count);

    return {
      labels: labels.length > 0 ? labels : ["No Data"],
      datasets: [
        {
          data: data.length > 0 ? data : [1],
          backgroundColor: [
            "#660033",
            "#D4AF37",
            "#94A3B8",
            "#334155",
            "#cbd5e1",
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    };
  }, [stats]);

  // Chart Setup: Programs per Campus (Bar)
  const barData = useMemo(() => {
    const breakdown = stats?.campusBreakdown || [];
    return {
      labels: breakdown.map((item) => item.campus),
      datasets: [
        {
          label: "Total Programs",
          data: breakdown.map((item) => item.count),
          backgroundColor: "#660033",
          borderRadius: 6,
        },
      ],
    };
  }, [stats]);

  // Filter programs by selected Accreditation Level
  const filteredBranchPrograms = useMemo(() => {
    const activeBranchPrograms =
      accreditationData[selectedBranchIdx]?.programs || [];

    if (selectedStatusFilter === "ALL") return activeBranchPrograms;

    return activeBranchPrograms.filter(
      (prog) => prog.accreditationStatus === selectedStatusFilter,
    );
  }, [accreditationData, selectedBranchIdx, selectedStatusFilter]);

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
          className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const kpis = stats?.kpis || {};

  return (
    <div className="min-h-screen rounded-2xl bg-white p-4 font-sans text-slate-800 sm:p-6 lg:p-8">
      <div className="space-y-6">
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
                {kpis.totalPrograms || 0}
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
                {kpis.activeAccreditations || 0}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 tracking-wide mt-2 pt-2 border-t border-slate-100 uppercase">
              up to date or in progress
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sans block mb-1">
                Expired / Pending Review
              </span>
              <h3 className="text-3xl font-black text-rose-700 font-sans tracking-tight mt-1">
                {kpis.expiredOrPending || 0}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wide mt-2 pt-2 border-t border-slate-100">
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
              {(stats?.accreditationBreakdown || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-xs font-medium text-slate-600"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          doughnutData.datasets[0].backgroundColor[
                            idx %
                              doughnutData.datasets[0].backgroundColor.length
                          ],
                      }}
                    />{" "}
                    {item.level}
                  </span>
                  <span className="font-bold">{item.count}</span>
                </div>
              ))}
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
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#660033]">
                  Program Registry
                </span>
                <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">
                  Detailed accreditation status
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Choose a campus and narrow the list by accreditation level.
                </p>
              </div>

              <label className="block w-full lg:w-60">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Accreditation level
                </span>
                <span className="relative block">
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#660033] focus:ring-2 focus:ring-[#660033]/10"
                  >
                    <option value="ALL">All accreditation levels</option>
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <ChevronDownIcon />
                  </span>
                </span>
              </label>
            </div>

            {accreditationData.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Campus
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {accreditationData[selectedBranchIdx]?.programs.length || 0}{" "}
                    programs
                  </span>
                </div>
                <div
                  className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1.5"
                  role="tablist"
                  aria-label="Select campus"
                >
                  {accreditationData.map((branch, idx) => (
                    <button
                      key={branch.branchName}
                      type="button"
                      role="tab"
                      aria-selected={selectedBranchIdx === idx}
                      onClick={() => setSelectedBranchIdx(idx)}
                      className={`h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#660033]/25 ${
                        selectedBranchIdx === idx
                          ? "bg-[#660033] text-white shadow-sm"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
                      }`}
                    >
                      {branch.branchName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Scrollable Grid Items */}
          <div className="no-scrollbar max-h-[360px] overflow-y-auto p-4 sm:p-6">
            {filteredBranchPrograms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredBranchPrograms.map((prog, idx) => {
                  const status = prog.accreditationStatus || "Not Accredited";
                  const isExpired = prog.reviewStatus === "Review Overdue";

                  return (
                    <div
                      key={prog.programId || idx}
                      className="flex min-w-0 items-start justify-between gap-4 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3.5 transition-colors hover:border-slate-300 hover:bg-white"
                    >
                      <div className="min-w-0 flex flex-col">
                        <span className="block break-words text-[13px] font-semibold leading-snug text-slate-800">
                          {prog.programName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                          Started: {prog.yearOfInitialOperation || "N/A"}
                        </span>
                      </div>

                      <div className="text-right shrink-0 pt-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider mb-1 ${
                            isExpired
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-[#660033]/10 text-[#660033]"
                          }`}
                        >
                          {status}
                        </span>

                        <span className="text-[9px] text-slate-400 block tracking-tight font-mono whitespace-nowrap mt-1">
                          {isExpired
                            ? "Review Overdue"
                            : prog.endDate
                              ? `Expires ${new Date(
                                  prog.endDate,
                                ).toLocaleDateString(undefined, {
                                  month: "short",
                                  year: "numeric",
                                })}`
                              : "N/A"}
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
