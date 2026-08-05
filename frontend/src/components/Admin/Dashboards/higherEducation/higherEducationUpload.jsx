import React, { useState, useEffect } from "react";
import api from "../../../../api/axios"; // Adjust to match your Axios setup

export default function HigherEducationUpload() {
  // Upload States
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Overwrite Modal States
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState("");

  // History States
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // ==========================================
  // API CALLS
  // ==========================================
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await api.get("/higher-education/logs");
      const data = response.data?.data || [];
      setLogs(data);
    } catch (err) {
      console.error("Unable to load upload history.", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // ==========================================
  // FILE HANDLING
  // ==========================================
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setStatusMessage(null);
    const fileInput = document.getElementById("higherEdFileInput");
    if (fileInput) fileInput.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.name.endsWith(".xlsx") ||
        droppedFile.name.endsWith(".xls")
      ) {
        setFile(droppedFile);
        setStatusMessage(null);
      } else {
        setStatusMessage({
          type: "error",
          text: "Invalid file format. Please drop a Microsoft Excel (.xlsx or .xls) file.",
        });
      }
    }
  };

  // ==========================================
  // SUBMISSION & OVERWRITE LOGIC
  // ==========================================
  const handleUpload = async (shouldOverwrite = false) => {
    if (!file) return;

    setUploading(true);
    setStatusMessage(null);
    if (shouldOverwrite) setShowOverwriteModal(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (shouldOverwrite) {
        formData.append("overwrite", "true");
      }

      const response = await api.post("/higher-education/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        // Tell Axios not to throw an error for 409 status so we can handle it manually
        validateStatus: (status) => status < 500,
      });

      // ⚠️ DUPLICATE DETECTED: Trigger the Overwrite Modal
      if (response.status === 409 && response.data.isDuplicate) {
        setDuplicateDetails(response.data.message);
        setShowOverwriteModal(true);
        setUploading(false);
        return;
      }

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.data.message || "Failed to upload dataset.");
      }

      setStatusMessage({
        type: "success",
        text:
          response.data.message || "File uploaded and processed successfully!",
      });

      handleClearFile();
      fetchLogs(); // Refresh history table
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to upload dataset.";
      setStatusMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================
  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      return `${new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)} • ${new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date)}`;
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status = "") => {
    const rawStatus = status.toString().toUpperCase().trim();
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
    <div className="space-y-6 relative">
      {/* 1. UPLOAD CARD */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm p-10">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h2 className="text-lg font-black font-oswald uppercase tracking-tight text-slate-900">
            Upload Higher Education Data
          </h2>
          <p className="text-xs text-slate-500">
            Select or drag an official Excel file (`.xlsx`, `.xls`) to ingest
            Academic Programs and Tracer Study metrics.
          </p>
        </div>

        {/* Upload Status Banner */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl mb-6 text-xs font-bold flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span>
              {statusMessage.type === "success" ? "✅ " : "⚠️ "}
              {statusMessage.text}
            </span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Interactive Dropzone Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 transition-all duration-200 rounded-2xl p-8 text-center ${
            isDragging
              ? "border-[#580017] border-dashed bg-[#580017]/10 scale-[1.01]"
              : file
                ? "border-emerald-500 border-solid bg-emerald-50/60 shadow-sm"
                : "border-slate-200 border-dashed hover:border-[#580017]/40 bg-slate-50/50"
          }`}
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            id="higherEdFileInput"
            className="hidden"
          />
          <label
            htmlFor="higherEdFileInput"
            className="cursor-pointer space-y-3 block"
          >
            <div
              className={`w-12 h-12 rounded-full transition-all flex items-center justify-center mx-auto text-xl ${
                isDragging
                  ? "bg-[#580017] text-white"
                  : file
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-[#580017]/5 text-[#580017]"
              }`}
            >
              {file ? "✓" : "📂"}
            </div>
            <div>
              <p
                className={`text-sm font-bold transition-colors ${
                  file ? "text-emerald-900" : "text-slate-800"
                }`}
              >
                {file
                  ? file.name
                  : isDragging
                    ? "Drop Excel file here now!"
                    : "Click to browse or drop file here"}
              </p>
              <p
                className={`text-[11px] mt-0.5 transition-colors ${
                  file ? "text-emerald-700 font-semibold" : "text-slate-400"
                }`}
              >
                {file
                  ? "Ready to ingest • Click or drop another file to replace"
                  : "Supports Microsoft Excel spreadsheets (.xlsx, .xls)"}
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {file && (
            <button
              onClick={handleClearFile}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl font-oswald uppercase tracking-wider text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              Clear File
            </button>
          )}

          <button
            onClick={() => handleUpload(false)}
            disabled={!file || uploading}
            className={`px-6 py-2.5 rounded-xl font-oswald uppercase tracking-wider text-xs font-bold transition-all ${
              !file || uploading
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-[#580017] text-white hover:bg-[#420011] shadow-md cursor-pointer"
            }`}
          >
            {uploading ? "Processing..." : "Ingest Data"}
          </button>
        </div>
      </div>

      {/* 2. HISTORY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold font-oswald uppercase tracking-tight text-slate-900">
              Higher Ed Upload History
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-time track of spreadsheet data ingestion and updates
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loadingLogs}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-[#580017] bg-[#580017]/10 hover:bg-[#580017]/20 border border-[#580017]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingLogs ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {!loadingLogs && logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 font-oswald">
                  <th className="py-3 px-3">File Name</th>
                  <th className="py-3 px-3">Uploaded By</th>
                  <th className="py-3 px-3">Records Processed</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {logs.map((log) => {
                  const statusBadge = getStatusBadge(log.status);
                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[200px]">
                            {log.fileName || "Spreadsheet.xlsx"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {log.fileSize || "0 KB"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {log.uploadedBy || "System Admin"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {log.recordsProcessed ?? 0}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-medium">
                        {formatDate(log.uploadedAt)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
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
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            {loadingLogs ? "Loading history..." : "No upload history found."}
          </div>
        )}
      </div>

      {showOverwriteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-8 shadow-2xl transform transition-all">
            {/* Modal Header */}
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center text-yellow-600 text-2xl shrink-0">
                ⚠️
              </div>
              <div className="pt-2">
                <h3 className="text-xl font-black font-oswald text-slate-900 uppercase tracking-tight">
                  Existing File Detected
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed pr-2">
                  {duplicateDetails ||
                    "Found existing higher education programs in the database matching this Excel file."}
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-[#FFFDF0] border border-[#FDE68A] rounded-2xl p-5 mt-6 mb-8">
              <p className="text-sm text-[#92400E] font-bold leading-relaxed">
                Overwriting will permanently replace the existing program
                metrics for this specific period, but existing Accreditation
                Statuses and expiry dates will be safely preserved.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-center gap-8 pt-2">
              <button
                onClick={() => setShowOverwriteModal(false)}
                className="text-sm font-black text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpload(true)}
                className="px-8 py-3.5 rounded-full text-sm font-black uppercase tracking-wider bg-[#E11D48] text-white hover:bg-[#BE123C] shadow-md transition-all cursor-pointer"
              >
                Yes, Overwrite Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
