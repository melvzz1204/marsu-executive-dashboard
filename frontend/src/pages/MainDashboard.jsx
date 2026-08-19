import { useCallback, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ExecutiveKPIs from "../components/ExecutiveKPIs";
import EnrollmentChart from "../components/EnrollmentChart";
import ResearchMetrics from "../components/ResearchMetricsChart";
import Achievements from "../components/AchievementsCharts";
import BudgetUtilization from "../components/BudgetUtilizationChart";
import Report from "../components/Reports";
import HigherEducation from "../components/HigherEducation";
import AdvanceEducation from "../components/AdvanceEducation";
import Footer from "../components/Footer";
import GeneralAdministration from "../components/GeneralAdministraion";
import SupportToOperation from "../components/SupportToOperation";
import { useDashboardState } from "../hooks/useDashboardState";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function MainDashboard() {
  const {
    currentTab,
    setCurrentTab,
    isDarkMode,
    setIsDarkMode,
    presidentName,
    userRole,
    userInitials,
    isLoggingOut,
    isSidebarOpen,
    setIsSidebarOpen,
    formattedDate,
    handleLogout,
  } = useDashboardState();

  const pendingBlockIdRef = useRef(null);

  const handleKpiNavigation = useCallback(
    (tabId, blockId) => {
      pendingBlockIdRef.current = blockId;
      window.history.replaceState(null, "", `#${blockId}`);
      setCurrentTab(tabId);
      setIsSidebarOpen(false);
    },
    [setCurrentTab, setIsSidebarOpen],
  );

  useEffect(() => {
    const blockId = pendingBlockIdRef.current;
    if (!blockId) return;

    const target = document.getElementById(blockId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    pendingBlockIdRef.current = null;
  }, [currentTab]);

  return (
    <div
      className={`oswald-brand relative flex h-dvh overflow-hidden antialiased transition-colors duration-300 ${
        isDarkMode
          ? "bg-slate-900 text-slate-100"
          : "bg-[#f8f4f4ac] text-slate-800"
      }`}
    >
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        handleLogout={handleLogout}
        formattedDate={formattedDate}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Panel Content Area */}
      <div
        className={`min-w-0 flex-1 flex-col overflow-y-auto ${
          isSidebarOpen ? "hidden lg:flex" : "flex"
        }`}
      >
        <div
          className={`sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 lg:hidden ${
            isDarkMode
              ? "border-slate-800 bg-slate-900/95"
              : "border-slate-200 bg-white/95"
          } backdrop-blur-md`}
        >
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold uppercase tracking-wide ${
              isDarkMode
                ? "border-slate-700 text-slate-100"
                : "border-slate-200 text-[#600018]"
            }`}
            aria-label="Open navigation menu"
          >
            <svg
              className="h-4 w-4"
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
            <span>Navigation</span>
          </button>
          <span
            className={`max-w-[54vw] truncate text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? "text-slate-100" : "text-[#600018]"
            }`}
          >
            {currentTab}
          </span>
        </div>

        <div className="mx-4 mt-4 rounded-2xl border border-[#D4AF37]/30 bg-[#600018] px-4 py-3 text-white shadow-sm sm:hidden">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
            Mobile viewing
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/80">
            For the clearest analytics view, rotate your phone horizontally or
            open the dashboard on a desktop screen.
          </p>
        </div>

        <main className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:space-y-10 lg:p-12">
          {/* HEADER STRIP ROW */}
          <div
            className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b transition-colors duration-300 ${
              isDarkMode ? "border-slate-800" : "border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-1">
                <span
                  className={isDarkMode ? "text-rose-400" : "text-[#600018]"}
                >
                  Command Center
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-white bg-[#600018] px-2 py-0.5 rounded-md font-oswald capitalize">
                  {currentTab}
                </span>
              </div>
              <h2
                className={`text-xl sm:text-2xl font-extrabold tracking-tight font-oswald uppercase leading-tight ${
                  isDarkMode ? "text-white" : "text-[#600018]"
                }`}
              >
                Presidential Dashboard for Organizational Data and Insights
              </h2>
            </div>

            {/* Profile User Toolbar Actions Wrapper */}
            <div
              className={`flex w-full sm:w-auto items-center justify-between sm:justify-start gap-3 self-stretch md:self-auto px-3 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl border shadow-sm transition-all duration-300 ${
                isDarkMode
                  ? "bg-slate-800 border-slate-700/80 text-white"
                  : "bg-white border-slate-200/60"
              }`}
            >
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative flex items-center justify-between h-8 w-14 rounded-full p-1 cursor-pointer border shadow-inner transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600"
                    : "bg-slate-100 border-slate-200/40"
                }`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-white shadow border border-slate-200 transform transition-transform duration-300 flex items-center justify-center ${
                    isDarkMode ? "translate-x-6" : "translate-x-0"
                  }`}
                >
                  {isDarkMode ? "🌙" : "☀️"}
                </span>
              </button>

              <div
                className={`h-6 w-[1px] ${
                  isDarkMode ? "bg-slate-700" : "bg-slate-200"
                }`}
              />

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex min-w-0 flex-col text-right">
                  <span
                    className={`max-w-40 truncate text-xs font-bold font-oswald tracking-wide ${
                      isDarkMode ? "text-slate-200" : "text-slate-900"
                    }`}
                    title={presidentName}
                  >
                    {presidentName}
                  </span>
                  <span className="text-[10px] text-[#D4AF37] bg-[#600018]/5 px-2 py-0.5 rounded-md font-extrabold tracking-wider uppercase inline-block self-end mt-0.5 select-none">
                    {userRole.toLowerCase() === "executive"
                      ? "Executive Owner"
                      : "Admin Staff"}
                  </span>
                </div>
                <div className="h-10 w-10 bg-gradient-to-tr from-[#600018] to-[#660033] text-white font-oswald font-bold rounded-xl flex items-center justify-center text-sm shadow-sm ring-2 ring-[#D4AF37]/20 select-none">
                  {userInitials}
                </div>
              </div>
            </div>
          </div>

          {currentTab === "dashboard" && (
            <div className="space-y-6 lg:space-y-10">
              <ExecutiveKPIs
                isDarkMode={isDarkMode}
                onNavigate={handleKpiNavigation}
              />

              <div className="hidden space-y-6 sm:block lg:space-y-10">
                <EnrollmentChart isDarkMode={isDarkMode} />
                <ResearchMetrics isDarkMode={isDarkMode} />
              </div>
            </div>
          )}

          {currentTab === "Higher Education" && (
            <HigherEducation isDarkMode={isDarkMode} />
          )}

          {currentTab === "Advance Education" && (
            <AdvanceEducation isDarkMode={isDarkMode} />
          )}

          {currentTab === "research" && (
            <div id="block-research-metrics" className="scroll-mt-24">
              <ResearchMetrics isDarkMode={isDarkMode} />
            </div>
          )}

          {currentTab === "general administration" && (
            <div id="block-general-administration" className="scroll-mt-24">
              <GeneralAdministration isDarkMode={isDarkMode} />
            </div>
          )}

          {currentTab === "support to operation" && (
            <div id="block-support-operation" className="scroll-mt-24">
              <SupportToOperation isDarkMode={isDarkMode} />
            </div>
          )}

          {currentTab === "achievements" && (
            <div id="block-board-passing" className="scroll-mt-24">
              <Achievements isDarkMode={isDarkMode} />
            </div>
          )}

          {currentTab === "enrollment" && (
            <div id="block-enrollment" className="scroll-mt-24">
              <EnrollmentChart isDarkMode={isDarkMode} />
            </div>
          )}

          {currentTab === "budget" && (
            <div id="block-budget-utilization" className="scroll-mt-24">
              <BudgetUtilization isDarkMode={isDarkMode} />
            </div>
          )}

          {currentTab === "reports" && <Report isDarkMode={isDarkMode} />}
        </main>

        <Footer isDarkMode={isDarkMode} />
      </div>

      {/* Logout Overlay Panel */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 text-center">
            <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-[#600018]/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-[#600018] rounded-full animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-oswald uppercase tracking-wide">
              Securing Session
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainDashboard;
