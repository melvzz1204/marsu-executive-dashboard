import React, { useState } from "react";

function Reports() {
  const [selectedYear, setSelectedYear] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  // Helper function to handle secure binary file downloads from the backend stream
  const downloadReport = async (format) => {
    const setLoader = format === "pdf" ? setIsDownloadingPdf : setIsDownloadingCsv;
    setLoader(true);

    try {
      // Build query string based on the selected filter state
      let url = `http://localhost:5000/api/v1/reports/institutional/${format}`;
      if (selectedYear) {
        url += `?year=${selectedYear}`;
      }

      // Fetch the file buffer from the API
      const response = await fetch(url, {
        method: "GET",
        headers: {
          // If you store your JWT token in localStorage, attach it here:
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download report (${response.status})`);
      }

      // Convert response stream to a browser blob document link
      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary hidden anchor tag to trigger a native download prompt
      const tempLink = document.createElement("a");
      tempLink.href = fileUrl;
      tempLink.setAttribute(
        "download",
        `Institutional_Report_${selectedYear || "Master"}.${format === "csv" ? "xlsx" : "pdf"}` // 💡 Extension fallback rewrite
      );
      
      document.body.appendChild(tempLink);
      tempLink.click();
      
      // Cleanup DOM
      tempLink.parentNode.removeChild(tempLink);
      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error("Export Error:", error);
      alert(`Error generating report: ${error.message}`);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">
          Institutional Reports & Data Export Panel
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Compile and download official records across all active licensure modules and global metrics.
        </p>
      </div>

      {/* Filter Block Area */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Report Configuration Filters
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-64">
            <label className="block text-xs font-medium text-gray-600 uppercase mb-1">
              Filter Academic Period / Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Show All Recorded Years (Global Sweep)</option>
              <option value="2026">Academic Period 2026</option>
              <option value="2025">Academic Period 2025</option>
              <option value="2024">Academic Period 2024</option>
            </select>
          </div>
        </div>
      </div>

      {/* Export Action Grid Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PDF Download Card */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded">
              Print Ready
            </span>
            <h3 className="text-lg font-bold text-gray-800 mt-2">Executive Summary Presentation (PDF)</h3>
            <p className="text-sm text-gray-500 mt-1">
              Generates a highly stylized document containing institutional branding, formatted tables, and strategic KPI deltas perfect for board meetings.
            </p>
          </div>
          <button
            onClick={() => downloadReport("pdf")}
            disabled={isDownloadingPdf}
            className="w-full mt-6 bg-[#660033] hover:bg-[#4d0026] text-white font-medium text-sm py-2.5 px-4 rounded transition-colors duration-150 disabled:opacity-50"
          >
            {isDownloadingPdf ? "Compiling PDF Stream..." : "Download PDF Document"}
          </button>
        </div>

        {/* CSV Excel Download Card */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded">
              Data Sheet
            </span>
            <h3 className="text-lg font-bold text-gray-800 mt-2">Flat Data Spreadsheet Ledger (CSV)</h3>
            <p className="text-sm text-gray-500 mt-1">
              Flattens your metrics row-by-row into comma-separated tracks natively designed for deeper analysis inside Microsoft Excel or Google Sheets.
            </p>
          </div>
          <button
            onClick={() => downloadReport("csv")}
            disabled={isDownloadingCsv}
            className="w-full mt-6 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm py-2.5 px-4 rounded transition-colors duration-150 disabled:opacity-50"
          >
            {isDownloadingCsv ? "Generating Spreadsheet..." : "Download Excel CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;