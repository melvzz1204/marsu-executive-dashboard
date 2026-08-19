import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Chart } from "react-chartjs-2";
import api from "../../../../api/axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

const TARGET_RATE = 64;
const MAROON = "#660033";
const GOLD = "#D4AF37";

function formatRate(rate) {
  return `${Number(rate || 0).toFixed(2)}%`;
}

function getRate(records) {
  const totals = records.reduce(
    (result, item) => ({
      takers: result.takers + Number(item.takers || 0),
      passed: result.passed + Number(item.passed || 0),
    }),
    { takers: 0, passed: 0 },
  );

  return totals.takers > 0 ? (totals.passed / totals.takers) * 100 : 0;
}

function rateTone(rate) {
  if (rate >= 75) return "text-emerald-600";
  if (rate >= TARGET_RATE) return "text-amber-600";
  return "text-rose-600";
}

const chartLegend = {
  position: "top",
  align: "end",
  labels: {
    usePointStyle: true,
    pointStyle: "circle",
    boxWidth: 7,
    boxHeight: 7,
    color: "#475569",
    font: { size: 10, weight: "600" },
  },
};

export default function LicensureExam() {
  const [records, setRecords] = useState([]);
  const [selectedYear, setSelectedYear] = useState("latest");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLicensureData = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/higher-education/licensure/stats", {
        signal,
      });
      setRecords(
        Array.isArray(response.data?.data?.records)
          ? response.data.data.records
          : [],
      );
    } catch (err) {
      if (err.code === "ERR_CANCELED" || err.name === "CanceledError") return;
      console.error("Error fetching licensure examination data:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to connect to the server",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initialFetch = window.setTimeout(
      () => fetchLicensureData(controller.signal),
      0,
    );

    return () => {
      window.clearTimeout(initialFetch);
      controller.abort();
    };
  }, [fetchLicensureData]);

  const availableYears = useMemo(
    () =>
      [...new Set(records.map((item) => item.year).filter(Boolean))].sort(
        (a, b) => b - a,
      ),
    [records],
  );

  const categories = useMemo(
    () =>
      [...new Set(records.map((item) => item.category).filter(Boolean))].sort(),
    [records],
  );

  const latestYear = availableYears[0];
  const activeYear =
    selectedYear === "latest" ? latestYear : Number(selectedYear);

  const categoryRecords = useMemo(
    () =>
      selectedCategory === "All"
        ? records
        : records.filter((item) => item.category === selectedCategory),
    [records, selectedCategory],
  );

  const visibleRecords = useMemo(
    () => categoryRecords.filter((item) => item.year === activeYear),
    [activeYear, categoryRecords],
  );

  const publishedRecords = useMemo(
    () => visibleRecords.filter((item) => !item.isNda),
    [visibleRecords],
  );

  const totals = useMemo(
    () =>
      publishedRecords.reduce(
        (result, item) => ({
          takers: result.takers + Number(item.takers || 0),
          passed: result.passed + Number(item.passed || 0),
        }),
        { takers: 0, passed: 0 },
      ),
    [publishedRecords],
  );

  const actualRate =
    totals.takers > 0 ? (totals.passed / totals.takers) * 100 : 0;
  const variance = actualRate - TARGET_RATE;
  const programsAtTarget = publishedRecords.filter(
    (item) => Number(item.passingRate || 0) * 100 >= TARGET_RATE,
  ).length;
  const ndaCount = visibleRecords.filter((item) => item.isNda).length;

  const yearlyTrend = useMemo(
    () =>
      availableYears
        .slice()
        .reverse()
        .map((year) => {
          const published = categoryRecords.filter(
            (item) => item.year === year && !item.isNda,
          );
          const takers = published.reduce(
            (sum, item) => sum + Number(item.takers || 0),
            0,
          );
          const passed = published.reduce(
            (sum, item) => sum + Number(item.passed || 0),
            0,
          );
          return {
            year,
            takers,
            passed,
            unsuccessful: Math.max(takers - passed, 0),
            rate: getRate(published),
          };
        }),
    [availableYears, categoryRecords],
  );

  const trendData = useMemo(
    () => ({
      labels: yearlyTrend.map((item) => String(item.year)),
      datasets: [
        {
          type: "line",
          label: "Passing rate",
          data: yearlyTrend.map((item) => item.rate),
          borderColor: GOLD,
          backgroundColor: "rgba(212, 175, 55, 0.12)",
          borderWidth: 3,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: GOLD,
          pointBorderWidth: 2,
          pointRadius: 4,
          fill: true,
          tension: 0.25,
          yAxisID: "percentage",
          order: 1,
        },
        {
          type: "line",
          label: "64% target",
          data: yearlyTrend.map(() => TARGET_RATE),
          borderColor: "#94a3b8",
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: "percentage",
          order: 2,
        },
        {
          type: "bar",
          label: "Passed",
          data: yearlyTrend.map((item) => item.passed),
          backgroundColor: MAROON,
          borderRadius: 4,
          yAxisID: "candidates",
          order: 3,
        },
        {
          type: "bar",
          label: "Unsuccessful",
          data: yearlyTrend.map((item) => item.unsuccessful),
          backgroundColor: "#cbd5e1",
          borderRadius: 4,
          yAxisID: "candidates",
          order: 4,
        },
      ],
    }),
    [yearlyTrend],
  );

  const rankedPrograms = useMemo(
    () =>
      [...publishedRecords]
        .sort((a, b) => {
          const rateDifference = Number(b.passingRate) - Number(a.passingRate);
          return rateDifference || Number(b.takers) - Number(a.takers);
        })
        .slice(0, 8),
    [publishedRecords],
  );

  const rankingData = useMemo(
    () => ({
      labels: rankedPrograms.map((item) => item.programName),
      datasets: [
        {
          label: "Passing rate",
          data: rankedPrograms.map(
            (item) => Number(item.passingRate || 0) * 100,
          ),
          backgroundColor: rankedPrograms.map((item) =>
            Number(item.passingRate || 0) * 100 >= TARGET_RATE
              ? MAROON
              : "#e11d48",
          ),
          borderRadius: 4,
          barThickness: 14,
        },
      ],
    }),
    [rankedPrograms],
  );

  if (loading) {
    return (
      <section className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#D4AF37] border-t-[#660033]" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Synchronizing licensure data...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
        <p className="mb-2 text-sm font-bold">Unable to load licensure data</p>
        <p className="mb-5 text-xs text-rose-600">{error}</p>
        <button
          type="button"
          onClick={() => fetchLicensureData()}
          className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700"
        >
          Retry connection
        </button>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#660033]">
              Higher Education Outcomes
            </span>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              Licensure Examination Performance
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Weighted passing performance, candidate outcomes, and program
              standing.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Reporting year
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="mt-1 block h-9 min-w-40 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold normal-case tracking-normal text-slate-700 outline-none focus:border-[#660033] focus:ring-2 focus:ring-[#660033]/10"
              >
                <option value="latest">Latest available</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Discipline
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="mt-1 block h-9 min-w-44 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold normal-case tracking-normal text-slate-700 outline-none focus:border-[#660033] focus:ring-2 focus:ring-[#660033]/10"
              >
                <option value="All">All disciplines</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-7">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="flex min-h-28 flex-col justify-between rounded-lg bg-[#660033] p-4 text-white shadow-[0_3px_0_0_#D4AF37]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Overall passing rate
            </span>
            <div>
              <strong className="text-3xl font-black text-[#FFD700]">
                {formatRate(actualRate)}
              </strong>
              <span
                className={`ml-2 text-xs font-bold ${variance >= 0 ? "text-emerald-300" : "text-rose-300"}`}
              >
                {variance >= 0 ? "+" : ""}
                {variance.toFixed(2)} pts
              </span>
            </div>
            <span className="text-[10px] text-slate-300">
              Against {TARGET_RATE}% target
            </span>
          </div>

          <div className="flex min-h-28 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Candidate outcomes
            </span>
            <strong className="text-3xl font-black text-slate-900">
              {totals.passed.toLocaleString()}
            </strong>
            <span className="text-[10px] font-semibold text-slate-500">
              Passed out of {totals.takers.toLocaleString()} takers
            </span>
          </div>

          <div className="flex min-h-28 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Programs at target
            </span>
            <strong className="text-3xl font-black text-emerald-700">
              {programsAtTarget}
            </strong>
            <span className="text-[10px] font-semibold text-slate-500">
              Of {publishedRecords.length} published programs
            </span>
          </div>

          <div className="flex min-h-28 flex-col justify-between rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending results
            </span>
            <strong className="text-3xl font-black text-slate-700">
              {ndaCount}
            </strong>
            <span className="text-[10px] font-semibold text-slate-500">
              NDA records for {activeYear || "selected year"}
            </span>
          </div>
        </div>

        {records.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
              <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-3">
                <div className="mb-4">
                  <h3 className="text-sm font-black text-slate-900">
                    Yearly outcome trend
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Candidate volume and weighted passing rate by examination
                    year
                  </p>
                </div>
                <div className="h-[300px] w-full">
                  <Chart
                    type="bar"
                    data={trendData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { mode: "index", intersect: false },
                      plugins: { legend: chartLegend },
                      scales: {
                        x: {
                          stacked: true,
                          grid: { display: false },
                          ticks: { color: "#64748b" },
                        },
                        candidates: {
                          stacked: true,
                          position: "left",
                          beginAtZero: true,
                          grid: { color: "#f1f5f9" },
                          ticks: { precision: 0, color: "#64748b" },
                          title: {
                            display: true,
                            text: "Candidates",
                            color: "#94a3b8",
                            font: { size: 10 },
                          },
                        },
                        percentage: {
                          position: "right",
                          min: 0,
                          max: 100,
                          grid: { drawOnChartArea: false },
                          ticks: {
                            callback: (value) => `${value}%`,
                            color: "#64748b",
                          },
                          title: {
                            display: true,
                            text: "Passing rate",
                            color: "#94a3b8",
                            font: { size: 10 },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-2">
                <div className="mb-4">
                  <h3 className="text-sm font-black text-slate-900">
                    Program performance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Top published passing rates for {activeYear}
                  </p>
                </div>
                {rankedPrograms.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <Bar
                      data={rankingData}
                      options={{
                        indexAxis: "y",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: "#f1f5f9" },
                            ticks: {
                              callback: (value) => `${value}%`,
                              color: "#64748b",
                            },
                          },
                          y: {
                            grid: { display: false },
                            ticks: {
                              color: "#475569",
                              font: { size: 10, weight: "600" },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-xs font-semibold text-slate-400">
                    No published results
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Program registry
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Complete result detail for the selected reporting view
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {visibleRecords.length} records
                </span>
              </div>
              <div className="max-h-[360px] overflow-auto">
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-bold">Program</th>
                      <th className="px-4 py-3 font-bold">Discipline</th>
                      <th className="px-4 py-3 text-right font-bold">Takers</th>
                      <th className="px-4 py-3 text-right font-bold">Passed</th>
                      <th className="px-5 py-3 text-right font-bold">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {visibleRecords.map((item) => {
                      const rate = Number(item.passingRate || 0) * 100;
                      return (
                        <tr
                          key={`${item.year}-${item.programName}`}
                          className="hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-3 font-semibold text-slate-800">
                            {item.programName}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {item.category}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                            {item.isNda ? "NDA" : item.takers.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                            {item.isNda ? "NDA" : item.passed.toLocaleString()}
                          </td>
                          <td
                            className={`px-5 py-3 text-right font-black tabular-nums ${item.isNda ? "text-slate-400" : rateTone(rate)}`}
                          >
                            {item.isNda ? "Pending" : formatRate(rate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {visibleRecords.length === 0 && (
                  <div className="py-12 text-center text-xs font-semibold text-slate-400">
                    No records match the selected filters.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-xs font-semibold text-slate-400">
            No licensure examination records are available.
          </div>
        )}
      </div>
    </section>
  );
}
