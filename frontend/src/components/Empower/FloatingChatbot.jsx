import { useState } from "react";

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // 🛡️ Safe wrapper pinned strictly to the bottom right
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* 🗨️ Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[90vw] max-w-[360px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-200 flex flex-col animate-fade-in origin-bottom-right transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#600018] to-[#3A0010] p-4 text-white flex justify-between items-center border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center border border-[#D4AF37]/50">
                <svg
                  className="w-4 h-4 text-[#D4AF37]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wider uppercase text-[#D4AF37]">
                  Empower AI assistant
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <p className="text-[10px] text-white/70 tracking-widest uppercase">
                    Training...
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/50 hover:text-white transition-colors p-1"
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
                  strokeWidth="1.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Chat Body */}
          <div className="h-[320px] bg-[#FAFAFA] p-4 overflow-y-auto flex flex-col gap-4 no-scrollbar">
            {/* Bot Message - COMING SOON */}
            <div className="flex gap-2 max-w-[85%]">
              <div className="w-6 h-6 rounded-full bg-[#3A0010] flex-shrink-0 flex items-center justify-center mt-1">
                <span className="text-[#D4AF37] text-[10px] font-bold">M</span>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-600 shadow-sm leading-relaxed">
                <p className="font-bold text-slate-800 mb-2">Coming Soon! 🚀</p>
                <p className="mb-3">
                  Hello! The MarSU Empower Intelligence Assistant is currently
                  undergoing data integration and training.
                </p>
                <p className="mb-3">
                  <strong>Soon, you will be able to:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-700">
                    <li>Instantly analyze enrollment trends</li>
                    <li>Pull specific research metrics & reports</li>
                    <li>Generate real-time executive insights</li>
                    <li>Ask complex questions about MarSU's data</li>
                  </ul>
                </p>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  Stay tuned for a smarter, faster way to explore our data!
                </p>
              </div>
            </div>
          </div>

          {/* Input Area (Disabled state to match "Coming Soon") */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2 opacity-60 cursor-not-allowed">
            <input
              type="text"
              disabled
              placeholder="Chat is currently unavailable..."
              className="flex-1 bg-[#F1F5F9] border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none text-slate-500 cursor-not-allowed"
            />
            <button
              disabled
              className="w-10 h-10 bg-slate-300 text-white rounded-full flex items-center justify-center cursor-not-allowed shadow-inner"
            >
              <svg
                className="w-4 h-4 ml-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 🔴 Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300 hover:scale-105 ${
          isOpen
            ? "bg-slate-800 text-white"
            : "bg-gradient-to-br from-[#600018] to-[#3A0010] text-[#D4AF37] border border-[#D4AF37]/30"
        }`}
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
          // Chat Icon
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default FloatingChatbot;
