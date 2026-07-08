import { GLOBAL_RANKINGS } from "./impactRankings.js";
import higherEdu from "../../assets/higher-education.png";
import wuriLogo from "../../assets/wuri-logo.png";

export default function impactRankings() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {GLOBAL_RANKINGS.map((ranking) => (
        <div
          key={ranking.id}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_30px_60px_-15px_rgba(102,0,51,0.05)] hover:border-slate-200"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-6">
              {/* High-Emphasis Branding Block */}
              <div className="flex flex-col gap-3 justify-center">
                <span className="text-[10px] uppercase tracking-widest text-[#660033] font-bold block">
                  Global Recognition Matrix
                </span>

                {/* High-impact Transparent Logo Slot */}
                <div className="h-16 md:h-20 max-w-[240px] flex items-center justify-start overflow-hidden mix-blend-multiply">
                  <img
                    src={ranking.type === "THE" ? higherEdu : wuriLogo}
                    alt="Global Ranking Authority Logo"
                    className="h-full w-auto object-contain object-left filter contrast-125"
                  />
                </div>

                <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1">
                  {ranking.edition}
                </p>
              </div>

              {/* 30% Structural Accent Premium Pill */}
              <div className="bg-[#660033] text-white px-6 py-4 rounded-xl text-center sm:text-right shrink-0 min-w-[145px] border-b-4 border-[#D4AF37] self-start sm:self-center">
                <span className="block text-[9px] uppercase tracking-widest text-slate-300 font-bold">
                  Overall Status
                </span>
                <span className="text-3xl font-black text-[#FFD700] leading-none block mt-1 tracking-tight">
                  {ranking.overallRank}
                </span>
                <span className="text-[10px] font-medium text-slate-200 block mt-1 truncate max-w-[140px] opacity-90">
                  {ranking.overallTotal}
                </span>
              </div>
            </div>

            {/* Sub-metrics Performance Grids */}
            {ranking.type === "THE" ? (
              /* Times Higher Education Grid Layout */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[240px] overflow-y-auto no-scrollbar pr-1">
                {ranking.sdgMetrics.map((metric, i) => (
                  <div
                    key={i}
                    className="bg-slate-50/60 border border-slate-100 p-3 rounded-xl flex items-start justify-between gap-3 min-w-0 transition-colors hover:bg-slate-50"
                  >
                    <span className="font-bold text-slate-700 tracking-wide text-xs break-words leading-normal block">
                      {" "}
                      {metric.sdg}
                    </span>
                    <div className="text-right shrink-0 pt-0.5">
                      <span className="font-black text-[#660033] block text-sm uppercase tracking-tight leading-none">
                        RANK {metric.rank}
                      </span>
                      <span className="text-[9px] text-slate-400 block uppercase tracking-wider mt-1.5 leading-none">
                        out of {metric.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* WURI Rankings Metric Cards */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ranking.categories.map((cat, i) => (
                  <div
                    key={i}
                    className="bg-slate-50/60 border border-slate-100 p-4 rounded-xl flex flex-col justify-between text-center transition-all duration-300 hover:border-[#D4AF37]/40 hover:bg-white hover:shadow-sm"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      {cat.tier}
                    </span>
                    <span className="text-2xl font-black text-[#660033] my-2.5 block tracking-tight uppercase">
                      RANK {cat.rank}
                    </span>
                    <span className="text-xs font-bold text-slate-800 leading-snug uppercase tracking-wide">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification Live Strip Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] tracking-wider text-slate-400 uppercase font-bold">
            <span>
              Source Ref:{" "}
              {ranking.type === "THE"
                ? "THE Impact Data Desk"
                : "WURI Innovation Registry"}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
              Certified Official
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
