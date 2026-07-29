import React, { useState } from "react";
import EnrollmentDashboard from "../components/Admin/Dashboards/enrollmentDashboard";
import FloatingChatBot from "../components/Empower/FloatingChatbot";
import EmpowerLogo from "../../public/empower.png";
import MarsuLogo from "../../public/marsu-logo.png"; // 🌟 NEW: Import your MarSU Logo here

// 🏛️ MINIMALIST PLACEHOLDERS
const ResearchDashboardPlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-slate-400 animate-fade-in">
    <svg
      className="w-10 h-10 mb-6 text-slate-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
    <h3 className="text-lg font-light tracking-wider text-slate-800 uppercase mb-2">
      Research & Innovation
    </h3>
    <p className="text-xs tracking-widest text-slate-400 uppercase">
      Data synchronization pending
    </p>
  </div>
);

const ExecutiveDashboardPlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-slate-400 animate-fade-in">
    <svg
      className="w-10 h-10 mb-6 text-slate-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
    <h3 className="text-lg font-light tracking-wider text-slate-800 uppercase mb-2">
      Executive Insights
    </h3>
    <p className="text-xs tracking-widest text-slate-400 uppercase">
      Data synchronization pending
    </p>
  </div>
);

const Empower = () => {
  const [activeTab, setActiveTab] = useState("enrollment");

  const portalTabs = [
    { id: "enrollment", label: "Enrollment" },
    { id: "research", label: "Research" },
    { id: "executive", label: "Executive" },
  ];

  const renderActiveDashboard = () => {
    switch (activeTab) {
      case "enrollment":
        return <EnrollmentDashboard />;
      case "research":
        return <ResearchDashboardPlaceholder />;
      case "executive":
        return <ExecutiveDashboardPlaceholder />;
      default:
        return <EnrollmentDashboard />;
    }
  };

  return (
    <>
      <FloatingChatBot />
      <div className="min-h-screen w-full bg-[#3A0010] text-white font-sans flex flex-col">
        {/* Changed to fixed and z-0 to guarantee it never overlays interactive elements */}
        <div className="fixed inset-0 bg-gradient-to-b from-[#500016] to-[#25000A] opacity-90 pointer-events-none z-0" />

        {/* 🌟 TOP NAVIGATION HEADER 🌟 */}
        <header className="relative z-30 w-full bg-[#1A0007]/80 backdrop-blur-md border-b border-[#D4AF37]/20 px-4 md:px-8 py-3 flex items-center justify-between shadow-lg">
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <img
              src={MarsuLogo}
              alt="MarSU Logo"
              className="h-10 w-10 md:h-12 md:w-12 object-contain drop-shadow-md"
            />
            <div className="hidden sm:block">
              <h1 className="text-[#D4AF37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase">
                Marinduque State University
              </h1>
              <p className="text-white/60 text-[10px] tracking-widest uppercase mt-0.5">
                Empower
              </p>
            </div>
          </div>

          {/* Right: Typical Header Actions */}
          <nav className="flex items-center gap-6">
            <div className="w-[1px] h-6 bg-white/10 hidden md:block"></div>
          </nav>
        </header>

        {/* 🏛️ Main Layout Container */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-8 flex flex-col items-center flex-1">
          {/* Refined Hero Section */}
          <div className="text-center mb-10 animate-fade-in mt-4">
            {/* Empower Logo centered as the main title */}
            <img
              src={EmpowerLogo}
              alt="Empower Portal Logo"
              className="h-25 md:h-25 object-contain mx-auto mb-6 animate-fade-in drop-shadow-2xl"
            />
            <div className="w-16 h-[1px] bg-[#D4AF37]/40 mx-auto"></div>
          </div>

          {/* 🔘 Minimalist Tab Navigation */}
          <div className="flex justify-center gap-8 md:gap-12 mb-8 animate-fade-in">
            {portalTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-2 text-xs md:text-sm uppercase tracking-[0.15em] transition-all duration-500 ${
                  activeTab === tab.id
                    ? "text-[#D4AF37] font-semibold"
                    : "text-white/40 font-light hover:text-white/80"
                }`}
              >
                {tab.label}
                {/* Animated Thin Underline */}
                <span
                  className={`absolute bottom-0 left-0 w-full h-[1px] bg-[#D4AF37] transition-transform duration-500 origin-left ${
                    activeTab === tab.id
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* 📊 Premium Dashboard Wrapper */}
          <div className="w-full bg-[#FAFAFA] text-slate-800 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex-1 flex flex-col animate-fade-in border border-white/10 mb-10 p-4 md:p-8">
            {renderActiveDashboard()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Empower;
