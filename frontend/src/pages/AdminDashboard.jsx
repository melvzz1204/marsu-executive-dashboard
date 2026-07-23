import React, { useState, useEffect } from "react";
import Sidebar from "../components/Admin/sideBar";

export default function AdminDashboard() {
  // Navigation state
  const [activeTab, setActiveTab] = useState("enrollments");

  // File Upload States
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Academic Year & Semester Modal States (Strictly for Enrollment)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [academicYearInput, setAcademicYearInput] = useState("");
  const [semester, setSemester] = useState("1st Sem");

  // Dynamic Upload Audit History State (Initializes from LocalStorage)
  const [uploadHistory, setUploadHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("uploadHistory");
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error("Failed to load upload history from localStorage:", err);
      return [];
    }
  });

  // Sync uploadHistory state to LocalStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("uploadHistory", JSON.stringify(uploadHistory));
    } catch (err) {
      console.error("Failed to save upload history to localStorage:", err);
    }
  }, [uploadHistory]);

  // Display label mapping for headers & context text
  const categoryLabels = {
    "higher-ed": "Higher Education",
    "advance-ed": "Advance Education",
    research: "Research",
    "support-op": "Support to Operation",
    "quality-system-auxiliary-advocacies":
      "Quality System, Auxiliary & Advocacies",
    "professional-development-capability-building":
      "Professional Development & Capability Building",
    gass: "General Administration & Support Services",
    "financial-services": "Financial Services",
    "administrative-services": "Administrative Services",
    achievements: "Achievements",
    enrollments: "Enrollments",
    budget: "Budget Utilization",
  };

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadSuccess(false);
      setUploadError(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess(false);
      setUploadError(null);
    }
  };

  // Upload Router: Opens modal for Enrollments, uploads directly for other tabs
  const handleUploadClick = () => {
    if (!selectedFile) return;
    setUploadError(null);

    if (activeTab === "enrollments") {
      setIsModalOpen(true);
    } else {
      executeGenericUpload();
    }
  };

  // Enrollment Upload Execution -> CONNECTED TO /api/v1/enrollment/upload
  const confirmAndExecuteEnrollmentUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("academicYear", academicYearInput);
      formData.append("semester", semester);

      const response = await fetch(
        "http://localhost:5000/api/v1/enrollment/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process enrollment file.");
      }

      setUploadSuccess(true);
      setIsModalOpen(false);

      // Record entry in local state (useEffect will persist it to LocalStorage)
      setUploadHistory((prev) => [
        {
          id: Date.now(),
          category: activeTab,
          filename: selectedFile.name,
          records: result.recordsIngested
            ? `${result.recordsIngested} group(s)`
            : "Processed",
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status: "uploaded",
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Enrollment upload error:", err);
      setUploadError(err.message || "Failed to upload enrollment file.");
    } finally {
      setIsUploading(false);
    }
  };

  // Direct Generic Upload (For Non-Enrollment categories)
  const executeGenericUpload = async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `http://localhost:5000/api/v1/${activeTab}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to upload ${categoryLabels[activeTab]} file.`,
        );
      }

      setUploadSuccess(true);

      // Record entry in local state (useEffect will persist it to LocalStorage)
      setUploadHistory((prev) => [
        {
          id: Date.now(),
          category: activeTab,
          filename: selectedFile.name,
          records: result.recordsIngested
            ? `${result.recordsIngested} group(s)`
            : "Processed",
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status: "uploaded",
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Generic upload error:", err);
      setUploadError(err.message || "Failed to upload file to backend.");
    } finally {
      setIsUploading(false);
    }
  };

  // Tab switch handler resets file upload state
  const handleNavClick = (id) => {
    setActiveTab(id);
    setSelectedFile(null);
    setUploadSuccess(false);
    setUploadError(null);
    setIsModalOpen(false);
  };

  // Helper to clear stored history if needed
  const handleClearHistory = () => {
    setUploadHistory((prev) =>
      prev.filter((item) => item.category !== activeTab),
    );
  };

  // Filter audit history by the active tab category
  const filteredHistory = uploadHistory.filter(
    (item) => item.category === activeTab,
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* 1. SIDEBAR COMPONENT */}
      <Sidebar activeTab={activeTab} onNavClick={handleNavClick} />

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#580017] bg-[#580017]/5 px-2.5 py-0.5 rounded">
                Target Collection
              </span>
              <span className="text-slate-300">•</span>
            </div>
            <h1 className="text-2xl font-black font-oswald uppercase text-slate-900 tracking-tight mt-1">
              {categoryLabels[activeTab] || "Overview"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold block text-slate-800 font-oswald uppercase">
                System Administrator
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#580017] text-[#D4AF37] flex items-center justify-center font-oswald text-sm font-bold border-2 border-[#D4AF37]/30">
              SA
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* DRAG AND DROP ZONE */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative bg-white rounded-3xl border-2 border-dashed p-12 text-center transition-all shadow-sm ${
              dragActive
                ? "border-[#580017] bg-[#580017]/[0.02]"
                : selectedFile
                  ? "border-emerald-400 bg-emerald-50/20"
                  : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 text-[#580017] flex items-center justify-center border border-slate-200 shadow-sm">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z"
                  />
                </svg>
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Ready to Ingest
                  </span>
                  <p className="text-base font-bold text-slate-900">
                    {selectedFile.name}
                  </p>
                  <span className="text-xs text-slate-400 block">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-800">
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs text-slate-400">
                    Upload official{" "}
                    <span className="font-semibold text-slate-600">.XLSX</span>{" "}
                    files for {categoryLabels[activeTab]}
                  </p>
                </div>
              )}

              {!selectedFile && (
                <span className="inline-block mt-2 px-5 py-2.5 text-xs font-bold text-[#580017] bg-[#580017]/5 rounded-xl border border-[#580017]/10 uppercase font-oswald tracking-wider">
                  Select Excel File
                </span>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {uploadSuccess
                  ? "✓ Data processed and synchronized with MongoDB."
                  : selectedFile
                    ? activeTab === "enrollments"
                      ? "File attached. Click Upload Data to configure Academic Year target."
                      : "File attached. Click Upload Data to process."
                    : "No file selected."}
              </span>
            </div>

            <div className="flex gap-3">
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadSuccess(false);
                    setUploadError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase font-oswald cursor-pointer"
                >
                  Clear File
                </button>
              )}

              <button
                type="button"
                disabled={!selectedFile || isUploading}
                onClick={handleUploadClick}
                className="px-6 py-3 rounded-xl bg-[#580017] text-white text-xs font-bold uppercase tracking-wider font-oswald shadow-md hover:bg-[#6e001d] transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#D4AF37]/30 flex items-center gap-2 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Executing Upload...
                  </>
                ) : uploadSuccess ? (
                  "✓ Ingested Successfully"
                ) : (
                  "Upload Data"
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs">
              ⚠️ Upload Error: {uploadError}
            </div>
          )}

          {/* Persistent Audit History */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase font-oswald text-slate-900 tracking-wider">
                Data History
              </h3>
              {filteredHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 uppercase font-oswald transition-colors"
                >
                  Clear Category History
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Filename</th>
                    <th className="py-2.5 px-3">Groups Ingested</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {item.filename}
                        </td>
                        <td className="py-3 px-3">{item.records}</td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {item.date}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            ● {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-8 text-center text-slate-400 font-medium text-xs"
                      >
                        No upload history available for{" "}
                        {categoryLabels[activeTab]}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* 3. ENROLLMENT ACADEMIC YEAR MODAL */}
      {isModalOpen && activeTab === "enrollments" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-fade-in relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#580017] uppercase tracking-widest block">
                  Enrollment Data Ingestion
                </span>
                <h3 className="text-xl font-black font-oswald text-slate-900 uppercase tracking-tight mt-0.5">
                  Set Academic Period Filter
                </h3>
              </div>
              <button
                onClick={() => !isUploading && setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#580017]/10 text-[#580017] flex items-center justify-center font-bold">
                  📄
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 uppercase block truncate">
                    Attached Spreadsheet
                  </span>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {selectedFile?.name}
                  </p>
                </div>
              </div>

              {/* Academic Year Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase font-oswald text-slate-700 tracking-wide block">
                  Academic Year Filter (Optional)
                </label>
                <input
                  type="text"
                  value={academicYearInput}
                  onChange={(e) => setAcademicYearInput(e.target.value)}
                  placeholder="e.g. 2022 or 2022-2023 (Leave blank to ingest all tabs)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#580017] text-sm text-slate-900 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase font-oswald cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isUploading}
                onClick={confirmAndExecuteEnrollmentUpload}
                className="px-6 py-3 rounded-xl bg-[#580017] text-white text-xs font-bold uppercase tracking-wider font-oswald shadow-md hover:bg-[#6e001d] transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#D4AF37]/30 flex items-center gap-2 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  "Confirm Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
