import React, { useState } from "react";
import Marsulogo from "../../../public/marsu-logo.png";
export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* CHAT WINDOW (Toggled) */}
      <div
        className={`mb-4 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-90 opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-[#660033] to-[#800020] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Robot/Avatar Icon */}
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-xl shadow-inner">
              🤖
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide">
                Smart Marsu AI
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                </span>
                <p className="text-[#D4AF37] text-[10px] font-semibold uppercase tracking-wider">
                  In Development
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Close Chat"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Chat Body */}
        <div className="p-6 bg-slate-50 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center animate-bounce shadow-sm overflow-hidden border-2 border-[#D4AF37]/30">
            <img
              src={Marsulogo}
              alt="Smart Marsu Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h4 className="text-lg font-black text-slate-800 tracking-tight">
            Empower Chatbot is Coming Soon!
          </h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            Our intelligent assistant,{" "}
            <strong className="text-[#660033]">Smart Marsu</strong>, is
            currently in training. Soon, you will be able to ask questions about
            enrollment data, predict trends, and navigate the transparency
            portal effortlessly using natural language.
          </p>

          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#D4AF37] h-full w-1/3 rounded-full animate-pulse"></div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Processing Knowledge Base...
          </p>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#660033] hover:bg-[#800020] text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 flex items-center justify-center border-2 border-[#D4AF37]/30 group"
        aria-label="Open Chat"
      >
        {isOpen ? (
          // Close Icon
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          // Chat Bubble Icon
          <div className="relative">
            <svg
              className="w-6 h-6 transform group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {/* Notification Dot */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4AF37]"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
