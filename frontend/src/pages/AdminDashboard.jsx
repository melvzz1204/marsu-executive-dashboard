import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Cohesive Institutional Color Palette
const PALETTE = {
  maroon: "#660033",
  gold: "#D4AF37",
  slateDark: "#0f172a",
  slateMuted: "#64748b",
  bgSlate: "#f8fafc",
};

export default function AdminDashboard() {
  // Database state tracking
  const [dbStatus, setDbStatus] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  // Administrative Exit Gateway Handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/"; // Direct safe exit routing to root
  };

  // Fetch current database inventory & recent upload activity logs
  const fetchAdminSystemState = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      // 1. Get summary of what years/campuses actually exist in the DB right now
      const trendRes = await axios.get("http://localhost:5000/api/v1/enrollment/trend?campus=Boac", { headers });
      
      // Let's deduce currently loaded years from your trend endpoint dynamically
      if (trendRes.data && trendRes.data.success) {
        setDbStatus(trendRes.data.data);
      }

      // 2. Mock or fetch a list of recent files processed (Audit Trail)
      // If your backend doesn't have an audit endpoint yet, we fallback to a clean system placeholder
      setRecentUploads([
        { id: 1, filename: "enrollment_report_2023_boac.xlsx", campus: "Boac", academicYear: 2023, dateUploaded: "2026-04-12", status: "Success", rowsImported: 240 },
        { id: 2, filename: "enrollment_report_2022_gasan.xlsx", campus: "Gasan", academicYear: 2022, dateUploaded: "2026-03-08", status: "Success", rowsImported: 185 },
        { id: 3, filename: "erroneous_schema_v2.xlsx", campus: "Unknown", academicYear: null, dateUploaded: "2026-02-28", status: "Failed", rowsImported: 0 },
      ]);
    } catch (err) {
      console.error("Error syncing administrative diagnostics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminSystemState();
  }, []);

  // Handle Drag over states
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Upload Submission Handler via Axios
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadMessage({ type: "error", text: "Please select or drop an Excel spreadsheet file." });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadMessage({ type: "", text: "" });

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Simulate progress bar movement for larger file parser sequences
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 80 ? 85 : prev + 15));
      }, 300);

      const response = await axios.post(
        "http://localhost:5000/api/v1/enrollment/upload",
        formData,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data && response.data.success) {
        setUploadMessage({
          type: "success",
          text: response.data.message || "File ingested successfully! Database records compiled."
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Refresh admin telemetry
        fetchAdminSystemState();
      } else {
        setUploadMessage({
          type: "error",
          text: response.data.error || "File validation failed during parser check."
        });
      }
    } catch (err) {
      console.error(err);
      const errorText = err.response?.data?.error || "Network pipeline exception.";
      setUploadMessage({ type: "error", text: errorText });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Safe purge database action handler (Optional utility)
  const handleDatabaseReset = async () => {
    if (!window.confirm("Warning: This action will permanently drop collection arrays. Proceed?")) return;
    
    try {
      const token = localStorage.getItem("token");
      // Simulate/trigger a delete call if you have a DELETE endpoint
      await axios.delete("http://localhost:5000/api/v1/enrollment/purge", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      alert("Database purged successfully.");
      fetchAdminSystemState();
    } catch (err) {
      alert("Unable to complete DB reset sequence.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-4 md:p-8 rounded-2xl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER BRANDING & ACTION PORTAL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#660033]">
              System Command Console
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Registrar Administrative Portal
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Super Admin Access: Active
            </div>
            
            {/* Interactive Logout Control Trigger */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all shadow-sm hover:border-[#660033] hover:text-[#660033]"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5} 
                stroke="currentColor" 
                className="w-3.5 h-3.5"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" 
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* WORKSPACE SECTIONS: UPLOAD + DIAGNOSTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT/CENTER COLUMN: INGESTION PIPELINE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* FILE DROPZONE CARD */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Import Excel Telemetry</h2>
                <p className="text-xs text-slate-400">Load MarSU Registrar master student enrollment reports into database.</p>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                    selectedFile
                      ? "border-emerald-300 bg-emerald-50/20"
                      : "border-slate-200 hover:border-[#660033] hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />

                  <div className={`p-4 rounded-2xl ${selectedFile ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>

                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 truncate max-w-[400px]">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 font-mono">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700">Drag & drop your Excel workbook file here</p>
                      <p className="text-xs text-slate-400">or click to browse local folders (supports spreadsheet format .xlsx)</p>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {uploading && (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#660033] h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                {/* Status messages */}
                {uploadMessage.text && (
                  <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                    uploadMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                      : "bg-rose-50 text-rose-800 border-rose-100"
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    <p className="flex-1 leading-relaxed">{uploadMessage.text}</p>
                  </div>
                )}

                {/* Trigger Buttons */}
                <div className="flex gap-3 justify-end pt-2">
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadMessage({ type: "", text: "" });
                      }}
                      className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all"
                    >
                      Clear File
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="px-6 py-2.5 bg-[#660033] hover:bg-[#520029] text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading ? "Ingesting System Stream..." : "Compile & Load Registry Data"}
                  </button>
                </div>
              </form>
            </div>

            {/* AUDIT LOG: HISTORY OF RECENT FILE INGESTIONS */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Upload History Audit Log</h3>
                <p className="text-[11px] text-slate-400">Trace log of file upload events processed by system engine</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Import Date</th>
                      <th className="px-6 py-3">Filename</th>
                      <th className="px-6 py-3">Campus Target</th>
                      <th className="px-6 py-3 text-right">Inserted Records</th>
                      <th className="px-6 py-3 text-center">Engine Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                    {recentUploads.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono">
                          {log.dateUploaded}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-950 truncate max-w-xs">
                          {log.filename}
                        </td>
                        <td className="px-6 py-4">
                          {log.campus} {log.academicYear ? `(AY {log.academicYear})` : ""}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-900 font-bold">
                          {log.rowsImported > 0 ? log.rowsImported.toLocaleString() : "—"}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                            log.status === "Success"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: SYSTEM STATE / UTILITIES */}
          <div className="space-y-6">
            
            {/* DATABASE STATE SUMMARY */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Database Index Status</h3>
                <p className="text-[11px] text-slate-400 font-medium">Currently parsed operational indices inside MongoDB:</p>
              </div>

              {dbStatus.length > 0 ? (
                <div className="space-y-2">
                  {dbStatus.map((record, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                        <span className="text-slate-700">Academic Year {record.academicYear || record.label}</span>
                      </div>
                      <span className="font-mono text-slate-400">{(record.totalStudents || 0).toLocaleString()} students</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 font-semibold italic border border-slate-100">
                  Zero active database indicators logged.
                </div>
              )}
            </div>

            {/* DANGEROUS SYSTEM UTILITIES */}
            <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-rose-950">System Recovery Utilities</h3>
                <p className="text-[11px] text-rose-700 font-medium">Administrative tools with permanent destructive effects.</p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleDatabaseReset}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm border border-rose-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Purge Student Collections
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}