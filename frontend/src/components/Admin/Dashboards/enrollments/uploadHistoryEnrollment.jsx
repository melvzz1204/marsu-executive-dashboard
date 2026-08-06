import React, { useState, useEffect, useCallback } from "react";
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

  const getStatusBadge = (status = "", isOverwrite = false) => {
    const rawStatus = status.toString().toUpperCase().trim();

    // Catch explicit overwrite flag OR backend statuses ("OVERWRITE", "OVERWRITTEN", "UPDATED")
    const isOverwritten =
      Boolean(isOverwrite) ||
      rawStatus === "OVERWRITE" ||
      rawStatus === "OVERWRITTEN" ||
      rawStatus === "UPDATED";

    if (isOverwritten) {
      return {
        label: "Updated (Overwrite)",
        className: "bg-indigo-100 text-indigo-800 border-indigo-200",
      };
    }

    if (rawStatus === "SUCCESS") {
      return {
        label: "New Upload",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    }

    if (rawStatus === "DUPLICATE_BLOCK") {
      return {
        label: "Duplicate Blocked",
        className: "bg-amber-100 text-amber-800 border-amber-200",
      };
    }

    if (rawStatus === "FAILED") {
      return {
        label: "Failed",
        className: "bg-rose-100 text-rose-800 border-rose-200",
      };
    }

    return {
      label: rawStatus.replace(/_/g, " "),
      className: "bg-slate-100 text-slate-700 border-slate-200",
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
      if (response.data?.success || response.status === 200) {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to clear enrollment logs:", err);
      if (err.response?.status === 404) {
        setLogs([]);
      } else {
        setError(
          err.response?.data?.message || "Failed to clear upload history.",
        );
      }
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mt-8">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-sm font-black font-oswald uppercase tracking-tight text-slate-900">
            Upload History
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Real-time track of spreadsheet data ingestion and updates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0 || clearing || loading}
            className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {clearing ? "Clearing..." : "🗑️ Clear History"}
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading || clearing}
            className="px-3.5 py-1.5 rounded-xl border border-[#580017]/20 bg-[#580017]/10 hover:bg-[#580017]/20 text-xs font-bold text-[#580017] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 font-oswald">
              <th className="px-8 py-4">File Name</th>
              <th className="px-8 py-4">Target Year</th>
              <th className="px-8 py-4">Semester</th>
              <th className="px-8 py-4">Uploaded By</th>
              <th className="px-8 py-4">Records</th>
              <th className="px-8 py-4">Timestamp</th>
              <th className="px-8 py-4 text-right">Status / Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-8 py-4">
                    <div className="h-3.5 bg-slate-200 rounded w-36 mb-1"></div>
                    <div className="h-2.5 bg-slate-200 rounded w-16"></div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="h-3.5 bg-slate-200 rounded w-12"></div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="h-3.5 bg-slate-200 rounded w-16"></div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="h-3.5 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="h-3.5 bg-slate-200 rounded w-12"></div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="h-3.5 bg-slate-200 rounded w-28"></div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="h-5 bg-slate-200 rounded-full w-20 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-8 py-8 text-center text-slate-400 font-medium"
                >
                  No upload history found.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => {
                const isOverwriteFlag = log.isOverwrite || log.isOverwritten;
                const statusBadge = getStatusBadge(log.status, isOverwriteFlag);
                const rawTimestamp = log.uploadedAt || log.createdAt;

                return (
                  <tr
                    key={log._id || index}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-8 py-4 font-bold text-slate-800">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[200px]">
                          {log.fileName || "Spreadsheet.xlsx"}
                        </span>
                        {log.fileSize && (
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {log.fileSize}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-slate-600 font-mono">
                      {log.targetYear || "—"}
                    </td>
                    <td className="px-8 py-4 text-slate-600 font-medium">
                      {log.semester || "—"}
                    </td>
                    <td className="px-8 py-4 text-slate-600">
                      {log.uploadedBy || "System Admin"}
                    </td>
                    <td className="px-8 py-4 font-mono font-bold text-slate-900">
                      {log.recordsProcessed ?? "—"}
                    </td>
                    <td className="px-8 py-4 text-slate-500 whitespace-nowrap font-medium">
                      {formatDate(rawTimestamp)}
                    </td>
                    <td className="px-8 py-4 text-right whitespace-nowrap">
                      <span
                        title={log.errorMessage || ""}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider cursor-default ${statusBadge.className}`}
                      >
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
