import { useMemo, useState } from "react";

export const ANNUAL_RESEARCH_TARGET = 60;

const signed = (value) => `${value > 0 ? "+" : ""}${value}`;

function formatPct(value) {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value)}%`;
}

function buildMonthlySeries(papersByMonth) {
  const series = Array(12).fill(0);
  (papersByMonth || []).forEach((row) => {
    const index = Number(row.month) - 1;
    if (index >= 0 && index < 12) {
      series[index] = Number(row.count) || 0;
    }
  });
  return series;
}

export default function AnnualTargetTracker({
  papersByMonth = [],
  papersByMonthByYear = {},
  availableYears = [],
  year,
  annualTarget = ANNUAL_RESEARCH_TARGET,
}) {
  // `userYear` stays null until the user picks a year, so the tracker can
  // follow the incoming default reporting year without an effect.
  const [userYear, setUserYear] = useState(null);
  const selectedYear = userYear ?? year ?? null;

  const yearOptions = useMemo(() => {
    const years = availableYears.map(Number).filter(Number.isFinite);
    if (selectedYear != null) years.push(Number(selectedYear));
    return [...new Set(years)].sort((a, b) => b - a);
  }, [availableYears, selectedYear]);

  const activeMonthly = useMemo(() => {
    const key = selectedYear != null ? String(selectedYear) : null;
    if (key && papersByMonthByYear[key]) return papersByMonthByYear[key];
    if (Object.keys(papersByMonthByYear).length === 0) return papersByMonth;
    return [];
  }, [papersByMonthByYear, papersByMonth, selectedYear]);

  const totalActual = useMemo(
    () =>
      buildMonthlySeries(activeMonthly).reduce((sum, count) => sum + count, 0),
    [activeMonthly],
  );
  const totalVariance = totalActual - annualTarget;
  const progressPct =
    annualTarget > 0 ? Math.min(100, (totalActual / annualTarget) * 100) : 0;

  const kpis = [
    {
      label: "Annual Target",
      value: annualTarget,
      hint: "research items / year",
      accent: "text-[#8a6d1f]",
      chip: "bg-[#D4AF37]/15 text-[#8a6d1f]",
    },
    {
      label: "Actual Output",
      value: totalActual,
      hint:
        selectedYear != null
          ? `logged in ${selectedYear}`
          : "completed & logged",
      accent: "text-[#660033]",
      chip: "bg-[#660033]/10 text-[#660033]",
    },
    {
      label: "Variance",
      value: signed(totalVariance),
      hint: totalVariance >= 0 ? "above target" : "below target",
      accent: totalVariance >= 0 ? "text-emerald-600" : "text-rose-600",
      chip:
        totalVariance >= 0
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700",
    },
    {
      label: "Target Achieved",
      value: formatPct(progressPct),
      hint: `${totalActual} of ${annualTarget} items`,
      accent: "text-[#660033]",
      chip: "bg-[#660033]/10 text-[#660033]",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      {/* HEADER */}
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-5 mb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-1.5 w-1.5 bg-[#D4AF37] rounded-full" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              Research Performance Monitoring
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-oswald uppercase">
            Annual Research Target Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Target versus actual research output against the {annualTarget}-item
            goal for{" "}
            <span className="font-semibold text-slate-600">
              {selectedYear ?? "the reporting year"}
            </span>
            .
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3 self-start">
          {/* YEAR DROPDOWN */}
          <div className="relative">
            <select
              value={selectedYear ?? ""}
              onChange={(event) =>
                setUserYear(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
              aria-label="Select reporting year"
              className="appearance-none pl-3 pr-8 py-1.5 text-[11px] font-bold rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer hover:border-slate-300 focus:outline-none focus:border-[#660033]/50 transition-colors"
            >
              {yearOptions.length === 0 && <option value="">No year</option>}
              {yearOptions.map((optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200/70 bg-white p-4"
          >
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
              {kpi.label}
            </span>
            <span
              className={`text-2xl font-black font-oswald leading-none block ${kpi.accent}`}
            >
              {kpi.value}
            </span>
            <span
              className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-md ${kpi.chip}`}
            >
              {kpi.hint}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
