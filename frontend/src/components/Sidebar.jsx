import marsuLogo from "../assets/marsu-logo.png";
const Sidebar = ({
  currentTab,
  setCurrentTab,
  handleLogout,
  formattedDate,
  isOpen,
  setIsOpen,
}) => {
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
    /*    higher education  */
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
    /*    Advance education  */
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
    /* Research */
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
    /* Support to operation */
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
    /* General Administration and Support Services*/
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
    /*  Enrollment */
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

    /* Budget utilization */
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
    /*  Reports */
    {
      id: "reports", // Swapped from "Report" to matching lowercase routing state
      label: "Reports",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {/* Swapped duplicate charts icon with the verified Dossier Summary Path */}
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
    <aside
      className={`bg-[#600018] text-white flex flex-col justify-between sticky top-0 h-screen shadow-xl border-r border-[#D4AF37]/20 z-40 transition-all duration-300 scroll-auto ${
        isOpen ? "w-80" : "w-20"
      }`}
    >
      {/* 🌟 FIXED: Absolute floating toggle button positioned directly over the sidebar's right-hand boundary line */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 -right-4 -translate-y-1/2 z-50 w-8 h-8 rounded-xl bg-[#600018] border border-[#D4AF37]/40 text-[#D4AF37] hover:text-white hover:border-[#D4AF37] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
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

      <div className="flex flex-col pt-8 px-4 space-y-8 overflow-y-auto no-scrollbar flex-1 overflow-x-hidden">
        <div
          className={`flex items-center gap-3.5 pb-6 border-b border-white/10 ${isOpen ? "px-2" : "justify-center"}`}
        >
          <div
            className={`rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? "h-23 w-23" : "h-14 w-14"}`}
          >
            <img
              src={marsuLogo}
              alt="MarSU Logo"
              className="h-full w-full object-contain"
            />
          </div>

          {isOpen && (
            <div className="animate-fade-in whitespace-nowrap">
              <h1 className="text-l font-extrabold uppercase tracking-wide leading-tight font-oswald text-white">
                Marinduque State <br /> University
              </h1>
              <p className="text-[9px] font-bold text-[#D4AF37] tracking-widest uppercase mt-0.5">
                Intelligence Matrix
              </p>
            </div>
          )}
        </div>
        {/* Navigation Link Mapping Matrix */}
        <nav className="flex flex-col space-y-2 flex-1">
          {navigationItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`cursor-pointer flex items-center rounded-xl font-semibold tracking-wide transition-all group relative ${
                  isOpen
                    ? "px-4 py-3.5 gap-6 w-full"
                    : "p-3.5 justify-center mx-auto"
                } ${
                  isActive
                    ? "bg-white text-[#600018] shadow-md border-l-4 border-[#D4AF37]"
                    : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
                title={!isOpen ? item.label : ""}
              >
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

        {/* Logout Button Component Wrapper */}
        <div className="pt-4 pb-2 mt-auto border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-xl text-xs tracking-wide text-rose-200 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-200 group ${
              isOpen
                ? "px-4 py-3.5 gap-4 w-full"
                : "p-3.5 justify-center mx-auto"
            }`}
            title={!isOpen ? "Logout" : ""}
          >
            <span className="text-rose-400 group-hover:text-rose-200 transition-colors">
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
            {isOpen && (
              <span className="font-oswald tracking-wide text-sm uppercase whitespace-nowrap animate-fade-in">
                Logout
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Connection Metadata Footer strip */}
      <div
        className={`p-4 border-t border-white/10 bg-[#4a0012] ${isOpen ? "" : "text-center"}`}
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
  );
};

export default Sidebar;
