const KPICard = ({
  title,
  value,
  change,
  isPositive,
  metricContext,
  icon: Icon,
  colorClass,
}) => {
  return (
    /* 🎯 REFACTORED CONTAINER: Completely borderless frame matching the core dashboard shadow layout */
    <div className="bg-white p-6 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.03)] hover:shadow-[0_24px_60px_-10px_rgba(0,0,0,0.06)] relative overflow-hidden group transition-all duration-500 ease-out border border-slate-100/40">
      {/* Subtle brand glow orbs matching your Burgundy/Gold canvas specs */}
      <div
        className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.06] transition-opacity duration-700 ease-out ${colorClass}`}
      />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="space-y-2">
          {/* Muted Slate Metric Category Title */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {title}
          </p>

          <div className="flex items-baseline gap-1.5">
            {/* Elegant, clean data tracking figures */}
            <span className="text-3xl font-light text-slate-900 tracking-tight">
              {value}
            </span>
            <span className="text-xs font-normal text-slate-400 capitalize">
              {metricContext}
            </span>
          </div>

          {/* Minimalist Performance Badging */}
          <div className="flex items-center gap-1.5 pt-1">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all duration-300 ${
                isPositive
                  ? "bg-emerald-50/60 text-emerald-600 border-emerald-100"
                  : "bg-rose-50/60 text-rose-600 border-rose-100"
              }`}
            >
              {isPositive ? "▲" : "▼"} {change}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              vs last cycle
            </span>
          </div>
        </div>

        {/* 🎯 MINIMALIST ICON BASE: Clean soft background tint that scales organically on group hover */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/50 text-xl group-hover:scale-105 group-hover:bg-white group-hover:shadow-md group-hover:shadow-slate-100/50 transition-all duration-500 ease-out flex items-center justify-center min-w-[44px] min-h-[44px]">
          <Icon />
        </div>
      </div>
    </div>
  );
};

export function ExecutiveKPIs() {
  const kpiData = [
    {
      title: "Total System Enrollment",
      value: "6,120",
      metricContext: "students",
      change: "+6.7%",
      isPositive: true,
      colorClass: "bg-[#660033]", // Burgundy Glow Asset
      icon: () => (
        <span className="drop-shadow-sm filter contrast-125">🎓</span>
      ),
    },
    {
      title: "Budget Utilization (BUR)",
      value: "87.4%",
      metricContext: "efficiency",
      change: "+4.1%",
      isPositive: true,
      colorClass: "bg-[#C5A059]", // Satin Gold Glow Asset
      icon: () => <span className="text-[#660033] font-bold text-lg">📊</span>,
    },
    {
      title: "Board Passing Velocity",
      value: "81.6%",
      metricContext: "institutional",
      change: "+5.3%",
      isPositive: true,
      colorClass: "bg-[#660033]", // Burgundy Glow Asset
      icon: () => <span className="drop-shadow-sm">⚖️</span>,
    },
    {
      title: "Research Funding Secured",
      value: "₱32.8M",
      metricContext: "php",
      change: "+14.2%",
      isPositive: true,
      colorClass: "bg-[#C5A059]", // Satin Gold Glow Asset
      icon: () => <span className="text-[#600018] font-bold text-base">₱</span>,
    },
    {
      title: "Graduate Employability Rate",
      value: "84.6%",
      metricContext: "employed within 12 mos",
      change: "+4.2%",
      isPositive: true,
      colorClass: "bg-emerald-500",
      icon: () => (
        <svg
          className="w-5 h-5 text-white drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Faculty Publication Rate",
      value: "84.2%",
      metricContext: "indexed",
      change: "+2.4%",
      isPositive: true,
      colorClass: "bg-[#660033]", // Burgundy Glow Asset
      icon: () => <span className="drop-shadow-sm">📄</span>,
    },
    {
      title: "Infrastructure Modernization",
      value: "92.1%",
      metricContext: "utilization",
      change: "+8.5%",
      isPositive: true,
      colorClass: "bg-[#C5A059]", // Satin Gold Glow Asset
      icon: () => <span className="drop-shadow-sm">🏢</span>,
    },
    {
      title: "Extension Footprint",
      value: "2,450",
      metricContext: "beneficiaries",
      change: "+11.9%",
      isPositive: true,
      colorClass: "bg-[#660033]", // Burgundy Glow Asset
      icon: () => <span className="drop-shadow-sm">🌱</span>,
    },
  ];

  return (
    /* Render wrapper to automatically handle grid flow on responsive breakpoints */
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {kpiData.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
}
export default ExecutiveKPIs;
