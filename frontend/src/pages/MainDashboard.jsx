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

  return (
    <div
      className={`flex min-h-screen font-sans antialiased transition-colors duration-300 ${
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
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="p-8 lg:p-12 space-y-10 max-w-screen-2xl w-full mx-auto">
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
                className={`text-2xl font-extrabold tracking-tight font-oswald uppercase ${
                  isDarkMode ? "text-white" : "text-[#600018]"
                }`}
              >
                Presidential Dashboard for Organizational Data and Insights
              </h2>
            </div>
            {/* Profile User Toolbar Actions Wrapper */}
            <div
              className={`flex items-center gap-4 self-end md:self-auto px-5 py-2.5 rounded-2xl border shadow-sm transition-all duration-300 ${
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
                className={`h-6 w-[1px] ${isDarkMode ? "bg-slate-700" : "bg-slate-200"}`}
              />

              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span
                    className={`text-xs font-bold font-oswald tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}
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
          {/* Navigation Tab Display Interfaces */}
          {currentTab === "dashboard" && (
            <div className="space-y-10 animate-fade-in">
              <ExecutiveKPIs isDarkMode={isDarkMode} />
              <EnrollmentChart isDarkMode={isDarkMode} />
              <ResearchMetrics isDarkMode={isDarkMode} />
            </div>
          )}
          {currentTab === "Higher Education" && (
            <div className="space-y-10 animate-fade-in">
              <HigherEducation isDarkMode={isDarkMode} />
            </div>
          )}
          {currentTab === "Advance Education" && (
            <div className="space-y-10 animate-fade-in">
              <AdvanceEducation isDarkMode={isDarkMode} />
            </div>
          )}
          {currentTab === "research" && (
            <div className="space-y-10 animate-fade-in">
              <ResearchMetrics isDarkMode={isDarkMode} />
            </div>
          )}
          {currentTab === "general administration" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
              <div className="lg:col-span-2">
                <GeneralAdministration isDarkMode={isDarkMode} />
              </div>
            </div>
          )}
          {currentTab === "support to operation" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
              <div className="lg:col-span-2">
                <SupportToOperation isDarkMode={isDarkMode} />
              </div>
            </div>
          )}
          {currentTab === "achievements" && (
            <div className="space-y-10 animate-fade-in">
              <Achievements isDarkMode={isDarkMode} />
            </div>
          )}
          {currentTab === "enrollment" && (
            <div className="space-y-10 animate-fade-in">
              <EnrollmentChart isDarkMode={isDarkMode} />
            </div>
          )}
          {currentTab === "budget" && (
            <div className="animate-fade-in">
              <BudgetUtilization isDarkMode={isDarkMode} />
            </div>
          )}
          {currentTab === "reports" && (
            <div className="animate-fade-in">
              <Report isDarkMode={isDarkMode} />
            </div>
          )}
        </main>

        <Footer />
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
