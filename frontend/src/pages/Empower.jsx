import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmpowerAgendaSection from "../components/Empower/EmpowerAgendaSection";

const EMPOWER_PILLARS = [
  {
    letter: "E",
    pillarNum: "Pillar 01",
    frontTitle: "Expand innovative, inclusive, & sustainable lifelong learning",
    backSub: "Lifelong Learning Pathways",
    backDesc:
      "This agenda expands inclusive and flexible lifelong learning by broadening higher education access through modular pathways and industry-aligned curricula. It ultimately drives institutional excellence and equips diverse learners for high-employability career paths.",
    backTag: "Institutional Growth",
    bgFrontColor: "bg-[#E5243B]",
    badgeBg: "bg-white/20 text-white backdrop-blur-md",
    textFront: "text-white",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        outcome:
          "E1.1. Accessible quality higher education and lifelong learning opportunities",
        strategies:
          "Increase access to diverse learner population, including those from underserved communities, working adults, and returning students",
        kpis: "Student enrollment / Attrition rate",
      },
      {
        outcome:
          "E1.2. Institutionalized flexible learning pathways, recognition mechanisms, and alternative delivery modalities",
        strategies:
          "Develop modular, stackable programs and adopt credit transfer practices to support learner mobility and lifelong skills accumulation (ETEEAP, ODEL, and micro-credentialing initiatives)",
        kpis: "Student enrollment in flexible learning & micro-credentials",
      },
      {
        outcome:
          "E1.3. High quality program offerings aligned with emerging demands",
        strategies:
          "• Engage industry partners in curriculum co-design, mentorship, applied learning experiences, internships, faculty/student immersion, and program review\n• Upgrade accreditation for all academic programs and maintain 100% compliance with COPC requirements\n• Pursue COE/COD requirements for key disciplines",
        kpis: "• Employability / Performance in Licensure Exams\n• Accreditation / COPC compliance\n• COE/COD programs established",
      },
    ],
  },
  {
    letter: "M",
    pillarNum: "Pillar 02",
    frontTitle: "Mobilize SDG-based research, development, and innovation",
    backSub: "Technology & Innovation",
    backDesc:
      "Upgrading academic technology, digital learning ecosystems, and research infrastructure to foster cutting-edge discovery. We aim to equip students, faculty, and researchers with future-ready skills in an interconnected global digital economy.",
    backTag: "Digital Transformation",
    bgFrontColor: "bg-[#DDA63A]",
    badgeBg: "bg-black/20 text-white backdrop-blur-md",
    textFront: "text-white",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        outcome: "M1. SDG-based and nationally-aligned researches",
        strategies:
          "Review and realign MarSU research agenda to mandate that all institutional, faculty, and student research projects are explicitly referenced against the UN SDGs",
        kpis: "SDG-based completed / presented research outputs",
      },
      {
        outcome: "M2. Strengthened research capability",
        strategies:
          "Enhance faculty expertise, advanced degree attainment, research infrastructure, and institutional research management systems",
        kpis: "Research publications",
      },
      {
        outcome: "M3. Increased R&D budget",
        strategies:
          "Increase external and institutional support for research, development, and innovation",
        kpis: "Approved research budget",
      },
      {
        outcome: "M4. Sustainable research centers",
        strategies:
          "Establish / sustain research laboratories or centers for research undertakings",
        kpis: "Research centers established",
      },
      {
        outcome: "M5. Established research journal",
        strategies:
          "Establish a robust institutional review and publication for the university research journal",
        kpis: "Journal issues published",
      },
    ],
  },
  {
    letter: "P",
    pillarNum: "Pillar 03",
    frontTitle: "Partner for transformative community impact",
    backSub: "Strategic Alliance",
    backDesc:
      "Building resilient alliances with local industries, global academic institutions, and civic organizations. These partnerships create real-world impact, drive shared economic development, and provide experiential learning opportunities.",
    backTag: "Community Engagement",
    bgFrontColor: "bg-[#4C9F38]",
    badgeBg: "bg-white/20 text-white backdrop-blur-md",
    textFront: "text-white",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        outcome: "P1. Active multi-sector partnerships",
        strategies:
          "Forge more active partnerships with LGUs, industries, NGOs, NGAs, HEIs, and other stakeholders",
        kpis: "Active partnerships",
      },
      {
        outcome: "P2. Meaningful and impactful community engagement",
        strategies:
          "• Increase participation of personnel and students in research-based ESCE activities\n• Increase the number of trained beneficiaries and engaged stakeholders",
        kpis: "ESCE activities organized",
      },
      {
        outcome: "P3. Sustainable community adoption",
        strategies:
          "Deploy developed technologies and technical advisories to underserved communities, far-flung coastal areas, and barangays",
        kpis: "Impact assessment / Communities adopted",
      },
    ],
  },
  {
    letter: "O",
    pillarNum: "Pillar 04",
    frontTitle: "Open global pathways and opportunities",
    backSub: "Global Partnerships",
    backDesc:
      "Embedding internationalization into the curriculum, expanding ASEAN and worldwide academic collaborations, scaling mobility, and pursuing global rankings to secure international prominence.",
    backTag: "Global Impact",
    bgFrontColor: "bg-[#FF3A21]",
    badgeBg: "bg-white/20 text-white backdrop-blur-md",
    textFront: "text-white",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        outcome: "O1. Institutionalized internationalization",
        strategies:
          "Embed internationalization and intercultural competencies into curricula, teaching methods, and campus activities, including TNE opportunities",
        kpis: "Internationalized programs",
      },
      {
        outcome: "O2. Expanded international partnerships and collaborations",
        strategies:
          "Participate in ASEAN and global academic networks and international joint academic collaborations and research initiatives",
        kpis: "Active international partnerships",
      },
      {
        outcome:
          "O3. Increased international mobility and global learning opportunities",
        strategies:
          "Scale up virtual and physical academic mobility programs by forging agreements with international HEIs and organizations",
        kpis: "Faculty and student mobility",
      },
      {
        outcome: "O4. Sustainable global recognition",
        strategies:
          "Participate in world academic rankings such as QS, THE, WURI, among others",
        kpis: "International recognition attained",
      },
    ],
  },
  {
    letter: "W",
    pillarNum: "Pillar 05",
    frontTitle:
      "Widen production, technology transfer, commercialization, and resource generation",
    backSub: "Resource & Tech Transfer",
    backDesc:
      "Accelerating resource generation through technology incubators, IP protection, expanding campus income projects, and securing alumni and industry endowments.",
    backTag: "Commercialization",
    bgFrontColor: "bg-[#26BDE2]",
    badgeBg: "bg-white/20 text-white backdrop-blur-md",
    textFront: "text-white",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        outcome:
          "W1. Technologies and innovations adopted/utilized by stakeholders",
        strategies:
          "• Establish technology business incubators to provide structured pathways for production and commercialization\n• Strengthen intellectual property registration, management, and commercialization",
        kpis: "• Incubated startups assisted\n• Tech/innovation adopted\n• IPs filed/registered/adopted",
      },
      {
        outcome: "W2. Maximum revenue generation",
        strategies:
          "• Establish new income generating projects in all campuses\n• Enhance/expand operations of existing income generating projects",
        kpis: "• Revenue generated\n• Net income generated",
      },
      {
        outcome:
          "W3. Sustained External Resource Generation and Academic Endowments",
        strategies:
          "Establish Professorial Chair Awards sponsored through industry partnerships, alumni endowments, and external funding agencies",
        kpis: "Funded Professorial Chairs established",
      },
    ],
  },
  {
    letter: "E",
    pillarNum: "Pillar 06",
    frontTitle: "Elevate institutional policies, systems, and governance",
    backSub: "Governance & Quality",
    backDesc:
      "Elevating institutional quality assurance, workforce competence, responsible financial stewardship, and evidence-based decision-making through analytics and executive command center operations.",
    backTag: "Institutional Governance",
    bgFrontColor: "bg-[#103C68]",
    badgeBg: "bg-white/20 text-white backdrop-blur-md",
    textFront: "text-white",
    image:
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        outcome: "E2.1. Strengthened quality assurance mechanisms",
        strategies:
          "• Subscribe to management system for educational organizations (EOMS 21001:2018)\n• Undergo the Philippine Quality Award (PQA) assessment\n• Undergo institutional accreditations (AACCUP Institutional IA)",
        kpis: "• EOMS 21001:2018 certification\n• Philippine Quality Award\n• AACCUP Institutional Accreditation",
      },
      {
        outcome: "E2.2. Highly competent, ethical, and engaged workforce",
        strategies:
          "• Institutionalize meritocracy and excellence in HRMD\n• Support workforce development through scholarships, training, and incentives",
        kpis: "• CSC PRIME-HRM level\n• Improved workforce profile",
      },
      {
        outcome: "E2.3. Responsible and accountable financial stewardship",
        strategies:
          "• Comply with rules and regulations prescribed by DBM and COA\n• Ensure proper utilization of entrusted funds",
        kpis: "• COA opinion / audit findings\n• Budget Utilization Rate",
      },
      {
        outcome: "E2.4. Evidence-based governance and decision-making",
        strategies:
          "• Establish integrated data collection and analytics to support evidence-based policies, transparent governance, performance monitoring, and decision-making\n• Establish the University Executive Command Center to enable high-level decision-making",
        kpis: "• Executive Dashboard uptime\n• Data Privacy Compliance\n• Executive Command Center status",
      },
    ],
  },
  {
    letter: "R",
    pillarNum: "Pillar 07",
    frontTitle: "Re-engineer student and stakeholder-centered service delivery",
    backSub: "Service Delivery",
    backDesc:
      "Re-engineering services through modern, paperless campus operations, holistic student welfare, equitable financial aid, streamlined workflows, and elevated public information branding.",
    backTag: "Student-Centric",
    bgFrontColor: "bg-[#DD1367]",
    badgeBg: "bg-white/20 text-white backdrop-blur-md",
    textFront: "text-white",
    image:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    details: [
      {
        outcome: "R1. Holistic student welfare and support",
        strategies:
          "Digitalize admission and guidance counseling platforms, expand student organization support, and establish active mental health response network",
        kpis: "Student feedback and satisfaction rate",
      },
      {
        outcome: "R2. Equitable financial aid and scholarships",
        strategies:
          "Optimize scholarship management and promote equal opportunity and access to student aids and scholarships",
        kpis: "Scholarships granted",
      },
      {
        outcome: "R3. Consistent and responsive service delivery",
        strategies:
          "• Institutionalize standards, citizen's charter, manual, and workflows\n• Re-engineer and simplify administrative and frontline service processes",
        kpis: "Customer satisfaction rate",
      },
      {
        outcome: "R4. Modern and digitally-enabled operations",
        strategies:
          "• Continue and expand implementation of the Smart and Green Campus Program\n• Construct and maintain quality physical facilities and learning resources\n• Adopt paperless operations, automated management systems, and digital tools",
        kpis: "• New facilities and acquisitions\n• Amount saved on paper",
      },
      {
        outcome: "R5. Improved transparency, institutional image, and branding",
        strategies:
          "• Improve strategic communication and public information delivery through social media, website, and other platforms\n• Strengthen the use of 'transparency seal' to provide accessible and validated information for public use",
        kpis: "• Revamped MarSU website\n• Website traffic",
      },
    ],
  },
];

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
                    <table className="w-full text-left border-collapse text-xs">
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
                            <td className="p-3.5 align-top font-semibold text-marsu-burgundy leading-relaxed whitespace-pre-line bg-amber-50/50">
                              {item.kpis}
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
