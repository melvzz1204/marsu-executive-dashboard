import { useState } from "react";
import CoreFrame from "./supportToOperation/coreFrame.jsx";
import CapabilityFrame from "./supportToOperation/capabilityFrame.jsx";

export default function SupportToOperation() {
  const [activeTab, setActiveTab] = useState("quality");
  return (
    <div className="w-full  mx-auto space-y-6  bg-white p-5 rounded-2xl">
      {/* 1. TAB TOGGLE NAVIGATION */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Tab 1: Quality System */}
        <button
          onClick={() => setActiveTab("quality")}
          className={`cursor-pointer flex-1 sm:flex-initial text-left px-6 py-4 rounded-2xl border transition-all duration-200 select-none ${
            activeTab === "quality"
              ? "bg-[#660033] border-[#660033] text-white shadow-[0_4px_0_0_#D4AF37]"
              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
          }`}
        >
          <span
            className={`text-[10px] font-bold block uppercase tracking-widest mb-1 ${
              activeTab === "quality" ? "text-slate-300" : "text-slate-400"
            }`}
          ></span>
          <span
            className={`text-sm font-black tracking-tight block font-sans ${
              activeTab === "quality" ? "text-white" : "text-slate-900"
            }`}
          >
            Quality Systems, Auxiliary & Advocacies
          </span>
        </button>
        {/* Tab 2: Professional Development */}
        <button
          onClick={() => setActiveTab("development")}
          className={`cursor-pointer flex-1 sm:flex-initial text-left px-6 py-4 rounded-2xl border transition-all duration-200 select-none ${
            activeTab === "development"
              ? "bg-[#660033] border-[#660033] text-white shadow-[0_4px_0_0_#D4AF37]"
              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
          }`}
        >
          <span
            className={`text-[10px] font-bold block uppercase tracking-widest mb-1 ${
              activeTab === "development" ? "text-slate-300" : "text-slate-400"
            }`}
          ></span>
          <span
            className={`text-sm font-black tracking-tight block font-sans ${
              activeTab === "development" ? "text-white" : "text-slate-900"
            }`}
          >
            Professional Development & Capability Building
          </span>
        </button>
      </div>

      <div className="pt-4 w-full">
        {activeTab === "quality" ? <CoreFrame /> : <CapabilityFrame />}
      </div>
    </div>
  );
}
