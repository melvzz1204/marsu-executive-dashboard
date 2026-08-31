import { useState } from "react";

export default function Sidebar({ activeTab, onNavClick, isOpen, onClose }) {
  // Track accordion state for sub-navigation dropdowns
  const [openSubmenus, setOpenSubmenus] = useState({
    "support-op": false,
    gass: false,
  });

  // Logout Handler
  const handleLogout = () => {
    window.location.href = "/";
  };

  // Toggle dropdown submenus
  const toggleSubmenu = (id) => {
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Exact Sidebar Categories
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
            d="M8 21h8m-4-4v4M7 4h10v3a5 5 0 01-10 0V4zm0 2H4v1a4 4 0 004 4m9-5h3v1a4 4 0 01-4 4"
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

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(20rem,calc(100vw-3rem))] flex-shrink-0 flex-col border-r border-[#c5a059]/25 bg-[#580017] text-white shadow-2xl transition-transform duration-300 lg:static lg:h-screen lg:w-72 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37] text-sm font-black text-[#580017]">
                  M
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                  MarSU Portal
                </span>
              </div>
              <h2 className="text-lg font-black uppercase tracking-wide text-white">
                Admin Control
              </h2>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#D4AF37]">
                Data operations workspace
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 transition hover:bg-white/10 lg:hidden"
                aria-label="Close admin navigation"
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
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <nav className="px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            Workspace modules
          </p>
          {navItems.map((item) => {
            const hasChildren = Boolean(
              item.children && item.children.length > 0,
            );
            const isChildActive = item.children?.some(
              (child) => child.id === activeTab,
            );
            const isParentActive = activeTab === item.id || isChildActive;
            const isSubOpen = openSubmenus[item.id];

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleSubmenu(item.id);
                    } else {
                      onNavClick(item.id);
                      onClose();
                    }
                  }}
                  className={`group w-full flex items-center justify-between rounded-xl px-3 py-3 text-left transition-all duration-200 cursor-pointer ${
                    isParentActive
                      ? "bg-white text-[#580017] font-black shadow-[0_8px_20px_rgba(0,0,0,0.14)]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 pr-2">
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${isParentActive ? "bg-[#580017]/10" : "bg-white/5 group-hover:bg-white/10"}`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide leading-tight">
                      {item.label}
                    </span>
                  </div>

                  {hasChildren && (
                    <svg
                      className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${
                        isParentActive ? "text-[#580017]" : "text-[#D4AF37]"
                      } ${isSubOpen ? "rotate-180" : "rotate-0"}`}
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

                {/* Sub-navigation Items */}
                {hasChildren && isSubOpen && (
                  <div className="ml-7 space-y-1 border-l border-[#D4AF37]/30 py-2 pl-4">
                    {item.children.map((child) => {
                      const isSelected = activeTab === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => {
                            onNavClick(child.id);
                            onClose();
                          }}
                          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white text-[#580017] font-black shadow-sm"
                              : "text-white/60 hover:bg-white/10 hover:text-white"
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

      <div className="mt-auto border-t border-white/10 bg-[#4a0013] px-3 py-4">
        <button
          onClick={handleLogout}
          className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-rose-300/15 bg-rose-300/10 px-3 py-3 text-xs tracking-wide text-rose-100 transition-all duration-200 hover:border-rose-300/30 hover:bg-rose-600/30 hover:text-white"
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
          <span className="font-oswald text-xs font-bold uppercase tracking-[0.14em] whitespace-nowrap">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
