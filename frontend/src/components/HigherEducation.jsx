import AccreditationDashboard from "./Admin/Dashboards/higherEducation/mainWrapperDashboard.jsx";
import LicensureExam from "./Admin/Dashboards/higherEducation/licensureExam.jsx";

export default function HigherEducation() {
  return (
    <>
      <AccreditationDashboard />

      <div id="block-licensure-examination" className="scroll-mt-24">
        <LicensureExam />
      </div>
    </>
  );
}
