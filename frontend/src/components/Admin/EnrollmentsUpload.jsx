import React, { useState, useCallback } from "react";

const formatAYLabel = (startYear) => {
  if (!startYear) return "";
  const numericYear = Number(startYear);
  return !isNaN(numericYear)
    ? `AY ${numericYear}–${numericYear + 1}`
    : startYear;
};

export default function EnrollmentsUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // State for drag highlight animation
  const [isDragging, setIsDragging] = useState(false);

  // Modal State for Duplicate Overwrite Prompt
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState("");

  // Modal & Fetch State for Upload Audit Logs
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [uploadLogs, setUploadLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const API_BASE = "http://127.0.0.1:5000/api/v1/enrollment";

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  // Clear selected file
  const handleClearFile = () => {
    setFile(null);
    setStatusMessage(null);
    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
  };

  // ==========================================
  // UPLOAD AUDIT LOGS FETCH HANDLER
  // ==========================================
  const fetchUploadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/logs`, {
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setUploadLogs(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch upload logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [API_BASE]);

  const handleOpenLogsModal = () => {
    setShowLogsModal(true);
    fetchUploadLogs();
  };

  // ==========================================
  // DRAG AND DROP EVENT HANDLERS
  // ==========================================
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

      // Ensure file type is valid Excel
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

  const handleUpload = async (shouldOverwrite = false) => {
    if (!file) return;

    setUploading(true);
    setStatusMessage(null);
    if (shouldOverwrite) setShowOverwriteModal(false);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      // Pass overwrite flag
      if (shouldOverwrite) {
        formData.append("overwrite", "true");
      }

      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
        body: formData,
      });

      const json = await response.json();

      // DUPLICATE DETECTED: Trigger the Overwrite Modal
      if (response.status === 409 && json.isDuplicate) {
        setDuplicateDetails(json.message);
        setShowOverwriteModal(true);
        setUploading(false);
        return;
      }

      if (!response.ok || !json.success) {
        throw new Error(
          json.message || json.error || "Failed to upload dataset."
        );
      }

      // SUCCESS
      setStatusMessage({
        type: "success",
        text: json.message || "File uploaded and processed successfully!",
      });
      handleClearFile();

      // Refresh logs if modal is open or for future modal views
      fetchUploadLogs();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Card Container */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="border-b border-slate-100 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black font-oswald uppercase tracking-tight text-slate-900">
              Upload Enrollment Records
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or drag an official Excel file (`.xlsx`, `.xls`) to ingest
              dataset into the system.
            </p>
          </div>

          {/* AUDIT LOGS TRIGGER BUTTON */}
          <button
            onClick={handleOpenLogsModal}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center shrink-0"
          >
            📋 View Upload Logs
          </button>
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
            id="fileInput"
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer space-y-3 block">
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

      {/* OVERWRITE CONFIRMATION MODAL */}
      {showOverwriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 transform transition-all">
            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xl shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-black font-oswald text-slate-900 uppercase tracking-tight">
                  Existing File Detected
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {duplicateDetails ||
                    "This dataset has already been uploaded previously."}
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-[11px] text-amber-900 leading-relaxed font-medium">
              Overwriting will permanently replace the existing student
              headcounts and program metrics for this specific period.
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowOverwriteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpload(true)}
                className="px-5 py-2 rounded-xl text-xs font-bold font-oswald uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-all cursor-pointer"
              >
                Yes, Overwrite Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOGS MODAL */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div>
                <h3 className="text-base font-black font-oswald text-slate-900 uppercase tracking-tight">
                  Spreadsheet Upload Audit Trail
                </h3>
                <p className="text-xs text-slate-400">
                  Historical log of enrollment file ingestion attempts
                </p>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2.5 py-1 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {logsLoading ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Loading Audit Logs...
                </div>
              ) : uploadLogs.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">File Name</th>
                      <th className="p-3">Target Year</th>
                      <th className="p-3">Uploaded By</th>
                      <th className="p-3">Date / Time</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {uploadLogs.map((log) => {
                      const isSuccess = log.status === "SUCCESS";
                      const isDup = log.status === "DUPLICATE_BLOCK";

                      return (
                        <tr key={log._id} className="hover:bg-slate-50/80">
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                isSuccess
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isDup
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-800">
                            {log.fileName}
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            {log.targetYear
                              ? formatAYLabel(log.targetYear)
                              : log.fileName?.match(/\d{4}/)?.[0]
                              ? formatAYLabel(log.fileName.match(/\d{4}/)[0])
                              : "N/A"}
                          </td>
                          <td className="p-3 text-slate-600">
                            {typeof log.uploadedBy === "object"
                              ? log.uploadedBy?.email || log.uploadedBy?.name
                              : log.uploadedBy || "admin"}
                          </td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 text-slate-500 max-w-xs truncate">
                            {log.errorMessage ||
                              `${log.recordsProcessed || 0} records processed`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No upload activity logged yet.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}