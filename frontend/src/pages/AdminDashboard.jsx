import React, { useState } from "react";
import Sidebar from "../components/Admin/sideBar";

// Imports for Enrollments
import EnrollmentsUpload from "../components/Admin/Dashboards/enrollments/EnrollmentsUpload";

// Imports for Higher Education
import HigherEducationUpload from "../components/Admin/Dashboards/higherEducation/higherEducationUpload";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("enrollments");

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

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* 1. SIDEBAR COMPONENT */}
      <Sidebar activeTab={activeTab} onNavClick={(id) => setActiveTab(id)} />

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

        {/* Dynamic View Body */}
        <div className="p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Conditional Rendering based on Sidebar state */}
          {activeTab === "enrollments" ? (
            <>
              <EnrollmentsUpload />
            </>
          ) : activeTab === "higher-ed" ? (
            <>
              <HigherEducationUpload />
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 font-medium">
              Module for {categoryLabels[activeTab]} is currently under
              development.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
