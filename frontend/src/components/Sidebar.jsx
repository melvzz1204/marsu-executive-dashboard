import { useState } from "react";
import { useNavigate } from "react-router-dom";
import marsuLogo from "../assets/marsu-logo.png";

const Sidebar = ({
  currentTab,
  setCurrentTab,
  handleLogout,
  formattedDate,
  isOpen,
  setIsOpen,
}) => {
  const navigate = useNavigate();
  const [isActivatingPower, setIsActivatingPower] = useState(false);

  // 🌟 SEPARATE ENTITY: Empower Portal
  const empowerItem = {
    id: "Empower",
    label: "Empower Portal",
    badge: "Achieve",
    path: "/empower-to-achieve",
    icon: (
      <svg
        className="w-5 h-5 text-[#D4AF37] transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 shrink-0 relative z-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
  };

  // ⚡ Energetic Transition Handler
  const handleEmpowerClick = () => {
    setIsActivatingPower(true);
    setTimeout(() => {
      navigate(empowerItem.path);
      setIsActivatingPower(false);
    }, 2000);
  };

  // STANDARD NAVIGATION ITEMS MATRIX
  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
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
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V16zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V16z"
          />
        </svg>
      ),
    },
    {
      id: "Higher Education",
      label: "Higher Education",
      icon: (
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
            d="M4.26 10.147L12 6.5l7.74 3.647M4.26 10.147l6.727 3.176a1.25 1.25 0 001.026 0l6.727-3.176M4.26 10.147V16.25c0 .621.504 1.125 1.125 1.125h13.25c.621 0 1.125-.504 1.125-1.125v-6.103M12 18.75V21m-4.5-2.25V21m9-2.25V21"
          />
        </svg>
      ),
    },
    {
      id: "Advance Education",
      label: "Advance Education",
      icon: (
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
            d="M12 21V10m0 0L7.5 6.5M12 10l4.5-3.5M3 21h18M4 21V10h16v11M12 3L3 7h18l-9-4z"
          />
        </svg>
      ),
    },
    {
      id: "research",
      label: "Research",
      icon: (
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
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
    },
    {
      id: "support to operation",
      label: "Support to Operation",
      icon: (
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: "general administration",
      label: `General Administration \n& Support Services`,
      icon: (
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      id: "achievements",
      label: "Achievements",
      icon: (
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
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
    {
      id: "enrollment",
      label: "Enrollments",
      icon: (
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
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: "reports",
      label: "Reports",
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* ⚡ POWER TRANSITION OVERLAY WITH MARSU LOGO */}
      {isActivatingPower && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#800020]/90 via-[#600018]/95 to-[#30000c]/90 backdrop-blur-lg animate-fade-in" />
          <div className="absolute h-[min(600px,90vw)] w-[min(600px,90vw)] rounded-full bg-[#D4AF37]/25 blur-3xl animate-ping" />

          <div className="relative z-10 flex flex-col items-center gap-5">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#D4AF37] border-r-[#D4AF37]/60 border-b-[#D4AF37] animate-spin shadow-[0_0_35px_rgba(212,175,55,0.7)]" />
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#D4AF37]/40 animate-spin [animation-duration:3s] [animation-direction:reverse]" />
              <div className="absolute inset-4 rounded-full bg-[#D4AF37]/20 blur-md animate-pulse" />

              <div className="relative w-25 h-25 rounded-full bg-[#600018] p-3 border border-[#D4AF37]/80 flex items-center justify-center shadow-2xl">
                <img
                  src={marsuLogo}
                  alt="MarSU Logo"
                  className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(212,175,55,0.6)] animate-pulse"
                />
              </div>
            </div>

            <span className="px-4 text-center font-oswald text-base sm:text-xl uppercase tracking-widest text-[#D4AF37] font-extrabold drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] animate-pulse">
              Initiating Empower Portal...
            </span>
          </div>
        </div>
      )}

      {/* SIDEBAR MAIN CONTAINER */}
      <aside
        className={`fixed inset-0 z-40 flex h-dvh w-full flex-col overflow-hidden bg-[#600018] text-white shadow-xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-[#D4AF37]/20 lg:translate-x-0 lg:transition-[width] ${
          isOpen ? "translate-x-0 lg:w-80" : "-translate-x-full lg:w-20"
        }`}
        aria-label="Dashboard navigation"
      >
        {/* Sidebar Toggle Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-1/2 -right-4 z-50 hidden h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#600018] text-[#D4AF37] shadow-[0_4px_12px_rgba(0,0,0,0.15)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#D4AF37] hover:text-white active:scale-95 lg:flex"
          aria-label="Toggle Sidebar Dimensions"
        >
          <svg
            className={`w-4 h-4 transform transition-transform duration-300 ${!isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>

        {/* 📌 FIXED TOP SECTION */}
        <div className="flex shrink-0 flex-col space-y-3 px-4 pt-5 sm:px-6 sm:pt-7 lg:space-y-5 lg:px-4 lg:pt-8">
          {/* Brand Header */}
          <div
            className={`flex items-center gap-3.5 pb-4 border-b border-white/10 ${isOpen ? "px-2" : "justify-center"}`}
          >
            <div
              className={`rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? "h-20 w-20" : "h-12 w-12"}`}
            >
              <img
                src={marsuLogo}
                alt="MarSU Logo"
                className="h-full w-full object-contain"
              />
            </div>

            {isOpen && (
              <div className="min-w-0 animate-fade-in">
                <h1 className="text-l font-extrabold uppercase tracking-wide leading-tight font-oswald text-white">
                  Marinduque State <br /> University
                </h1>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]">
                  Intelligence Matrix
                </p>
              </div>
            )}
          </div>

          {/* 🌟 EMPOWER PORTAL CTA */}
          <div
            className={`relative hidden lg:block group ${isOpen ? "w-full" : "w-12 mx-auto"}`}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#D4AF37] via-amber-500 to-[#D4AF37] rounded-2xl blur-md opacity-40 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse" />

            <button
              onClick={handleEmpowerClick}
              className={`relative z-10 group flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#800020] via-[#600018] to-[#420011] text-white font-bold shadow-xl border border-[#D4AF37]/60 hover:border-[#D4AF37] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer overflow-hidden ${
                isOpen
                  ? "px-4 py-3.5 w-full"
                  : "w-12 h-12 justify-center mx-auto"
              }`}
              title={!isOpen ? empowerItem.label : ""}
            >
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />

              <div className="flex items-center gap-3 relative z-10">
                <div className="relative p-1.5 rounded-xl bg-white/10 border border-[#D4AF37]/60 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-[#600018] transition-all duration-300 shadow-inner">
                  <span className="absolute inset-0 rounded-xl bg-[#D4AF37]/30 animate-ping opacity-75 group-hover:opacity-100" />
                  {empowerItem.icon}
                </div>

                {isOpen && (
                  <div className="text-left">
                    <span className="block text-xs font-black uppercase tracking-wider font-oswald text-white leading-tight drop-shadow-sm">
                      {empowerItem.label}
                    </span>
                    <span className="block text-[10px] text-[#D4AF37] font-semibold tracking-wide">
                      Unlock Potential
                    </span>
                  </div>
                )}
              </div>

              {isOpen && empowerItem.badge && (
                <div className="relative z-10 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-[#D4AF37] text-[#600018] shadow-md">
                    {empowerItem.badge}
                  </span>
                </div>
              )}
            </button>
          </div>

          {isOpen && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 lg:hidden">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                Choose an insight
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">
                Select a module below to open its focused analytics view.
              </p>
            </div>
          )}

          <div className="my-1 border-b border-white/15" />
        </div>

        {/* 📜 INDEPENDENTLY SCROLLABLE CORE MODULES CONTAINER */}
        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3 sm:px-6 lg:px-4">
          {isOpen && (
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]/70 px-2 pb-1 font-oswald">
              Core Modules
            </span>
          )}

          <nav className="flex flex-col space-y-2">
            {navigationItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`cursor-pointer flex items-center rounded-xl font-semibold tracking-wide transition-all group relative ${
                    isOpen
                      ? "w-full gap-5 px-4 py-3.5 lg:py-3"
                      : "w-12 h-12 justify-center mx-auto"
                  } ${
                    isActive
                      ? "bg-white text-[#600018] shadow-md"
                      : "text-slate-200 hover:text-white hover:bg-white/10"
                  }`}
                  title={!isOpen ? item.label : ""}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#D4AF37] rounded-r-full shadow-sm" />
                  )}

                  <span
                    className={
                      isActive
                        ? "text-[#600018]"
                        : "text-[#D4AF37]/80 group-hover:text-[#D4AF37] whitespace-pre-line"
                    }
                  >
                    {item.icon}
                  </span>

                  {isOpen && (
                    <span className="tracking-wide text-xs text-left whitespace-pre-line leading-tight animate-fade-in flex-1">
                      {item.label}
                    </span>
                  )}

                  {!isActive && isOpen && (
                    <span className="absolute right-4 w-1.5 h-1.5 bg-[#D4AF37] rounded-full opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 📌 FIXED BOTTOM SECTION - COMPACT / SUBDUED LOGOUT BUTTON */}
        <div className="shrink-0 border-t border-white/10 px-4 py-2 sm:px-6 lg:px-4">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-lg text-xs font-medium text-white/50 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 group cursor-pointer ${
              isOpen
                ? "px-3 py-2 gap-2.5 w-full"
                : "w-9 h-9 justify-center mx-auto"
            }`}
            title={!isOpen ? "Logout" : ""}
          >
            <span className="text-white/40 group-hover:text-rose-300 transition-colors">
              <svg
                className="w-4 h-4"
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
            {isOpen && (
              <span className="text-xs tracking-wide whitespace-nowrap animate-fade-in">
                Logout
              </span>
            )}
          </button>
        </div>

        {/* Footer System Strip */}
        <div
          className={`shrink-0 border-t border-white/10 bg-[#4a0012] p-4 sm:px-6 lg:px-4 ${isOpen ? "" : "text-center"}`}
        >
          {isOpen ? (
            <div className="flex items-center justify-between animate-fade-in">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold">
                  System Date
                </span>
                <span className="text-xs text-white font-medium mt-0.5 font-oswald">
                  {formattedDate}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                <div className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] animate-pulse"></div>
                <span className="text-[9px] uppercase font-bold text-slate-200 font-oswald">
                  Live
                </span>
              </div>
            </div>
          ) : (
            <div
              className="inline-block h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse"
              title={`Live Connection: ${formattedDate}`}
            ></div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
