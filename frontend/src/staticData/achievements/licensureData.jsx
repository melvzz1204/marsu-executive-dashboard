import { LICENSURE_DATA } from "./licensureData.js";

export default function licensureData() {
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[11px] uppercase tracking-widest text-[#660033] font-bold block">
            Higher Education Program Milestone
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
            Performance in the Licensure Examination
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed font-sans">
            Percentage of first-time licensure exam-takers that pass the
            institutional board exams.
            <span className="text-[#660033] block mt-1 font-bold font-oswald text-xs uppercase tracking-wider">
              Institutional Context Metrics: 167 out of 229 first-time
              candidates verified passed.
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
              64.00%
            </span>
          </div>
          <div className="text-center px-5 py-3 bg-[#5c002e] text-white rounded-lg border-x border-white/5">
            <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-widest">
              Actual
            </span>
            <span className="text-xl font-bold text-[#FFD700] tracking-tight">
              72.93%
            </span>
          </div>
          <div className="text-center px-5 py-3 bg-[#660033] text-white rounded-lg">
            <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              Variance
            </span>
            <span className="text-xl font-black text-emerald-400 tracking-tight">
              +8.93%
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto no-scrollbar pr-1">
        {LICENSURE_DATA.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-50/60 border border-slate-100 text-xs transition-all duration-200 hover:border-[#D4AF37]/40 hover:bg-white hover:shadow-sm"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                {item.program}
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                {item.passed} / {item.takers} Candidates Passed
              </span>
            </div>
            <div className="text-right">
              <span
                className={`font-black text-base tracking-tight ${
                  item.rate >= 75
                    ? "text-emerald-600"
                    : item.rate >= 50
                      ? "text-amber-500"
                      : "text-rose-500"
                }`}
              >
                {item.rate}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
