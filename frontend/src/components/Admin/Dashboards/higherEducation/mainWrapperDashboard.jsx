import { useEffect, useRef } from "react";
import HigherEducationSection from "./higherEducationSection";
import EmployabilitySection from "./employabilitySection";

export default function MainWrapperDashboard({ isDarkMode = false }) {
  const precedingContentRef = useRef(null);

  useEffect(() => {
    if (window.location.hash !== "#block-employability-tracer") return;

    const alignEmployabilityHeading = () => {
      document.getElementById("block-employability-tracer")?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    };
    const observer = new ResizeObserver(alignEmployabilityHeading);

    alignEmployabilityHeading();
    if (precedingContentRef.current) {
      observer.observe(precedingContentRef.current);
    }

    const stopObserving = window.setTimeout(() => observer.disconnect(), 2500);
    return () => {
      window.clearTimeout(stopObserving);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <div ref={precedingContentRef}>
          <HigherEducationSection isDarkMode={isDarkMode} />
        </div>
        <EmployabilitySection isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}
