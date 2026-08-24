import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmpowerAgendaSection from "../components/Empower/EmpowerAgendaSection";
import { EMPOWER_PILLARS } from "../staticData/empowerPillars";

// Framer Motion Animation Variants
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const pillarCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 15,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

export default function EmpowerLandingPage() {
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [selectedKpi, setSelectedKpi] = useState(null);

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col justify-between antialiased selection:bg-marsu-burgundy selection:text-white font-sans overflow-x-hidden">
      {/* 2. Header Banner with Smooth Entrance Animation */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-r from-[#3b000f] via-marsu-burgundy to-[#3b000f] text-white py-4 px-6 border-b-2 border-marsu-gold shadow-md overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c5a059_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/marsu-logo.png"
              alt="MarSU Seal"
              className="h-12 md:h-14 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/120x120/580017/FFFFFF?text=MarSU";
              }}
            />
            <div className="text-left border-l border-marsu-gold/60 pl-3">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-marsu-gold block leading-none mb-0.5">
                Republic of the Philippines
              </span>
              <h1 className="font-oswald text-lg md:text-2xl font-extrabold uppercase tracking-wide text-white leading-tight">
                Marinduque State University
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-center shrink-0">
            <img
              src="/empower.png"
              alt="Empower to Achieve Agenda"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/400x100/580017/FFFFFF?text=EMPOWER";
              }}
            />
          </div>
        </div>
      </motion.header>

      {/* 3. Main Grid Matrix with Staggered Framer Motion Entrance */}
      <main className="max-w-[1850px] w-full mx-auto px-4 sm:px-6 py-10">
        <motion.div
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-0 border border-slate-300 shadow-2xl bg-white"
        >
          {EMPOWER_PILLARS.map((pillar, idx) => (
            <motion.div
              key={idx}
              variants={pillarCardVariants}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPillar(pillar)}
              className="group [perspective:1000px] h-[430px] w-full cursor-pointer"
            >
              <div className="relative h-full w-full rounded-none transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                {/* Card Front */}
                <div
                  className={`absolute inset-0 h-full w-full rounded-none overflow-hidden p-6 flex flex-col justify-between border-r border-b border-slate-200 [backface-visibility:hidden] [transform:rotateY(0deg)] ${pillar.bgFrontColor}`}
                >
                  <img
                    src={pillar.image}
                    alt={pillar.frontTitle}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                  <div className="relative z-10 flex justify-between items-start">
                    <span
                      className={`font-oswald text-7xl font-black leading-none ${pillar.textFront}`}
                    >
                      {pillar.letter}
                    </span>
                    <span
                      className={`font-sans text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none ${pillar.badgeBg}`}
                    >
                      {pillar.pillarNum}
                    </span>
                  </div>

                  <div className="relative z-10">
                    <div className="w-8 h-0.5 bg-marsu-gold mb-3" />
                    <h2
                      className={`font-oswald text-lg sm:text-xl font-bold uppercase leading-snug drop-shadow-md tracking-wide ${pillar.textFront}`}
                    >
                      {pillar.frontTitle}
                    </h2>
                  </div>
                </div>

                {/* Card Back */}
                <div className="absolute inset-0 h-full w-full rounded-none p-6 flex flex-col justify-between border-r border-b border-marsu-gold/30 bg-marsu-burgundy text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/15 pb-2.5">
                      <span className="font-oswald text-4xl font-black text-white/90">
                        {pillar.letter}
                      </span>
                      <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-marsu-gold">
                        {pillar.pillarNum}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-sans text-xs font-bold uppercase tracking-wide mb-2 text-marsu-gold">
                        {pillar.backSub}
                      </h3>
                      <p className="font-sans text-xs leading-relaxed text-slate-200 font-normal">
                        {pillar.backDesc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/15 font-sans text-[10px] font-bold uppercase tracking-widest text-marsu-gold flex justify-between items-center">
                    <span>{pillar.backTag}</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* 4. Animated Modal using AnimatePresence */}
      <AnimatePresence>
        {selectedPillar && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPillar(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border-2 border-marsu-gold"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#2c000b] via-marsu-burgundy to-[#2c000b] text-white p-6 border-b-2 border-marsu-gold relative flex justify-between items-start shrink-0">
                <div className="pr-8">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-oswald text-3xl font-black bg-marsu-gold text-marsu-burgundy px-3 py-0.5 rounded">
                      {selectedPillar.letter}
                    </span>
                    <span className="font-sans text-xs font-bold uppercase tracking-widest text-marsu-gold border border-marsu-gold/50 bg-black/30 px-2.5 py-1 rounded">
                      {selectedPillar.pillarNum}
                    </span>
                  </div>
                  <h2 className="font-oswald text-xl sm:text-2xl font-bold uppercase tracking-wide text-white mt-2">
                    {selectedPillar.frontTitle}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedPillar(null)}
                  className="text-marsu-gold hover:text-white bg-black/30 hover:bg-black/60 rounded-full w-9 h-9 flex items-center justify-center font-bold text-lg transition-colors border border-marsu-gold/40"
                  aria-label="Close modal"
                >
                  ✕
                </motion.button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="bg-[#2c000b]/5 border-l-4 border-marsu-gold rounded-r-md p-4">
                  <h4 className="font-sans text-xs font-extrabold uppercase tracking-widest text-marsu-burgundy mb-1">
                    Strategic Scope & Focus
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed font-normal">
                    {selectedPillar.backDesc}
                  </p>
                </div>

                <div>
                  <h3 className="font-oswald text-lg font-bold uppercase text-marsu-burgundy mb-3 border-b-2 border-marsu-gold/40 pb-1 flex items-center gap-2">
                    <span className="text-marsu-gold">📊</span> Outcome,
                    Strategies / Programs & KPIs
                  </h3>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
                    <table className="w-full min-w-[760px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#2c000b] text-marsu-gold font-oswald tracking-wider uppercase text-[11px] border-b-2 border-marsu-gold">
                          <th className="p-3.5 w-1/3 border-r border-marsu-gold/20">
                            Outcome
                          </th>
                          <th className="p-3.5 w-5/12 border-r border-marsu-gold/20">
                            Strategies / Programs
                          </th>
                          <th className="p-3.5 w-1/4">KPIs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {selectedPillar.details.map((item, i) => (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 + 0.1 }}
                            className="hover:bg-amber-50/30 transition-colors"
                          >
                            <td className="p-3.5 align-top font-semibold text-slate-800 border-r border-slate-100">
                              {item.outcome}
                            </td>
                            <td className="p-3.5 align-top text-slate-600 leading-relaxed whitespace-pre-line border-r border-slate-100">
                              {item.strategies}
                            </td>
                            <td className="p-3.5 align-top bg-amber-50/50">
                              <div className="space-y-2">
                                {item.kpis.map((kpi) => (
                                  <div
                                    key={kpi.name}
                                    className="flex items-center justify-between gap-3 rounded border border-amber-200 bg-white p-2"
                                  >
                                    <span className="font-semibold leading-relaxed text-marsu-burgundy">
                                      {kpi.name}
                                    </span>
                                    <motion.button
                                      whileHover={{ scale: 1.04 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() =>
                                        setSelectedKpi({
                                          ...kpi,
                                          pillar: selectedPillar,
                                        })
                                      }
                                      className="shrink-0 rounded bg-marsu-burgundy px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-marsu-gold shadow-sm hover:bg-[#3b000f]"
                                    >
                                      View Target
                                    </motion.button>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-[#2c000b] border-t-2 border-marsu-gold px-6 py-3 flex justify-between items-center shrink-0">
                <span className="text-[11px] text-marsu-gold/80 font-medium tracking-wide">
                  MarSU EMPOWER Agenda 2030 Strategic Framework
                </span>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedPillar(null)}
                  className="bg-marsu-gold hover:bg-yellow-500 text-marsu-burgundy font-sans text-xs font-bold uppercase tracking-wider px-5 py-2 rounded transition-colors shadow"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedKpi && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setSelectedKpi(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="[perspective:1200px] w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                className="[transform-style:preserve-3d] overflow-hidden rounded-xl border-2 border-marsu-gold bg-white shadow-2xl"
              >
                <div className="border-b-2 border-marsu-gold bg-gradient-to-r from-[#2c000b] via-marsu-burgundy to-[#2c000b] p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-marsu-gold">
                        {selectedKpi.pillar.pillarNum} · Annual Target
                      </span>
                      <h3 className="mt-1 font-oswald text-xl font-bold uppercase tracking-wide">
                        {selectedKpi.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedKpi(null)}
                      className="rounded-full border border-marsu-gold/50 px-2.5 py-1 text-marsu-gold hover:bg-white/10"
                      aria-label="Close target modal"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-5 sm:grid-cols-5">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 sm:col-span-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Baseline
                    </span>
                    <strong className="mt-2 block text-sm text-slate-800">
                      {selectedKpi.baseline}
                    </strong>
                  </div>
                  {[2027, 2028, 2029, 2030].map((year) => (
                    <div
                      key={year}
                      className="rounded-lg border-2 border-marsu-gold/50 bg-white p-3 shadow-sm"
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-marsu-burgundy">
                        {year}
                      </span>
                      <strong className="mt-2 block text-sm text-slate-800">
                        {selectedKpi.targets[year]}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-[#2c000b] px-5 py-3">
                  <span className="text-[10px] text-marsu-gold/80">
                    Annual target trajectory · Baseline to 2030
                  </span>
                  <button
                    onClick={() => setSelectedKpi(null)}
                    className="rounded bg-marsu-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-marsu-burgundy hover:bg-yellow-500"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Mounted Agenda Section */}
      <EmpowerAgendaSection />

      {/* 6. Institutional Footer */}
      <footer className="bg-[#2c000b] text-slate-300 border-t-4 border-marsu-gold font-sans pt-10 pb-6 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          <div className="space-y-3">
            <h3 className="font-oswald text-lg font-bold uppercase text-white tracking-wide">
              Marinduque State University
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              MarSU | Panfilo M. Manguera Sr. Rd., Tanza, Boac, Marinduque,
              Philippines
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-oswald text-xs font-bold uppercase text-marsu-gold tracking-wider">
              Official Contact Info
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li>📍 Panfilo M. Manguera Sr. Rd., Tanza, Boac, Marinduque</li>
              <li>📞 042 332 2728</li>
              <li>
                ✉️{" "}
                <a
                  href="mailto:president@marsu.edu.ph"
                  className="hover:text-marsu-gold transition-colors"
                >
                  president@marsu.edu.ph
                </a>
              </li>
              <li>
                🌐{" "}
                <a
                  href="https://www.marsu.edu.ph"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-marsu-gold transition-colors"
                >
                  www.marsu.edu.ph
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-oswald text-xs font-bold uppercase text-marsu-gold tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li>
                <a
                  href="#about"
                  className="hover:text-marsu-gold transition-colors"
                >
                  About EMPOWER Agenda
                </a>
              </li>
              <li>
                <a
                  href="#pillars"
                  className="hover:text-marsu-gold transition-colors"
                >
                  Strategic Pillars Overview
                </a>
              </li>
              <li>
                <a href="/" className="hover:text-marsu-gold transition-colors">
                  MarSU Executive Dashboard
                </a>
              </li>
              <li>
                <a
                  href="https://www.marsu.edu.ph"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-marsu-gold transition-colors"
                >
                  University Official Portal
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="font-medium">
            © {new Date().getFullYear()} Marinduque State University. All
            Rights Reserved.
          </p>
          <p className="text-[11px] text-slate-600">
            EMPOWER to Achieve Strategic Framework & Governance Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
