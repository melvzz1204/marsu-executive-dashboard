import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../../../api/axios";

export default function UploadHistory({ refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);

      const formattedTime = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);

      return `${formattedDate} • ${formattedTime}`;
    } catch {
      return isoString;
    }
  };

  // Status Badge: Strictly Overwrite or Success
  const getStatusBadge = (status = "", isOverwrite = false) => {
    const rawStatus = status.toString().toUpperCase().trim();
    const isOverwritten =
      Boolean(isOverwrite) ||
      ["OVERWRITE", "OVERWRITTEN", "UPDATED"].includes(rawStatus);

    if (isOverwritten) {
      return {
        label: "Overwrite",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        dotColor: "bg-indigo-500",
      };
    }

    return {
      label: "Success",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dotColor: "bg-emerald-500",
    };
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/enrollment/logs");
      const data = response.data;
      const logList = Array.isArray(data) ? data : data?.data || [];
      setLogs(logList);
    } catch (err) {
      console.error("Failed to fetch enrollment logs:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load upload history.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, refreshTrigger]);

  const handleClearLogs = async () => {
    if (
      !window.confirm("Are you sure you want to clear all upload history logs?")
    ) {
      return;
    }

    setClearing(true);
    setError(null);

    try {
      const response = await api.delete("/enrollment/logs");
      if (response.data?.success) {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to clear enrollment logs:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to clear upload history.",
      );
    } finally {
      setClearing(false);
    }
  };

  // Filter strictly for SUCCESS or OVERWRITE
  const cleanLogs = useMemo(() => {
    return logs.filter((log) => {
      const rawStatus = (log.status || "").toString().toUpperCase().trim();
      const isOverwritten =
        Boolean(log.isOverwrite || log.isOverwritten) ||
        ["OVERWRITE", "OVERWRITTEN", "UPDATED"].includes(rawStatus);

      const isSuccess = rawStatus === "SUCCESS";
      return isSuccess || isOverwritten;
    });
  }, [logs]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mt-8 transition-all">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-black font-oswald uppercase tracking-tight text-slate-900">
            Upload History
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Real-time track of spreadsheet data ingestion and updates
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          <button
            onClick={handleClearLogs}
            disabled={cleanLogs.length === 0 || clearing || loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-40 sm:flex-none"
          >
            {clearing ? "Clearing..." : "🗑️ Clear History"}
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading || clearing}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#580017]/20 bg-[#580017]/10 px-3.5 py-1.5 text-xs font-bold text-[#580017] transition-all hover:bg-[#580017]/20 disabled:opacity-50 sm:flex-none"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-bold flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchLogs} className="underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 font-oswald">
              <th className="px-5 py-3.5">File Name</th>
              <th className="px-5 py-3.5">Target Year</th>
              <th className="px-5 py-3.5">Semester</th>
              <th className="px-5 py-3.5">Uploaded By</th>
              <th className="px-5 py-3.5">Records</th>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-3.5">
                    <div className="h-3.5 bg-slate-200 rounded w-36 mb-1"></div>
                    <div className="h-2.5 bg-slate-200 rounded w-16"></div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="h-3.5 bg-slate-200 rounded w-16"></div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="h-3.5 bg-slate-200 rounded w-16"></div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="h-3.5 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="h-3.5 bg-slate-200 rounded w-8"></div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="h-3.5 bg-slate-200 rounded w-28"></div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="h-5 bg-slate-200 rounded-full w-20 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : cleanLogs.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-5 py-10 text-center text-slate-400 font-medium"
                >
                  No successful or overwritten upload records found.
                </td>
              </tr>
            ) : (
              cleanLogs.map((log, index) => {
                const isOverwriteFlag = log.isOverwrite || log.isOverwritten;
                const statusBadge = getStatusBadge(log.status, isOverwriteFlag);
                const rawTimestamp = log.uploadedAt || log.createdAt;

                return (
                  <tr
                    key={log._id || index}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[180px]">
                          {log.fileName || "Spreadsheet.xlsx"}
                        </span>
                        {log.fileSize && (
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {log.fileSize}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono whitespace-nowrap font-medium">
                      {log.targetYear || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                      {log.semester || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {log.uploadedBy || "System Admin"}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {log.recordsProcessed ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap font-medium">
                      {formatDate(rawTimestamp)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBadge.className}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`}
                        ></span>
                        {statusBadge.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
