import { useCallback, useEffect, useState } from "react";
import HigherEducationSection from "./Admin/Dashboards/higherEducation/higherEducationSection";
import EmployabilitySection from "./Admin/Dashboards/higherEducation/employabilitySection";
import LicensureExam from "./Admin/Dashboards/higherEducation/licensureExam";

// Sub-sections of the Higher Education module. Each tab owns a block id so
// existing deep links (KPIs, hash navigation) keep working.
const SECTIONS = [
  {
    id: "accreditation",
    label: "Accreditation",
    blockId: "block-accreditation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l7 2.5V11c0 4.2-2.9 7-7 8.5-4.1-1.5-7-4.3-7-8.5V5.5L12 3Z"
        />
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m9 11.5 2 2 4-4.5"
        />
      </svg>
    ),
  },
  {
    id: "employability",
    label: "Employability",
    blockId: "block-employability-tracer",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        />
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16"
        />
      </svg>
    ),
  },
  {
    id: "licensure",
    label: "Licensure",
    blockId: "block-licensure-examination",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h4M7 21h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z"
        />
      </svg>
    ),
  },
];

const BLOCK_TO_SECTION = SECTIONS.reduce((map, section) => {
  map[section.blockId] = section.id;
  return map;
}, {});

const SECTION_BY_ID = SECTIONS.reduce((map, section) => {
  map[section.id] = section;
  return map;
}, {});

const sectionFromHash = () => {
  const hash = window.location.hash.replace("#", "");
  return BLOCK_TO_SECTION[hash] || "accreditation";
};

export default function HigherEducation() {
  const [activeSection, setActiveSection] = useState(sectionFromHash);

  // Keep the active tab in sync with hash-based navigation from KPIs.
  useEffect(() => {
    const handleHashChange = () => setActiveSection(sectionFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const selectSection = useCallback((sectionId) => {
    setActiveSection(sectionId);
    const blockId = SECTION_BY_ID[sectionId]?.blockId;
    if (blockId && window.location.hash !== `#${blockId}`) {
      window.history.replaceState(null, "", `#${blockId}`);
    }
    document
      .getElementById("higher-education-subnav")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="space-y-6">
      {/* COMPACT STICKY SUB-NAV */}
      <div
        id="higher-education-subnav"
        className="sticky top-16 z-10 scroll-mt-24 lg:top-0"
      >
        <nav
          className="no-scrollbar mr-auto flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-xl border border-slate-200/80 bg-white/95 p-1 shadow-sm backdrop-blur"
          role="tablist"
          aria-label="Higher education sections"
        >
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectSection(section.id)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#660033]/25 ${
                  isActive
                    ? "bg-[#660033] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <span className={isActive ? "text-[#D4AF37]" : "text-slate-400"}>
                  {section.icon}
                </span>
                <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wide">
                  {section.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeSection === "accreditation" && (
        <div id="block-accreditation" className="scroll-mt-24">
          <HigherEducationSection />
        </div>
      )}

      {activeSection === "employability" && (
        <div id="block-employability-tracer" className="scroll-mt-24">
          <EmployabilitySection />
        </div>
      )}

      {activeSection === "licensure" && (
        <div id="block-licensure-examination" className="scroll-mt-24">
          <LicensureExam />
        </div>
      )}
    </div>
  );
}
