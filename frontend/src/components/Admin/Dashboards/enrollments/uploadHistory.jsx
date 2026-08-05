import React, { useState, useEffect } from "react";

export default function UploadHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // 💡 UNIFIED SINGLE STATUS BADGE LOGIC
  const getStatusBadge = (status = "", isOverwrite = false) => {
    const rawStatus = status.toString().toUpperCase().trim();

    if (rawStatus === "SUCCESS") {
      if (isOverwrite) {
        return {
          label: "Updated (Overwrite)",
          className: "bg-blue-100 text-blue-800 border-blue-200",
        };
      }
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

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      const response = await fetch(
        "http://localhost:5000/api/v1/enrollment/logs",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const logList = Array.isArray(data) ? data : data.data || [];
      setLogs(logList);
    } catch (err) {
      setError(err.message || "Unable to load upload history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-extrabold font-oswald uppercase tracking-tight text-slate-900">
            Upload History & Audit Logs
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time track of spreadsheet data ingestion and updates
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-[#580017] bg-[#580017]/10 hover:bg-[#580017]/20 border border-[#580017]/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Table Data */}
      {!loading && !error && logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 font-oswald">
                <th className="py-3 px-3">File Name</th>
                <th className="py-3 px-3">Target Year</th>
                <th className="py-3 px-3">Semester</th>
                <th className="py-3 px-3">Uploaded By</th>
                <th className="py-3 px-3">Records</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3 text-right">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {logs.map((log, index) => {
                const statusBadge = getStatusBadge(log.status, log.isOverwrite);
                const rawTimestamp = log.uploadedAt || log.createdAt;

                return (
                  <tr
                    key={log._id || index}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* File Name */}
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[200px]">
                          {log.fileName || "Spreadsheet.xlsx"}
                        </span>
                        {log.fileSize && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {log.fileSize}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Target Year */}
                    <td className="py-3 px-3 text-slate-600 font-mono">
                      {log.targetYear ? log.targetYear : "—"}
                    </td>

                    {/* Semester Column */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {log.semester ? log.semester : "—"}
                    </td>

                    {/* Uploaded By */}
                    <td className="py-3 px-3 text-slate-600">
                      {log.uploadedBy || "System Admin"}
                    </td>

                    {/* Records Processed */}
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {log.recordsProcessed ?? "—"}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap font-medium">
                      {formatDate(rawTimestamp)}
                    </td>

                    {/* Single Unified Status Badge Column */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span
                        title={log.errorMessage || ""}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider cursor-default ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
