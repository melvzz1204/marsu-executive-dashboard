import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ROADMAP_PROTOTYPE = [
  {
    year: "2027",
    phase: "Activate",
    status: "In progress",
    owner: "Academic Affairs",
    progress: 42,
    milestones: [
      "Access-priority enrollment expansion",
      "SDG research agenda alignment",
    ],
  },
  {
    year: "2028",
    phase: "Scale",
    status: "Planned",
    owner: "Research & Innovation",
    progress: 25,
    milestones: ["Flexible pathway rollout", "Community technology adoption"],
  },
  {
    year: "2029",
    phase: "Integrate",
    status: "Planned",
    owner: "Executive Command Center",
    progress: 12,
    milestones: [
      "Integrated performance analytics",
      "International mobility growth",
    ],
  },
  {
    year: "2030",
    phase: "Sustain",
    status: "Planned",
    owner: "University Leadership",
    progress: 5,
    milestones: [
      "Institutional targets completed",
      "Continuous improvement cycle",
    ],
  },
];

export default function EmpowerAgendaSection() {
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const agendaHighlights = [
    {
      title: "Inclusive Access",
      description:
        "Breaking barriers to higher education through flexible modular learning, online access, and targeted equity initiatives.",
      icon: "🌐",
      borderColor: "border-marsu-burgundy/20",
      bgColor: "bg-marsu-burgundy/5",
      titleColor: "text-marsu-burgundy",
    },
    {
      title: "Industry Alignment",
      description:
        "Co-creating curricula with leading global and local industries to guarantee real-world workforce readiness.",
      icon: "🤝",
      borderColor: "border-marsu-gold/40",
      bgColor: "bg-marsu-gold/10",
      titleColor: "text-marsu-gold",
    },
    {
      title: "Sustainable Innovation",
      description:
        "Leveraging modern technology, research infrastructure, and eco-friendly campus operations for long-term growth.",
      icon: "🌱",
      borderColor: "border-marsu-burgundy/20",
      bgColor: "bg-marsu-burgundy/5",
      titleColor: "text-marsu-burgundy",
    },
    {
      title: "Transformative Leadership",
      description:
        "Cultivating ethical, resilient, and adaptive mindsets across students, faculty, and administrative leadership.",
      icon: "🚀",
      borderColor: "border-marsu-gold/40",
      bgColor: "bg-marsu-gold/10",
      titleColor: "text-marsu-gold",
    },
  ];

  return (
    <section className="relative border-t border-slate-200 bg-white py-20 px-6 overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-slate-200 pb-8">
          <div className="max-w-2xl">
            <h2 className="font-oswald text-3xl md:text-5xl font-black uppercase tracking-tight text-marsu-burgundy">
              About The <span className="text-marsu-gold">EMPOWER</span> Agenda
            </h2>
          </div>
          <p className="font-sans text-slate-600 text-sm md:text-base max-w-md leading-relaxed">
            A comprehensive institutional model designed to re-engineer higher
            education, empower lifelong learners, and foster sustainable
            excellence.
          </p>
        </div>

        {/* Content Paragraphs & Highlights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          {/* Main Paragraph Narrative */}
          <div className="lg:col-span-7 space-y-6 font-sans text-slate-700 text-sm md:text-base leading-relaxed">
            <p className="text-lg font-bold text-slate-900 leading-snug">
              The{" "}
              <strong className="text-marsu-burgundy font-oswald text-xl uppercase tracking-wide">
                EMPOWER to Achieve
              </strong>{" "}
              agenda represents Marinduque State University's commitment to
              strategic growth, academic rigor, and student agency.
            </p>

            <p>
              In an era defined by rapid digital transformation and evolving
              global economies, traditional educational frameworks are
              continuously reinventing themselves. This agenda bridges academic
              research with actionable industry demands by establishing modular
              learning paths, modernizing infrastructure, and maintaining
              administrative transparency.
            </p>

            <p>
              By anchoring university initiatives to our 7 core pillars—ranging
              from lifelong learning to resilient leadership—we build an
              ecosystem where learners thrive, faculty innovate, and community
              partnerships deliver tangible socioeconomic impact.
            </p>

            {/* Editorial Quote Block with Merriweather (font-serif) */}
            <div className="border-l-4 border-marsu-gold pl-6 py-4 bg-marsu-burgundy/5 rounded-r-xl border-y border-r border-slate-200">
              <blockquote className="font-serif italic text-marsu-burgundy text-base md:text-lg font-medium leading-normal">
                "Our commitment is to cultivate resilient, future-ready
                graduates while driving innovation that elevates our university
                and communities."
              </blockquote>
              <p className="font-sans text-xs font-bold uppercase tracking-wider text-marsu-gold mt-3">
                — Marinduque State University Executive Leadership
              </p>
            </div>
          </div>

          {/* Side Highlights */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {agendaHighlights.map((item, index) => (
              <div
                key={index}
                className={`p-5 rounded-none border ${item.borderColor} ${item.bgColor} transition-all hover:-translate-y-0.5 duration-300 shadow-sm`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <h3
                    className={`font-oswald text-lg font-bold uppercase tracking-wide ${item.titleColor}`}
                  >
                    {item.title}
                  </h3>
                </div>
                <p className="font-sans text-xs text-slate-600 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Callout Banner */}
        <div className="bg-gradient-to-r from-marsu-burgundy to-[#3b000f] text-white rounded-none p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border-l-4 border-marsu-gold">
          <div>
            <h3 className="font-oswald text-2xl md:text-3xl font-bold uppercase text-white mb-2 tracking-wide">
              Join Us In Driving Institutional Transformation
            </h3>
            <p className="font-sans text-xs md:text-sm text-slate-200 max-w-xl">
              Learn more about how each pillar translates into campus
              initiatives, academic programs, and community extensions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRoadmapOpen(true)}
            className="whitespace-nowrap px-6 py-3.5 bg-marsu-gold hover:bg-[#b08e4c] text-slate-950 font-sans font-bold text-xs uppercase tracking-wider rounded-none transition-all shadow-md cursor-pointer"
          >
            Explore Full Roadmap →
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isRoadmapOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setIsRoadmapOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border-2 border-marsu-gold bg-slate-50 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b-2 border-marsu-gold bg-gradient-to-r from-[#2c000b] via-marsu-burgundy to-[#2c000b] p-5 text-white">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-marsu-gold">
                    EMPOWER roadmap prototype
                  </span>
                  <h3 className="mt-1 font-oswald text-2xl font-bold uppercase tracking-wide">
                    Full Roadmap Preview
                  </h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Dummy planning data for interface review only
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRoadmapOpen(false)}
                  className="rounded-full border border-marsu-gold/50 px-2.5 py-1 text-marsu-gold hover:bg-white/10"
                  aria-label="Close roadmap prototype"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto p-5 sm:p-7">
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="border-l-4 border-marsu-burgundy bg-white p-3 shadow-sm">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pillars
                    </span>
                    <strong className="mt-1 block text-2xl text-marsu-burgundy">
                      07
                    </strong>
                  </div>
                  <div className="border-l-4 border-marsu-gold bg-white p-3 shadow-sm">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Roadmap years
                    </span>
                    <strong className="mt-1 block text-2xl text-slate-800">
                      04
                    </strong>
                  </div>
                  <div className="border-l-4 border-emerald-500 bg-white p-3 shadow-sm">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Sample actions
                    </span>
                    <strong className="mt-1 block text-2xl text-slate-800">
                      08
                    </strong>
                  </div>
                  <div className="border-l-4 border-sky-500 bg-white p-3 shadow-sm">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Prototype status
                    </span>
                    <strong className="mt-1 block text-sm text-slate-800">
                      Draft UI
                    </strong>
                  </div>
                </div>

                <div className="relative space-y-3 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-marsu-gold/60 sm:before:left-[23px]">
                  {ROADMAP_PROTOTYPE.map((item, index) => (
                    <motion.div
                      key={item.year}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="relative grid grid-cols-[40px_1fr] gap-3 sm:grid-cols-[48px_1fr] sm:gap-4"
                    >
                      <div className="relative z-10 mt-5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-marsu-gold bg-marsu-burgundy ring-4 ring-slate-50" />
                      <div className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <span className="text-xs font-black uppercase tracking-widest text-marsu-burgundy">
                              {item.year} · {item.phase}
                            </span>
                            <h4 className="mt-1 font-oswald text-lg font-bold uppercase text-slate-900">
                              {item.owner}
                            </h4>
                          </div>
                          <span className="self-start border border-marsu-gold/50 bg-marsu-gold/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-marsu-burgundy">
                            {item.status}
                          </span>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            transition={{
                              delay: index * 0.08 + 0.2,
                              duration: 0.55,
                            }}
                            className="h-full bg-marsu-burgundy"
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>Sample completion</span>
                          <span>{item.progress}%</span>
                        </div>
                        <ul className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                          {item.milestones.map((milestone) => (
                            <li
                              key={milestone}
                              className="border-l-2 border-marsu-gold/60 pl-2"
                            >
                              {milestone}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t-2 border-marsu-gold bg-[#2c000b] px-5 py-3">
                <span className="text-[10px] text-marsu-gold/80">
                  Prototype only · No live roadmap data connected
                </span>
                <button
                  type="button"
                  onClick={() => setIsRoadmapOpen(false)}
                  className="rounded bg-marsu-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-marsu-burgundy hover:bg-yellow-500"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
