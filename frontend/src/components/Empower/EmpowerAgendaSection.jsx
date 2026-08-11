export default function EmpowerAgendaSection() {
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
          <button className="whitespace-nowrap px-6 py-3.5 bg-marsu-gold hover:bg-[#b08e4c] text-slate-950 font-sans font-bold text-xs uppercase tracking-wider rounded-none transition-all shadow-md cursor-pointer">
            Explore Full Roadmap →
          </button>
        </div>
      </div>
    </section>
  );
}
