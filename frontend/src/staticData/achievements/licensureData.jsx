import { useEffect, useState } from "react";
import axios from "axios";

export default function LicensureData() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLicensureData = async () => {
      try {
        setLoading(true);
        
        // 💡 Grab the token from localStorage to satisfy the backend's protect middleware
        const token = localStorage.getItem("token");

        const response = await axios.get("http://localhost:5000/api/v1/licensure-performance", {
          withCredentials: true, // Ensures session cookies pass securely if used
          headers: {
            Authorization: `Bearer ${token}` // 💡 Inject bearer authentication token manually
          }
        });

        // The endpoint sorts by year descending, so take the most recent record array entry
        if (response.data.success && response.data.data.length > 0) {
          setRecord(response.data.data[0]);
        }
      } catch (err) {
        console.error("Error loading board metrics:", err);
        setError(err.response?.data?.error || "Failed to stream live board data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLicensureData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#660033] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase animate-pulse">Syncing matrix...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-100 flex items-center justify-center min-h-[300px]">
        <p className="text-sm font-medium text-rose-500 bg-rose-50/50 px-4 py-2 rounded-lg border border-rose-100/60">
          ⚠️ {error || "No official licensure metrics available for this profile."}
        </p>
      </div>
    );
  }

  // Formatting helper to dynamically append operational sign prefixes
  const formatVariance = (val) => {
    if (val > 0) return `+${val.toFixed(2)}%`;
    if (val < 0) return `${val.toFixed(2)}%`;
    return "0.00%";
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[11px] uppercase tracking-widest text-[#660033] font-bold block">
            Higher Education Program Milestone ({record.rankingYear})
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
            Performance in the Licensure Examination
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed font-sans">
            Percentage of first-time licensure exam-takers that pass the institutional board exams.
            <span className="text-[#660033] block mt-1 font-bold font-sans text-xs uppercase tracking-wider">
              Institutional Context Metrics: {record.institutionalContext?.totalPassedVerified} out of {record.institutionalContext?.totalCandidatesVerified} first-time candidates verified passed.
            </span>
          </p>
        </div>

        {/* Variance Matrix Grid Layout */}
        <div className="grid grid-cols-3 gap-1 bg-[#660033] p-1 rounded-xl shrink-0 shadow-sm border border-[#660033]">
          <div className="text-center px-5 py-3 bg-[#660033] text-white rounded-lg">
            <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-widest">
              Target
            </span>
            <span className="text-xl font-bold text-white tracking-tight">
              {record.summaryKpis?.target?.toFixed(2)}%
            </span>
          </div>
          <div className="text-center px-5 py-3 bg-[#5c002e] text-white rounded-lg border-x border-white/5">
            <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-widest">
              Actual
            </span>
            <span className="text-xl font-bold text-[#FFD700] tracking-tight">
              {record.summaryKpis?.actual?.toFixed(2)}%
            </span>
          </div>
          <div className="text-center px-5 py-3 bg-[#660033] text-white rounded-lg">
            <span className={`block text-[10px] font-bold uppercase tracking-widest ${record.summaryKpis?.variance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              Variance
            </span>
            <span className={`text-xl font-black tracking-tight ${record.summaryKpis?.variance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatVariance(record.summaryKpis?.variance)}
            </span>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Integrated Program Registry List */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold text-[#660033] uppercase tracking-widest">
            Program Registry Breakdown
          </h3>
          <p className="text-xs text-slate-400 tracking-wide">
            Live accredited course metrics for systemic internal audits
          </p>
        </div>

        {/* Responsive Double Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto no-scrollbar pr-1">
          {record.programs?.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50/60 border border-slate-100 text-xs transition-all duration-200 hover:border-[#D4AF37]/40 hover:bg-white hover:shadow-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  {item.programName}
                </span>
                <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                  {item.passedCandidates} / {item.totalCandidates} Candidates Passed
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`font-black text-base tracking-tight ${
                    item.percentage >= 75
                      ? "text-emerald-600"
                      : item.percentage >= 50
                        ? "text-amber-500"
                        : "text-rose-500"
                  }`}
                >
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}