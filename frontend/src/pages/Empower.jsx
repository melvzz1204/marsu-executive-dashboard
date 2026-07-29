import React, { useState, useEffect } from "react";
import EnrollmentDashboard from "../components/Admin/Dashboards/enrollmentDashboard";
import FloatingChatbot from "../components/Empower/FloatingChatbot";

export default function Empower() {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger smooth slow entrance after page mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Gentle 100ms offset before starting fade
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-br ... ">
        <FloatingChatbot />
        <div className="min-h-screen w-full bg-gradient-to-br from-[#800020] via-[#600018] to-[#30000c] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 text-white relative overflow-x-hidden">
          {/* 🌟 Ambient Glow FX */}
          <div
            className={`absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ease-out ${
              isVisible ? "opacity-100 animate-pulse" : "opacity-0"
            }`}
          />
          <div
            className={`absolute top-1/4 -left-32 w-96 h-96 bg-[#800020] rounded-full blur-2xl pointer-events-none transition-opacity duration-1000 ease-out ${
              isVisible ? "opacity-60" : "opacity-0"
            }`}
          />
          <div
            className={`absolute bottom-0 -right-32 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none transition-opacity duration-1000 ease-out ${
              isVisible ? "opacity-50" : "opacity-0"
            }`}
          />

          {/* 🌟 Main Content Wrapper */}
          <div
            className={`relative z-10 w-full max-w-7xl space-y-8 transform transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-8 scale-95"
            }`}
          >
            {/* Header Section */}
            <div className="text-center space-y-4 mb-8">
              {/* Live Active Status Tag */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold uppercase tracking-widest shadow-inner">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                </span>
                Public Transparency Portal
              </div>

              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider font-oswald text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF3A8] to-[#D4AF37] drop-shadow-[0_4px_16px_rgba(212,175,55,0.35)]">
                University Demographics
              </h1>
              <p className="text-[#D4AF37]/80 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
                Explore our non-confidential enrollment data, campus
                distribution, and program growth trajectories.
              </p>
            </div>

            {/* Dashboard Container */}
            {/* We wrap it in a slightly transparent white background so the text colors from your dashboard still work perfectly without needing a full rewrite of the dashboard's CSS */}
            <div className="bg-slate-50/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[#D4AF37]/30 overflow-hidden">
              <EnrollmentDashboard apiBaseUrl="http://127.0.0.1:5000/api/v1/public-viewing" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
