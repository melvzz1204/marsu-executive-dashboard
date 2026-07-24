import React, { useState, useEffect } from "react";

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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#800020] via-[#600018] to-[#30000c] flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* 🌟 Ambient Glow FX (Fades in softly over 1.2s) */}
      <div
        className={`absolute w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ease-out ${
          isVisible ? "opacity-100 animate-pulse" : "opacity-0"
        }`}
      />
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 bg-[#800020] rounded-full blur-2xl pointer-events-none transition-opacity duration-1000 ease-out ${
          isVisible ? "opacity-60" : "opacity-0"
        }`}
      />
      <div
        className={`absolute -bottom-32 -right-32 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none transition-opacity duration-1000 ease-out ${
          isVisible ? "opacity-50" : "opacity-0"
        }`}
      />

      {/* 🌟 Main Content Card Wrapper - 1-Second Slow Smooth Entry */}
      <div
        className={`relative z-10 max-w-xl w-full text-center space-y-8 bg-black/20 backdrop-blur-xl p-10 md:p-16 rounded-3xl border border-[#D4AF37]/40 shadow-[0_20px_60px_rgba(0,0,0,0.6)] transform transition-all duration-1000 ease-out ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-95"
        }`}
      >
        {/* Live Active Status Tag */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold uppercase tracking-widest shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
          </span>
          Empower Portal
        </div>

        {/* Big Metallic Gold "Coming Soon" Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider font-oswald text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF3A8] to-[#D4AF37] drop-shadow-[0_4px_16px_rgba(212,175,55,0.35)]">
            Coming Soon
          </h1>
          <p className="text-[#D4AF37]/80 text-sm md:text-base font-medium max-w-md mx-auto leading-relaxed">
            We are crafting an extraordinary experience to help you unlock
            maximum potential and achieve greatness. Stay tuned!
          </p>
        </div>

        {/* Decorative Sparkle Separator */}
        <div className="pt-2 flex justify-center items-center gap-4 text-[#D4AF37]/60">
          <span className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
          <svg
            className="w-7 h-7 text-[#D4AF37] animate-spin-slow"
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
          <span className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
        </div>
      </div>
    </div>
  );
}
