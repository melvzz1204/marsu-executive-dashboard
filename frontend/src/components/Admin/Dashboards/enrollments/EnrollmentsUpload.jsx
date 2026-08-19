import { useState } from "react";
import UploadHistory from "./uploadHistoryEnrollment";
import { API_BASE_URL } from "../../../../api/axios";

// Helper function to format bytes into human-readable sizes
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function EnrollmentsUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Trigger to auto-refresh UploadHistory table on new upload
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State for drag highlight animation
  const [isDragging, setIsDragging] = useState(false);

  // Modal State for Duplicate Overwrite Prompt
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState("");

  const API_BASE = `${API_BASE_URL}/enrollment`;

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

      // ⚠️ DUPLICATE DETECTED: Trigger the Overwrite Modal
      if (response.status === 409 && json.isDuplicate) {
        setDuplicateDetails(json.message);
        setShowOverwriteModal(true);
        setUploading(false);
        return;
      }

      if (!response.ok || !json.success) {
        throw new Error(
          json.message || json.error || "Failed to upload dataset.",
        );
      }

      // SUCCESS
      setStatusMessage({
        type: "success",
        text: json.message || "File uploaded and processed successfully!",
      });
      handleClearFile();
      setRefreshTrigger((prev) => prev + 1); // Refresh history table
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
    <div className="space-y-8 font-sans">
      {/* MAIN CARD CONTAINER */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
        {/* Header Banner */}
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#580017] text-white shadow-md shadow-[#580017]/20">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#580017]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#580017]">
                  Data Management
                </span>
              </div>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
                Enrollment Data Intake
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Upload official institutional Excel workbooks to record student
                headcounts and academic metrics.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* UPLOAD STATUS BANNER */}
          {statusMessage && (
            <div
              className={`rounded-xl border p-4 transition-all duration-300 ${
                statusMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50/90 text-emerald-900 shadow-sm"
                  : "border-rose-200 bg-rose-50/90 text-rose-900 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm shadow-xs">
                    {statusMessage.type === "success" ? "✅" : "⚠️"}
                  </span>
                  <p className="text-xs font-bold leading-snug">
                    {statusMessage.text}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 cursor-pointer"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* INTERACTIVE DROPZONE AREA */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              Upload Enrollment Workbook
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                isDragging
                  ? "border-[#580017] bg-[#580017]/10 scale-[1.005]"
                  : file
                    ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                    : "border-slate-300 bg-slate-50/60 hover:border-[#580017]/50 hover:bg-slate-50"
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                id="fileInput"
                className="hidden"
              />

              {file ? (
                /* Attached File View */
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="max-w-md space-y-1">
                    <p className="break-all text-sm font-extrabold text-emerald-950">
                      {file.name}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-700">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span className="uppercase tracking-wider">
                        Excel Workbook
                      </span>
                    </div>
                  </div>
                  <label
                    htmlFor="fileInput"
                    className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 transition-colors"
                  >
                    Change File
                  </label>
                </div>
              ) : (
                /* Empty / Drop Target View */
                <label
                  htmlFor="fileInput"
                  className="flex cursor-pointer flex-col items-center gap-3"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all shadow-xs ${
                      isDragging
                        ? "bg-[#580017] text-white scale-110"
                        : "bg-white border border-slate-200 text-[#580017]"
                    }`}
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">
                      {isDragging ? (
                        <span className="text-[#580017]">
                          Drop Excel workbook right here
                        </span>
                      ) : (
                        <>
                          <span className="text-[#580017] underline underline-offset-2">
                            Click to browse
                          </span>{" "}
                          or drag and drop workbook
                        </>
                      )}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      Supports Microsoft Excel spreadsheets (.xlsx, .xls)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col-reverse items-center justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            {file && (
              <button
                type="button"
                onClick={handleClearFile}
                disabled={uploading}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto cursor-pointer"
              >
                Clear File
              </button>
            )}

            <button
              type="button"
              onClick={() => handleUpload(false)}
              disabled={!file || uploading}
              className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-6 text-xs font-extrabold uppercase tracking-wider transition-all sm:w-auto ${
                !file || uploading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-[#580017] text-white shadow-md shadow-[#580017]/20 hover:bg-[#420011] cursor-pointer"
              }`}
            >
              {uploading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing Ingestion...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  upload Dataset
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOUNTED UPLOAD HISTORY TABLE */}
      <UploadHistory refreshTrigger={refreshTrigger} />

      {/* DUPLICATE OVERWRITE MODAL */}
      {showOverwriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 shadow-xs">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                  Existing File Detected
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {duplicateDetails ||
                    "This dataset has already been uploaded previously."}
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-[11px] font-medium leading-relaxed text-amber-900">
              Overwriting will permanently replace the existing student
              headcounts and program metrics for this specific period.
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setShowOverwriteModal(false)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpload(true)}
                className="h-10 rounded-xl bg-rose-600 px-5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-rose-600/20 transition-all hover:bg-rose-700 cursor-pointer"
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
