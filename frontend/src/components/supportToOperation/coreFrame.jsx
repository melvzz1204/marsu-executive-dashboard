import coreFrameData from "./coreFrame.js";
export default function CoreFrame() {
  return (
    <div className="w-full p-8 rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)] min-h-[160px] flex flex-col justify-between gap-6">
      {/* Top Metadata Header Rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-black uppercase  text-[#660033] block">
            {coreFrameData.title}
          </span>
        </div>

        <p className="text-sm font-medium leading-relaxed max-w-3xl font-sans ">
          {coreFrameData.description}
        </p>
      </div>
      {/* 2. UI/UX Multi-Column Metric Tracker (Matching your Dashboard Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 ">
        {coreFrameData.metrics.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-50/50 border border-slate-100/70 flex flex-col justify-between gap-2 transition-all hover:border-slate-200"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {item.label}
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xl font-black text-slate-900 font-sans tracking-tight">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
