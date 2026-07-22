import React, { useState } from "react";

const API_BASE_URL = "http://localhost:5000/api/v1/enrollment";

export default function AdminDashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("enrollments");

  const [openSubmenus, setOpenSubmenus] = useState({
    "support-op": false,
    gass: false,
  });

  // File Upload States
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Academic Year Modal States
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [academicYearInput, setAcademicYearInput] = useState("2021-2022");

  // Dynamic Ingestion History Log State (Empty by default for fresh DB)
  const [uploadHistory, setUploadHistory] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const navItems = [
    {
      id: "higher-ed",
      label: "Higher Education",
      icon: (
        <svg
          className="w-5 h-5 text-[#D4AF37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 14l9-5-9-5-9 5 9 5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
          />
        </svg>
      ),
    },
    {
      id: "advance-ed",
      label: "Advance Education",
      icon: (
        <svg
          className="w-5 h-5 text-[#D4AF37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l-2 2m2-2l2 2"
          />
        </svg>
      ),
    },
    {
      id: "research",
      label: "Research",
      icon: (
        <svg
          className="w-5 h-5 text-[#D4AF37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
    },
    {
      id: "support-op",
      label: "Support to Operation",
      icon: (
        <svg
          className="w-5 h-5 text-[#D4AF37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      children: [
        {
          id: "quality-system-auxiliary-advocacies",
          label: "Quality System, Auxiliary & Advocacies",
        },
        {
          id: "professional-development-capability-building",
          label: "Professional Development & Capability Building",
        },
      ],
    },
    {
      id: "gass",
      label: "General Administration & Support Services",
      icon: (
        <svg
          className="w-5 h-5 text-[#D4AF37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0l-2 2m2-2l2 2"
          />
        </svg>
      ),
      children: [
        { id: "financial-services", label: "Financial Services" },
        { id: "administrative-services", label: "Administrative Services" },
      ],
    },
    {
      id: "achievements",
      label: "Achievements",
      icon: (
        <svg
          className="w-5 h-5 text-[#D4AF37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
    {
      id: "enrollments",
      label: "Enrollments",
      icon: (
        <svg
          className="w-5 h-5 text-[#D4AF37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      id: "budget",
      label: "Budget Utilization",
      icon: (
        <svg
          className="w-5 h-5 text-[#D4AF37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  const getActiveCategory = (id) => {
    for (const item of navItems) {
      if (item.id === id) return item;
      if (item.children) {
        const child = item.children.find((c) => c.id === id);
        if (child) return child;
      }
    }
    return navItems[0];
  };

  const activeCategory = getActiveCategory(activeTab);

  const toggleSubmenu = (id) => {
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
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

  const resetUploadState = () => {
    setSelectedFile(null);
    setUploadSuccess(false);
    setUploadError(null);
  };

  // EXECUTE BACKEND INGESTION WITH USER SELECTED ACADEMIC YEAR
  const executeUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setIsYearModalOpen(false);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", activeTab);
      formData.append("academicYear", academicYearInput);

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const detailMsg =
          data?.error ||
          data?.message ||
          `HTTP Error ${response.status}: Failed to process spreadsheet ingestion.`;
        throw new Error(detailMsg);
      }

      // Append newly uploaded file to dynamic history log
      const newHistoryRecord = {
        id: `hist-${Date.now()}`,
        filename: selectedFile.name,
        category: `Enrollments (${academicYearInput})`,
        date: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        size: `${(selectedFile.size / 1024).toFixed(1)} KB`,
        status: "Ingested",
      };

      setUploadHistory((prev) => [newHistoryRecord, ...prev]);
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNavClick = (id) => {
    setActiveTab(id);
    resetUploadState();
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      {/* MAROON SIDEBAR */}
      <aside className="w-80 bg-[#580017] text-white flex flex-col justify-between border-r border-[#D4AF37]/20 shadow-2xl flex-shrink-0">
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header Title */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black font-oswald uppercase tracking-wider text-white">
                Admin Control
              </h2>
              <span className="text-[10px] text-[#D4AF37] font-mono tracking-widest block uppercase">
                MarSU Data Portal
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 my-2">
            {navItems.map((item) => {
              const hasChildren = Boolean(
                item.children && item.children.length > 0,
              );
              const isChildActive = item.children?.some(
                (child) => child.id === activeTab,
              );
              const isParentActive = activeTab === item.id || isChildActive;
              const isOpen = openSubmenus[item.id];

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (hasChildren) toggleSubmenu(item.id);
                      else handleNavClick(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 text-left cursor-pointer ${
                      isParentActive
                        ? "bg-white/10 text-white font-black shadow-lg border-l-4 border-[#D4AF37]"
                        : "text-slate-200 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 pr-2">
                      <div className="flex-shrink-0">{item.icon}</div>
                      <span className="text-xs font-bold font-oswald uppercase tracking-wide leading-tight">
                        {item.label}
                      </span>
                    </div>

                    {hasChildren && (
                      <svg
                        className={`w-4 h-4 text-[#D4AF37] transition-transform duration-200 flex-shrink-0 ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>

                  {hasChildren && isOpen && (
                    <div className="pl-9 pr-1 py-1 space-y-1 border-l-2 border-[#D4AF37]/20 ml-5">
                      {item.children.map((child) => {
                        const isSelected = activeTab === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleNavClick(child.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#ffffff] text-[#580017] font-black shadow-sm"
                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                            <span className="leading-tight">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="px-3 pt-4 pb-4 mt-auto border-t border-white/10 bg-[#4a0013]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs tracking-wide text-rose-200 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-200 w-full cursor-pointer"
          >
            <span className="text-rose-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </span>
            <span className="font-oswald tracking-wide text-sm uppercase">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* WORKSPACE AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#580017] bg-[#580017]/5 px-2.5 py-0.5 rounded">
                Target Collection
              </span>
              <span className="text-slate-300">•</span>
            </div>
            <h1 className="text-2xl font-black font-oswald uppercase text-slate-900 tracking-tight mt-1">
              {activeCategory?.label}
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

        <div className="p-8 max-w-4xl w-full mx-auto space-y-8">
          {/* UPLOAD FILE ZONE */}
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative bg-white rounded-3xl border-2 border-dashed p-10 text-center transition-all shadow-sm ${
                dragActive
                  ? "border-[#580017] bg-[#580017]/[0.02]"
                  : selectedFile
                    ? "border-emerald-400 bg-emerald-50/20"
                    : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-[#580017] flex items-center justify-center border border-slate-200 shadow-sm">
                  <svg
                    className="w-7 h-7"
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      Ready to Ingest
                    </span>
                    <p className="text-base font-bold text-slate-900 font-mono">
                      {selectedFile.name}
                    </p>
                    <span className="text-xs text-slate-400 block font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-800">
                      Drop spreadsheet file here or click to browse
                    </p>
                    <p className="text-xs text-slate-400">
                      Upload official{" "}
                      <span className="font-semibold text-slate-600">
                        .XLSX
                      </span>{" "}
                      files for {activeCategory?.label}
                    </p>
                  </div>
                )}

                {!selectedFile && (
                  <span className="inline-block mt-2 px-5 py-2 text-xs font-bold text-[#580017] bg-[#580017]/5 rounded-xl border border-[#580017]/10 uppercase font-oswald tracking-wider">
                    Select Excel File
                  </span>
                )}
              </div>
            </div>

            {/* Upload Error Display */}
            {uploadError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center justify-between">
                <span>⚠ {uploadError}</span>
                <button
                  onClick={() => setUploadError(null)}
                  className="text-rose-500 hover:text-rose-800 text-xs font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* ACTION STATUS & CONTINUOUS UPLOAD BAR */}
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">
                {uploadSuccess
                  ? "✓ Spreadsheet processed and synchronized with cluster."
                  : selectedFile
                    ? "File attached. Click Upload Data to specify year and ingest."
                    : "Ready for continuous file upload."}
              </span>

              <div className="flex gap-3">
                {/* Clear / Reset Button */}
                {selectedFile && !uploadSuccess && (
                  <button
                    type="button"
                    onClick={resetUploadState}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase font-oswald cursor-pointer"
                  >
                    Clear File
                  </button>
                )}

                {/* Upload Action Button - Opens Modal */}
                {uploadSuccess ? (
                  <button
                    type="button"
                    onClick={resetUploadState}
                    className="px-6 py-3 rounded-xl bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider font-oswald shadow-md hover:bg-emerald-800 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>+ Upload Another File</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!selectedFile || isUploading}
                    onClick={() => setIsYearModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-[#580017] text-white text-xs font-bold uppercase tracking-wider font-oswald shadow-md hover:bg-[#6e001d] transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#D4AF37]/30 flex items-center gap-2 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Executing Ingestion...
                      </>
                    ) : (
                      "Upload Data"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DYNAMIC UPLOAD HISTORY LOG (BOTTOM TABLE) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase font-oswald text-slate-900 tracking-wider">
                  Ingestion History & File Log
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track of all processed spreadsheet files in this workspace
                  session
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                {uploadHistory.length} File
                {uploadHistory.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Filename</th>
                    <th className="py-2.5 px-3">Category Target</th>
                    <th className="py-2.5 px-3">Date / Time</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {uploadHistory.length > 0 ? (
                    uploadHistory.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-3 font-mono font-semibold text-slate-900 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-emerald-600 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {item.filename}
                        </td>
                        <td className="py-3.5 px-3 font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono">
                          {item.date}
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono">
                          {item.size}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ● {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-slate-400 font-mono text-xs"
                      >
                        No files ingested yet in this workspace session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ACADEMIC YEAR INPUT MODAL */}
      {isYearModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#580017]">
                  Ingestion Metadata
                </span>
                <h3 className="text-xl font-black font-oswald text-slate-900 uppercase">
                  Specify Academic Year
                </h3>
              </div>
              <button
                onClick={() => setIsYearModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-sans">
              <p className="text-xs text-slate-500">
                Please specify the target academic year for this spreadsheet.
                This value updates the active academic year tabs on the public
                Enrollment Dashboard.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-oswald mb-1">
                  Academic Year Target (e.g. 2021-2022, 2022-2023)
                </label>
                <input
                  type="text"
                  value={academicYearInput}
                  onChange={(e) => setAcademicYearInput(e.target.value)}
                  placeholder="2022-2023"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-[#580017] bg-slate-50"
                  autoFocus
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-mono">
                ℹ File: <span className="font-bold">{selectedFile?.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsYearModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold font-oswald text-slate-500 hover:text-slate-800 uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeUpload}
                className="px-6 py-2.5 rounded-xl bg-[#580017] text-white text-xs font-bold uppercase font-oswald shadow-md hover:bg-[#6e001d] cursor-pointer"
              >
                Confirm & Upload Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
