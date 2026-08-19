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

  const isActiveWorkspace =
    activeTab === "enrollments" || activeTab === "higher-ed";

  return (
    <div className="oswald-brand relative flex h-dvh overflow-hidden bg-[#f4f6f8] text-slate-800">
      <Sidebar
        activeTab={activeTab}
        onNavClick={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close admin navigation"
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-10 lg:py-5">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#580017] shadow-sm transition hover:border-[#580017]/30 hover:bg-[#580017]/5 lg:hidden"
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
                <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#580017]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c5a059]" />
                  Data administration
                </div>
                <h1 className="truncate text-xl font-black uppercase tracking-tight text-slate-950 sm:text-2xl">
                  {categoryLabels[activeTab] || "Overview"}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 border-l border-slate-200 pl-3 sm:pl-5">
              <div className="hidden text-right sm:block">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Signed in as
                </span>
                <span className="mt-0.5 block text-sm font-bold uppercase text-slate-800">
                  Administrator
                </span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#580017] text-sm font-bold text-[#D4AF37] shadow-sm">
                SA
              </div>
            </div>
          </div>
        </header>

        <div className="w-full flex-1 space-y-6 p-4 sm:p-6 lg:px-8 lg:py-10 2xl:px-10">
          {isActiveWorkspace && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Manage source files and monitor ingestion activity.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                System online
              </span>
            </div>
          )}
          {activeTab === "enrollments" ? (
            <EnrollmentsUpload />
          ) : activeTab === "higher-ed" ? (
            <HigherEducationUpload />
          ) : (
            <div className="border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-16">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#580017]/5 text-[#580017]">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m0 3.75h.008M10.29 3.86 2.82 17.1A2 2 0 0 0 4.56 20h14.88a2 2 0 0 0 1.74-2.9L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-bold uppercase text-slate-900">
                Module unavailable
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                The {categoryLabels[activeTab]} workspace is currently under
                development.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
