import React from "react";
import HigherEducationSection from "./higherEducationSection";
import EmployabilitySection from "./employabilitySection";

export default function MainWrapperDashboard({ isDarkMode = false }) {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <HigherEducationSection isDarkMode={isDarkMode} />
        <div />
        <EmployabilitySection isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}
