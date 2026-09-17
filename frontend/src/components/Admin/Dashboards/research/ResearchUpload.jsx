import { useState } from "react";
import api from "../../../../api/axios";
import Toast from "../../../Toast";
import UploadHistory from "./uploadHistoryResearch";

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default function ResearchUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    const fileInput = document.getElementById("researchFileInput");
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

  const handleUpload = async (shouldOverwrite = false) => {
    if (!file) return;
    setUploading(true);
    setStatusMessage(null);
    if (shouldOverwrite) setShowOverwriteModal(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (shouldOverwrite) formData.append("overwrite", "true");

      const response = await api.post("/research/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Clear the file input first (it also resets any prior message),
      // then set the success toast so batching keeps it visible.
      handleClearFile();
      setStatusMessage({
        type: "success",
        text: response.data.message || "File uploaded and processed successfully!",
        stats:
          response.data.recordsIngested !== undefined
            ? { recordsProcessed: response.data.recordsIngested }
            : null,
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
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
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
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
                Research Ingestion
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Upload the research Excel workbook with the 9 official columns
                to update the registry.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-7">
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
                id="researchFileInput"
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                    ✓
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
                    htmlFor="researchFileInput"
                    className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-800 shadow-xs hover:bg-emerald-50 transition-colors"
                  >
                    Change File
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="researchFileInput"
                  className="flex cursor-pointer flex-col items-center gap-3"
                >
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
                      Supports research workbooks with the 9 official columns (.xlsx)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

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
              className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-6 text-xs uppercase tracking-wider transition-all sm:w-auto ${
                !file || uploading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-[#580017] text-white shadow-md shadow-[#580017]/20 hover:bg-[#420011] cursor-pointer"
              }`}
            >
              {uploading ? "Processing Ingestion..." : "Upload Dataset"}
            </button>
          </div>
        </div>
      </div>

      <UploadHistory refreshTrigger={refreshTrigger} />

      <Toast toast={statusMessage} onClose={() => setStatusMessage(null)} />

      {showOverwriteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 shadow-xs">
                ⚠
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
              Overwriting will permanently replace existing research papers with
              matching titles.
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
