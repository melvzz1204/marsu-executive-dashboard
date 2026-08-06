// components/higherEducation/UploadHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../../../../api/axios";

export default function UploadHistory({ refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // FETCH UPLOAD HISTORY LOGS
  // ==========================================
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    setError(null);
    try {
      const response = await api.get("/higher-education/logs");
      if (response.data?.success) {
        setLogs(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch higher education upload logs:", err);
      setError(err.response?.data?.message || "Failed to load upload history.");
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  // Fetch logs on mount & whenever refreshTrigger updates
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, refreshTrigger]);

  // ==========================================
  // CLEAR UPLOAD HISTORY LOGS
  // ==========================================
  const handleClearLogs = async () => {
    if (
      !window.confirm("Are you sure you want to clear all upload history logs?")
    ) {
      return;
    }

    setClearingLogs(true);
    setError(null);

    try {
      const response = await api.delete("/higher-education/logs");
      if (response.data?.success || response.status === 200) {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to clear upload logs:", err);
      // Fallback: Clear local state if endpoint doesn't exist
      if (err.response?.status === 404) {
        setLogs([]);
      } else {
        setError(
          err.response?.data?.message || "Failed to clear upload history.",
        );
      }
    } finally {
      setClearingLogs(false);
    }
  };

  // ==========================================
  // STATUS BADGE FORMATTER
  // ==========================================
  const getStatusBadge = (status = "", isOverwrite = false) => {
    const rawStatus = status.toString().toUpperCase().trim();

    if (rawStatus === "SUCCESS" && isOverwrite) {
      return {
        label: "Overwritten",
        className: "bg-indigo-100 text-indigo-800 border-indigo-200",
      };
    }

    if (rawStatus === "SUCCESS") {
      return {
        label: "Success",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    }

    if (rawStatus === "PARTIAL_SUCCESS") {
      return {
        label: "Partial Success",
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-sm font-black font-oswald uppercase tracking-tight text-slate-900">
            Upload History
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Recent spreadsheet ingestions for Higher Education
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              disabled={clearingLogs || loadingLogs}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {clearingLogs ? "Clearing..." : "🗑️ Clear History"}
            </button>
          )}

          <button
            onClick={fetchLogs}
            disabled={loadingLogs || clearingLogs}
            className="text-xs font-bold text-[#580017] hover:text-[#420011] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loadingLogs ? "Refreshing..." : "↻ Refresh"}
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

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-8 py-4">Date & Time</th>
              <th className="px-8 py-4">File Name</th>
              <th className="px-8 py-4">Uploaded By</th>
              <th className="px-8 py-4">Total Records Ingested</th>
              <th className="px-8 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {loadingLogs ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-8 py-4">
                    <div className="h-3.5 bg-slate-200 rounded w-28"></div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="h-3.5 bg-slate-200 rounded w-36 mb-1"></div>
                    <div className="h-2.5 bg-slate-200 rounded w-16"></div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="h-3.5 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="h-3.5 bg-slate-200 rounded w-12"></div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="h-5 bg-slate-200 rounded w-20"></div>
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-8 py-8 text-center text-slate-400"
                >
                  No upload history found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const statusBadge = getStatusBadge(log.status, log.isOverwrite);
                return (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-8 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {new Date(log.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-8 py-4 font-bold text-slate-800">
                      {log.fileName}
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                        {log.fileSize || "Unknown size"}
                      </span>
                    </td>
                    <td className="px-8 py-4 font-medium text-slate-600">
                      {log.uploadedBy || "System Admin"}
                    </td>
                    <td className="px-8 py-4 font-bold text-slate-900">
                      {log.recordsProcessed || 0}
                    </td>
                    <td className="px-8 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusBadge.className}`}
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
