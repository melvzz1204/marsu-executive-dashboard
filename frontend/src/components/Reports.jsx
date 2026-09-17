import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const STATUS = {
  idle: "idle",
  generating: "generating",
  ready: "ready",
  error: "error",
};

function buildYearOptions(currentYear) {
  return Array.from({ length: 6 }, (_, index) => currentYear - index);
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

export default function Reports({ isDarkMode = false }) {
  const currentYear = new Date().getFullYear();
  const yearOptions = buildYearOptions(currentYear);

  const [year, setYear] = useState(currentYear);
  const [status, setStatus] = useState(STATUS.idle);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const blobUrlRef = useRef(null);

  const clearBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setDownloadUrl(null);
  }, []);

  useEffect(() => clearBlob, [clearBlob]);

  const isGenerating = status === STATUS.generating;
  const isReady = status === STATUS.ready;

  const handleYearChange = (event) => {
    setYear(Number(event.target.value));
    setStatus(STATUS.idle);
    setError(null);
    clearBlob();
  };

  const handleGenerate = async () => {
    setStatus(STATUS.generating);
    setError(null);
    clearBlob();

    try {
      const response = await api.get("/reports/presidents/pptx", {
        params: { year },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: PPTX_MIME });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      setDownloadUrl(url);
      setStatus(STATUS.ready);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate the President's Report",
      );
      setStatus(STATUS.error);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `Presidents-Report-${year}.pptx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const panelClass = `rounded-2xl border p-5 ${
    isDarkMode
      ? "border-slate-700/70 bg-slate-800/40"
      : "border-slate-200/70 bg-white"
  }`;

  return (
    <div className="space-y-6">
      <div className={panelClass}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Office of the President
              </span>
            </div>
            <h2
              className={`font-oswald text-xl font-black uppercase tracking-wide ${
                isDarkMode ? "text-[#e7c766]" : "text-[#600018]"
              }`}
            >
              President&apos;s Report
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Generate the presidential report and download an editable
              PowerPoint deck for the selected year.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Year
              <select
                value={year}
                onChange={handleYearChange}
                disabled={isGenerating}
                className={`rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none disabled:opacity-60 ${
                  isDarkMode
                    ? "border-slate-600 bg-slate-900 text-slate-100"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {!isReady && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-xl bg-[#600018] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-[#7a001e] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isGenerating ? (
                  <>
                    <Spinner />
                    Generating…
                  </>
                ) : (
                  "Generate Report"
                )}
              </button>
            )}

            {isReady && (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#3A0010] shadow-sm transition-colors hover:bg-[#c5a059]"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14"
                    />
                  </svg>
                  Download PPT
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className={`rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                    isDarkMode
                      ? "border-slate-600 text-slate-300 hover:border-slate-500 hover:text-slate-100"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  Regenerate
                </button>
              </>
            )}
          </div>
        </div>

        {isGenerating && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#600018]/5 px-4 py-3">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#600018]/30 border-t-[#600018]" />
            <span className="text-[11px] font-semibold text-slate-500">
              Building the {year} President&apos;s Report and preparing the
              editable deck. Please wait…
            </span>
          </div>
        )}

        {status === STATUS.error && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <span className="text-[11px] font-semibold text-rose-700">
              {error}
            </span>
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        )}

        {isReady && (
          <p className="mt-4 text-[11px] text-slate-400">
            Report ready. The downloaded file is a native, editable PowerPoint —
            open it in PowerPoint or Google Slides to make further changes.
          </p>
        )}
      </div>
    </div>
  );
}
