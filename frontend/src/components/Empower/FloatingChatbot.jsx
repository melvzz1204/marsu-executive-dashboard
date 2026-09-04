import { useEffect, useRef, useState } from "react";
import { useChat } from "../../hooks/useChat";
import ChatReportModal from "./ChatReportModal";

/** Friendly labels for tool names shown while the assistant queries data. */
const TOOL_LABELS = {
  getEnrollmentSnapshot: "Querying enrollment data…",
  getEnrollmentTrend: "Analyzing enrollment trends…",
  getResearchMetrics: "Gathering research metrics…",
  getLicensurePerformance: "Checking licensure results…",
  getBudgetUtilization: "Reviewing budget utilization…",
  getAccreditationStatus: "Checking accreditation status…",
  getEmployabilityTracer: "Analyzing employability data…",
  getGlobalRecognition: "Fetching global rankings…",
  getCollegeLicensurePerformance: "Reviewing licensure performance…",
};

/** Render assistant text with simple markdown-ish formatting (bold + bullets). */
const renderFormattedText = (text) => {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;
    const isBullet = /^\s*[-•*]\s+/.test(line);
    const cleanLine = isBullet ? line.replace(/^\s*[-•*]\s+/, "") : line;
    // Split on **bold** segments.
    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    return (
      <p
        key={i}
        className={`${isBullet ? "pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400" : ""} leading-relaxed`}
      >
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="font-semibold text-slate-800">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          ),
        )}
      </p>
    );
  });
};

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNudgeVisible, setIsNudgeVisible] = useState(true);
  const [input, setInput] = useState("");
  const [activeReport, setActiveReport] = useState(null); // message index for the open report modal
  const {
    messages,
    isStreaming,
    toolStatus,
    reasoning,
    error,
    sendMessage,
    stop,
    reset,
  } = useChat();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the newest message while streaming.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, toolStatus]);

  // Focus the input when the window opens.
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Give first-time visitors a quiet invitation, then let it disappear.
  useEffect(() => {
    const timer = window.setTimeout(() => setIsNudgeVisible(false), 9000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput("");
    sendMessage(text);
  };

  return (
    // 🛡️ Safe wrapper pinned strictly to the bottom right
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end">
      {/* 🗨️ Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2.5rem)] max-w-[400px] bg-white rounded-[1.5rem] shadow-[0_24px_80px_rgba(40,0,15,0.24)] overflow-hidden border border-[#eadfe2] flex flex-col floating-chat-panel origin-bottom-right">
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
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isStreaming ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}
                  ></span>
                  <p className="text-[10px] text-white/70 tracking-widest uppercase">
                    {isStreaming ? "Thinking…" : "Online"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Reset conversation */}
              <button
                onClick={reset}
                title="Start a new conversation"
                className="text-white/50 hover:text-white transition-colors p-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  stop();
                  setIsOpen(false);
                }}
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
          </div>

          {/* Chat Body */}
          <div
            ref={scrollRef}
            className="h-[340px] bg-[#FAFAFA] p-4 overflow-y-auto flex flex-col gap-4 no-scrollbar"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 max-w-[90%] chat-message-enter ${msg.role === "user" ? "self-end flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-[#3A0010] flex-shrink-0 flex items-center justify-center mt-1">
                    <span className="text-[#D4AF37] text-[10px] font-bold">
                      M
                    </span>
                  </div>
                )}
                <div
                  className={`border p-3 rounded-2xl text-sm shadow-sm leading-relaxed space-y-1 ${
                    msg.role === "user"
                      ? "bg-[#600018] border-[#600018] text-white rounded-tr-sm"
                      : "bg-white border-slate-200 text-slate-600 rounded-tl-sm"
                  }`}
                >
                  {renderFormattedText(msg.content)}
                  {/* Streaming cursor on the last assistant message */}
                  {msg.role === "assistant" &&
                    isStreaming &&
                    i === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-4 bg-[#D4AF37] rounded-sm animate-pulse align-middle ml-0.5" />
                    )}
                  {/* View Report button — shown once data tools returned */}
                  {msg.role === "assistant" &&
                    !isStreaming &&
                    (msg.reports || []).length > 0 && (
                      <button
                        onClick={() => setActiveReport(i)}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg border border-[#D4AF37]/50 text-[#600018] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        View Full Report ({msg.reports.length})
                      </button>
                    )}
                </div>
              </div>
            ))}

            {/* Tool status indicator */}
            {/* Reasoning / thinking indicator — shown while the model is reasoning */}
            {isStreaming && reasoning && !toolStatus && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-[#3A0010] flex-shrink-0 flex items-center justify-center mt-1">
                  <span className="text-[#D4AF37] text-[10px] font-bold">
                    M
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-500 shadow-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#D4AF37] animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  Thinking…
                </div>
              </div>
            )}

            {/* Tool status indicator — shown while a data tool is executing */}
            {toolStatus && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-[#3A0010] flex-shrink-0 flex items-center justify-center mt-1">
                  <span className="text-[#D4AF37] text-[10px] font-bold">
                    M
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-500 shadow-sm flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#D4AF37] animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  {TOOL_LABELS[toolStatus] || "Querying data…"}
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Report modal — renders centered over the whole page */}
            {activeReport !== null && messages[activeReport] && (
              <ChatReportModal
                reports={messages[activeReport].reports}
                onClose={() => setActiveReport(null)}
              />
            )}
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-slate-100 flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              placeholder="Ask about enrollment, research, licensure, budget…"
              maxLength={2000}
              className="flex-1 bg-[#F1F5F9] border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#D4AF37]/60 text-slate-700 placeholder:text-slate-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="w-10 h-10 bg-gradient-to-br from-[#600018] to-[#3A0010] text-[#D4AF37] rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
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
          </form>
        </div>
      )}

      {/* Friendly invitation shown before the panel is opened. */}
      {!isOpen && isNudgeVisible && (
        <div
          className="mb-3 mr-1 flex items-start gap-2 floating-chat-nudge"
          role="status"
        >
          <div className="relative rounded-2xl rounded-br-md border border-[#eadfe2] bg-white px-4 py-3 shadow-[0_12px_35px_rgba(40,0,15,0.16)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#600018]">
              Empower AI
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              Need a quick insight?
            </p>
            <span className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-r border-b border-[#eadfe2] bg-white" />
          </div>
          <button
            type="button"
            onClick={() => setIsNudgeVisible(false)}
            aria-label="Dismiss chat invitation"
            className="mt-1 rounded-full bg-white p-1 text-slate-400 shadow-sm transition-colors hover:text-[#600018]"
          >
            <svg
              className="h-3.5 w-3.5"
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
      )}

      {/* 🔴 Floating Action Button */}
      <button
        onClick={() => {
          setIsNudgeVisible(false);
          setIsOpen(!isOpen);
        }}
        aria-label={
          isOpen ? "Close Empower AI assistant" : "Open Empower AI assistant"
        }
        aria-expanded={isOpen}
        className={`floating-chat-fab group relative w-16 h-16 rounded-[1.35rem] flex items-center justify-center shadow-[0_12px_35px_rgba(40,0,15,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(40,0,15,0.38)] ${
          isOpen
            ? "bg-slate-800 text-white"
            : "bg-gradient-to-br from-[#600018] to-[#3A0010] text-[#D4AF37] border border-[#D4AF37]/30"
        }`}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-[1.35rem] border border-[#D4AF37]/50 floating-chat-ring" />
        )}
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
