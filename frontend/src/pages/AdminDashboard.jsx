import { useState } from "react";
import Sidebar from "../components/Admin/sideBar";

// Imports for Enrollments
import EnrollmentsUpload from "../components/Admin/Dashboards/enrollments/EnrollmentsUpload";

// Imports for Higher Education
import HigherEducationUpload from "../components/Admin/Dashboards/higherEducation/higherEducationUpload";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("enrollments");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="oswald-brand relative flex h-dvh overflow-hidden bg-slate-100 text-slate-800">
      {/* 1. SIDEBAR COMPONENT */}
      <Sidebar
        activeTab={activeTab}
        onNavClick={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close admin navigation"
        />
      )}

      {/* 2. MAIN WORKSPACE */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-8 lg:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#580017] lg:hidden"
              aria-label="Open admin navigation"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="min-w-0">
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#580017] bg-[#580017]/5 px-2.5 py-0.5 rounded">
                  Target Collection
                </span>
                <span className="text-slate-300">•</span>
              </div>
              <h1 className="truncate text-lg font-black font-oswald uppercase text-slate-900 tracking-tight sm:mt-1 sm:text-2xl">
                {categoryLabels[activeTab] || "Overview"}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <span className="text-xs font-bold block text-slate-800 font-oswald uppercase">
                System Administrator
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-[#580017] font-oswald text-sm font-bold text-[#D4AF37] sm:h-10 sm:w-10">
              SA
            </div>
          </div>
        </header>

        {/* Dynamic View Body */}
        <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center font-medium text-slate-500 sm:p-12 sm:rounded-3xl">
              Module for {categoryLabels[activeTab]} is currently under
              development.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
