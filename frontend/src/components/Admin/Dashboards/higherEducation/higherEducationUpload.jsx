import { useState } from "react";
import api from "../../../../api/axios";
import UploadHistory from "./uploadHistoryHigherEducation";

// Helper function to format bytes into readable sizes
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function HigherEducationUpload() {
  // File Upload State
  const [file, setFile] = useState(null);
  const [datasetType, setDatasetType] = useState("higherEducation");
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Modal State
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState("");

  // History Refresh Trigger State
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ==========================================
  // FILE HANDLING EVENT HANDLERS
  // ==========================================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
      e.target.value = "";
      setFile(null);
      setStatusMessage({
        type: "error",
        text: "Invalid file format. Please select a Microsoft Excel (.xlsx) workbook.",
      });
      return;
    }

    setFile(selectedFile);
    setStatusMessage(null);
  };

  const handleClearFile = () => {
    setFile(null);
    setStatusMessage(null);
    const fileInput = document.getElementById("fileInput");
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
      if (droppedFile.name.toLowerCase().endsWith(".xlsx")) {
        setFile(droppedFile);
        setStatusMessage(null);
      } else {
        setStatusMessage({
          type: "error",
          text: "Invalid file format. Please drop a valid Microsoft Excel (.xlsx) file.",
        });
      }
    }
  };

  // ==========================================
  // MAIN UPLOAD PROCESS
  // ==========================================
  const handleUpload = async (shouldOverwrite = false) => {
    if (!file) return;

    setUploading(true);
    setStatusMessage(null);
    if (shouldOverwrite) setShowOverwriteModal(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadEndpoint =
        datasetType === "licensure"
          ? "/higher-education/licensure/upload"
          : "/higher-education/upload";

      if (shouldOverwrite) {
        formData.append("overwrite", "true");
      }

      const response = await api.post(uploadEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // SUCCESS
      setStatusMessage({
        type: "success",
        text:
          response.data.message || "File uploaded and processed successfully!",
        stats:
          response.data.stats ||
          (response.data.count !== undefined
            ? { recordsProcessed: response.data.count }
            : null),
      });

      handleClearFile();
      setRefreshTrigger((prev) => prev + 1); // Trigger history table reload
    } catch (err) {
      // DUPLICATE DETECTED: Trigger Overwrite Modal
      if (err.response?.status === 409 && err.response?.data?.isDuplicate) {
        setDuplicateDetails(err.response.data.message);
        setShowOverwriteModal(true);
      } else {
        setStatusMessage({
          type: "error",
          text:
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Failed to upload dataset.",
        });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* MAIN INTAKE CARD */}
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
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
                Higher Education Ingestion
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Upload institutional Excel workbooks to update registries,
                graduates, tracer stats, and exam results.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-7">
          {/* STEP 1: SELECT DATASET TYPE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white font-extrabold">
                  1
                </span>
                Select Target Dataset Type
              </label>
              <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                Required
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Dataset 1 Card */}
              <label
                className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-4 transition-all duration-200 ${
                  datasetType === "higherEducation"
                    ? "border-[#580017] bg-[#580017]/[0.03] shadow-sm ring-1 ring-[#580017]"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <input
                  type="radio"
                  name="higherEducationDatasetType"
                  value="higherEducation"
                  checked={datasetType === "higherEducation"}
                  onChange={() => {
                    setDatasetType("higherEducation");
                    setFile(null);
                    setStatusMessage(null);
                  }}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        datasetType === "higherEducation"
                          ? "border-[#580017]/20 bg-[#580017]/10 text-[#580017]"
                          : "border-slate-200 bg-slate-100 text-slate-500"
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider text-slate-900">
                        Program & Tracer Records
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Institutional Registry
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      datasetType === "higherEducation"
                        ? "border-[#580017] bg-[#580017] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {datasetType === "higherEducation" && (
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500 font-medium">
                  Includes academic accreditation registry, graduate totals per
                  campus, and employability tracer studies.
                </p>
              </label>

              {/* Dataset 2 Card */}
              <label
                className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-4 transition-all duration-200 ${
                  datasetType === "licensure"
                    ? "border-[#580017] bg-[#580017]/[0.03] shadow-sm ring-1 ring-[#580017]"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <input
                  type="radio"
                  name="higherEducationDatasetType"
                  value="licensure"
                  checked={datasetType === "licensure"}
                  onChange={() => {
                    setDatasetType("licensure");
                    setFile(null);
                    setStatusMessage(null);
                  }}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        datasetType === "licensure"
                          ? "border-[#580017]/20 bg-[#580017]/10 text-[#580017]"
                          : "border-slate-200 bg-slate-100 text-slate-500"
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider text-slate-900">
                        Licensure Examination
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        PRC Board Exams
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      datasetType === "licensure"
                        ? "border-[#580017] bg-[#580017] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {datasetType === "licensure" && (
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500 font-medium">
                  Supports multi-sheet PRC examination results grouped by
                  academic discipline, year, and pass rates.
                </p>
              </label>
            </div>
          </div>

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

              {/* STATS METRIC CHIPS */}
              {statusMessage.stats && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-emerald-200/60 pt-3 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100/90 px-2.5 py-1 font-semibold text-emerald-950">
                    <svg
                      className="h-3.5 w-3.5 text-emerald-700"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {datasetType === "licensure"
                      ? "Licensure Records Ingested:"
                      : "Programs Ingested:"}{" "}
                    <strong className="font-extrabold text-emerald-900">
                      {statusMessage.stats.programsProcessed ||
                        statusMessage.stats.recordsProcessed ||
                        0}
                    </strong>
                  </span>

                  {datasetType === "higherEducation" && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100/90 px-2.5 py-1 font-semibold text-emerald-950">
                      <svg
                        className="h-3.5 w-3.5 text-emerald-700"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                      </svg>
                      Tracer & Graduate Records:{" "}
                      <strong className="font-extrabold text-emerald-900">
                        {statusMessage.stats.tracerRecordsProcessed || 0}
                      </strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: INTERACTIVE DROPZONE AREA */}
          <div className="space-y-3">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex min-h-[190px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                isDragging
                  ? "border-[#580017] bg-[#580017]/10 scale-[1.005]"
                  : file
                    ? "border-emerald-500 bg-emerald-50/40 shadow-xs"
                    : "border-slate-300 bg-slate-50/60 hover:border-[#580017]/50 hover:bg-slate-50"
              }`}
            >
              <input
                type="file"
                accept=".xlsx"
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
                      {datasetType === "licensure"
                        ? "Supports multi-sheet PRC licensure performance workbooks (.xlsx)"
                        : "Supports program registry, graduate counts, and employability tracer sheets (.xlsx)"}
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
                Clear Selected File
              </button>
            )}

            <button
              type="button"
              onClick={() => handleUpload(false)}
              disabled={!file || uploading}
              className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-6 text-xs  uppercase tracking-wider transition-all sm:w-auto ${
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

      {/* SEPARATE UPLOAD HISTORY COMPONENT */}
      <UploadHistory refreshTrigger={refreshTrigger} />

      {/* OVERWRITE CONFIRMATION MODAL */}
      {showOverwriteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
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
                  Existing Dataset Conflict
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {duplicateDetails ||
                    "This dataset contains records that have already been uploaded previously."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-[11px] font-medium leading-relaxed text-amber-900">
              {datasetType === "licensure"
                ? "Overwriting will permanently replace existing licensure exam pass rates for matching years and programs."
                : "Overwriting will permanently replace existing program registries, graduate counts, and employability tracer metrics for these records."}
            </div>

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
