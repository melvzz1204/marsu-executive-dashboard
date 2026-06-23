import ImpactRankings from "../staticData/achievements/impactRankings.jsx";
import LicensureExam from "../staticData/achievements/licensureData.jsx";
import LetPerformanceExam from "../staticData/achievements/letPerformance.jsx";
import BoardExam from "../staticData/boardExam/boardExam.jsx";

export default function AchievementsCharts() {
  return (
    <div className="space-y-8 animate-fade-in font-oswald">
      {/* Global University Matrix */}
      <ImpactRankings />
      {/* Program Registry Breakdown Audit */}
      <BoardExam />
      <LicensureExam />
      {/* PRC National LET Top 10 Benchmark Chart */}
      <LetPerformanceExam />
    </div>
  );
}
