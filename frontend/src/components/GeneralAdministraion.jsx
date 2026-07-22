import React, { useState } from "react";

export default function GeneralAdministration() {
  // Active state controller for administration tabs
  const [activeTab, setActiveTab] = useState("financial");

  return (
    <div className="w-full max-w-5xl mx-auto  space-y-6 bg-white p-5">
      {/* 1. TAB TOGGLE NAVIGATION */}
      <div className="flex flex-col sm:flex-row gap-3 ">
        {/* Tab 1: Financial Services */}
        <button
          onClick={() => setActiveTab("financial")}
          className={`cursor-pointer flex-1 sm:flex-initial text-left px-6 py-4 rounded-2xl border transition-all duration-200 select-none ${
            activeTab === "financial"
              ? "bg-[#660033] border-[#660033] text-white shadow-[0_4px_0_0_#D4AF37]"
              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
          }`}
        >
          <span
            className={`text-[10px] font-bold block uppercase tracking-widest mb-1 ${
              activeTab === "financial" ? "text-slate-300" : "text-slate-400"
            }`}
          ></span>
          <span
            className={`text-sm font-black tracking-tight block font-sans ${
              activeTab === "financial" ? "text-white" : "text-slate-900"
            }`}
          >
            Financial Services
          </span>
        </button>

        {/* Tab 2: Administrative Services */}
        <button
          onClick={() => setActiveTab("administrative")}
          className={`cursor-pointer flex-1 sm:flex-initial text-left px-6 py-4 rounded-2xl border transition-all duration-200 select-none ${
            activeTab === "administrative"
              ? "bg-[#660033] border-[#660033] text-white shadow-[0_4px_0_0_#D4AF37]"
              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
          }`}
        >
          <span
            className={`text-[10px] font-bold block uppercase tracking-widest mb-1 ${
              activeTab === "administrative"
                ? "text-slate-300"
                : "text-slate-400"
            }`}
          ></span>
          <span
            className={`text-sm font-black tracking-tight block font-sans ${
              activeTab === "administrative" ? "text-white" : "text-slate-900"
            }`}
          >
            Administrative Services
          </span>
        </button>
      </div>

      {/* 2. TAB CONTENT BOX (Forced Clean Background & Ultra-readable Text) */}
      <div className="pt-8 ">
        {activeTab === "financial" ? (
          <div className="p-8 rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)] min-h-[160px] flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#660033] block mb-2 ">
              Fiscal Core Frame
            </span>
            <p className="text-sm text-slate-700 font-semibold leading-relaxed max-w-2xl font-sans">
              Financial services and asset allocation workspace. Manage
              institutional budget planning, transparent financial audits,
              resource dispersion schedules, and monetary performance matrices.
            </p>
          </div>
        ) : (
          <div className="p-8 rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)] min-h-[160px] flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#660033] block mb-2 ">
              Operational Frame
            </span>
            <div className="text-sm text-slate-700 font-semibold leading-relaxed max-w-2xl font-sans">
              Administrative management and institutional logistics. Monitor
              internal operating structures, support registry coordination,
              compliance filings, and overall facility governance workflows.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
