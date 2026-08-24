const target = (name, baseline, y2027, y2028, y2029, y2030) => ({
  name,
  baseline,
  targets: { 2027: y2027, 2028: y2028, 2029: y2029, 2030: y2030 },
});

export const EMPOWER_PILLARS = [
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
    goal: "Expand innovative, inclusive, and sustainable lifelong learning",
    details: [
      {
        outcome:
          "Expand access to quality higher education and lifelong learning opportunities",
        strategies:
          "Increase access to diverse learner population, including those from underserved communities, working adults, and returning students",
        kpis: [
          target(
            "No. of registered access-priority students",
            "500 *",
            "550 *",
            "600 *",
            "650 *",
            "700 *",
          ),
          target(
            "% of enrolled access-priority students",
            "5% *",
            "6% *",
            "7% *",
            "8% *",
            "10% *",
          ),
        ],
      },
      {
        outcome:
          "Institutionalize flexible learning pathways, recognition mechanisms, and alternative delivery modalities",
        strategies:
          "Develop modular, stackable programs and adopt credit transfer practices to support learner mobility and lifelong skills accumulation - ETEEAP, ODeL, and micro-credentialing initiatives",
        kpis: [
          target(
            "% of flexible learning pathways readiness",
            "40% *",
            "50% *",
            "65% *",
            "80% *",
            "100% *",
          ),
          target(
            "No. of students enrolled",
            "12,000 *",
            "12,500 *",
            "13,000 *",
            "13,500 *",
            "14,000 *",
          ),
        ],
      },
      {
        outcome:
          "Ensure the quality and relevance of program offerings with emerging demands",
        strategies:
          "Engage industry partners in curriculum co-design, mentorship, applied learning experiences, internships, faculty and student immersion, and program review",
        kpis: [
          target("Employability Rate", "0.65", "0.65", "0.65", "0.65", "0.65"),
          target(
            "% of First-Time Licensure Examination Passing Rate",
            "0.64",
            "0.64",
            "0.64",
            "0.64",
            "0.64",
          ),
        ],
      },
      {
        outcome:
          "Ensure the quality and relevance of program offerings with emerging demands",
        strategies:
          "Upgrade accreditation for all academic programs and maintain 100% compliance with COPC requirements",
        kpis: [
          target("Accreditation Level", "0.87", "1.0", "1.0", "1.0", "1.0"),
          target("% of Programs with COPC", "1.0", "1.0", "1.0", "1.0", "1.0"),
        ],
      },
      {
        outcome:
          "Ensure the quality and relevance of program offerings with emerging demands",
        strategies: "Pursue COE/COD requirements for key disciplines",
        kpis: [
          target(
            "% of COE/COD readiness requirements",
            "30% *",
            "0.50",
            "1.00",
            "0.50",
            "1.00",
          ),
        ],
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
    goal: "Mobilize SDG-based research, development, and innovation",
    details: [
      {
        outcome:
          "Increase the generation of SDG-based and nationally-aligned researches",
        strategies:
          "Review and realign MarSU research agenda to mandate that all institutional, faculty, and student research projects are explicitly referenced against the UN SDGs",
        kpis: [
          target(
            "No. of SDG-based completed research outputs",
            "85",
            "65.0",
            "65.0",
            "70.0",
            "70.0",
          ),
          target(
            "% of SDG-based research outputs presented",
            "1.0",
            "1.0",
            "1.0",
            "1.0",
            "1.0",
          ),
          target(
            "% of SDG-based research outputs published",
            "70% *",
            "1.0",
            "1.0",
            "1.0",
            "1.0",
          ),
        ],
      },
      {
        outcome: "Strengthen research capability",
        strategies:
          "Enhance faculty expertise, advanced degree attainment, research infrastructure, and institutional research management systems",
        kpis: [
          target(
            "No. of faculty engaged in research works",
            "0.57",
            "0.60",
            "0.60",
            "0.60",
            "0.60",
          ),
        ],
      },
      {
        outcome: "Increase R&D budget",
        strategies:
          "Increase external and institutional support for research, development, and innovation",
        kpis: [
          target(
            "Approved research budget",
            "1,170,000",
            "1,287,000",
            "1,415,700",
            "1,557,270",
            "1,712,997",
          ),
        ],
      },
      {
        outcome: "Establish and sustain research centers",
        strategies:
          "Establish/sustain research laboratories or centers for research undertakings",
        kpis: [
          target(
            "No. of research centers established",
            "2 *",
            "3 *",
            "4 *",
            "5 *",
            "6 *",
          ),
        ],
      },
      {
        outcome: "Establish and sustain research journal",
        strategies:
          "Establish a robust institutional review and publication for the university research journal",
        kpis: [
          target(
            "No. of journal issues published",
            "44",
            "65.0",
            "65.0",
            "70.0",
            "70.0",
          ),
        ],
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
    goal: "Partner for Transformative Community Impact",
    details: [
      {
        outcome: "Strengthen multi-sector partnerships",
        strategies:
          "Forge more active partnerships with LGUs, industries, NGOs, NGAs, HEIs, and other stakeholders",
        kpis: [
          target(
            "No. of active partnerships",
            "23",
            "23.0",
            "25.0",
            "25.0",
            "27.0",
          ),
        ],
      },
      {
        outcome: "Enhance meaningful and impactful community engagement",
        strategies:
          "Increase participation of personnel and students in research-based ESCE activities",
        kpis: [
          target(
            "No. of ESCE activities organized",
            "3,380",
            "3,380",
            "3,450 *",
            "3,500 *",
            "3,600 *",
          ),
          target(
            "No. of trainees trained",
            "3,394",
            "3,444",
            "3,494",
            "3,544",
            "3,594",
          ),
          target(
            "% of satisfaction rating for quality and relevance of training",
            "0.8992",
            "0.885",
            "0.885",
            "0.885",
            "0.885",
          ),
          target(
            "No. of impact assessment conducted",
            "2 *",
            "4 *",
            "6 *",
            "8 *",
            "10 *",
          ),
        ],
      },
      {
        outcome: "Promote sustainable community adoption",
        strategies:
          "Deploy developed technologies and technical advisories to underserved communities, far-flung coastal areas and barangays",
        kpis: [
          target(
            "No. of partner communities adopting the technology/intervention",
            "5 *",
            "8 *",
            "12 *",
            "15 *",
            "20 *",
          ),
        ],
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
    goal: "Open global pathways and opportunities",
    details: [
      {
        outcome: "Institutionalize internationalization",
        strategies:
          "Embed internationalization and intercultural competencies into curricula, teaching methods, and campus activities, including TNE opportunities",
        kpis: [
          target(
            "No. of programs/courses with documented internationalization or intercultural integration",
            "31",
            "35 *",
            "40 *",
            "45 *",
            "50 *",
          ),
        ],
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
    goal: "Widen production, technology transfer, commercialization, and resource generation",
    details: [
      {
        outcome:
          "Increase stakeholder adoption and utilization of technologies and innovations",
        strategies:
          "Establish technology business incubators to provide structured pathways for production and commercialization",
        kpis: [
          target(
            "No. of incubated startups assisted, technology/innovation adopted",
            "2 *",
            "4 *",
            "6 *",
            "8 *",
            "10 *",
          ),
        ],
      },
      {
        outcome:
          "Increase stakeholder adoption and utilization of technologies and innovations",
        strategies:
          "Strengthen intellectual property registration, management, and commercialization",
        kpis: [
          target(
            "No. of IPs filed/registered/adopted",
            "5 *",
            "8 *",
            "10 *",
            "12 *",
            "15 *",
          ),
        ],
      },
      {
        outcome: "Maximize revenue generation",
        strategies: "Establish new income generating projects in all campuses",
        kpis: [
          target(
            "No. of new IGP established",
            "1 *",
            "2 *",
            "3 *",
            "4 *",
            "5 *",
          ),
        ],
      },
      {
        outcome: "Maximize revenue generation",
        strategies:
          "Enhance/expand operations of existing income generating projects",
        kpis: [
          target(
            "Revenue generated from IGPs",
            "PHP 1.0M *",
            "PHP 1.2M *",
            "PHP 1.5M *",
            "PHP 1.8M *",
            "PHP 2.0M *",
          ),
        ],
      },
      {
        outcome:
          "Strengthen and sustain external resource generation and academic endowments",
        strategies:
          "Establish Professorial Chair Program sponsored through industry partnerships, alumni endowments, and external funding agencies.",
        kpis: [
          target(
            "% of professional chair program readiness requirement completed",
            "20% *",
            "40% *",
            "60% *",
            "80% *",
            "100% *",
          ),
        ],
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
    goal: "Elevate institutional policies, systems, and governance",
    details: [
      {
        outcome:
          "Strengthen institutional quality assurance mechanisms and systems",
        strategies:
          "Subscribe to management system for educational organizations",
        kpis: [
          target(
            "EOMS 21001:2018",
            "Preparing *",
            "Certified *",
            "Maintained *",
            "Maintained *",
            "Recertified *",
          ),
        ],
      },
      {
        outcome:
          "Strengthen institutional quality assurance mechanisms and systems",
        strategies: "Undergo the Philippine Quality Award (PQA) assessment",
        kpis: [
          target(
            "Philippine Quality Award",
            "Application *",
            "Level 1 *",
            "Level 2 *",
            "Level 3 *",
            "Level 4 *",
          ),
        ],
      },
      {
        outcome:
          "Strengthen institutional quality assurance mechanisms and systems",
        strategies: "Undergo institutional accreditations",
        kpis: [
          target(
            "AACCUP Institutional Accreditation",
            "Level 2 *",
            "Level 3 *",
            "Level 3 *",
            "Level 4 *",
            "Level 4 *",
          ),
        ],
      },
      {
        outcome:
          "Develop and sustain a competent, ethical, and engaged workforce.",
        strategies: "Institutionalize meritocracy and excellence in HRMD",
        kpis: [
          target(
            "CSC HRM Prime Level",
            "Level 1 *",
            "Level 2 *",
            "Level 2 *",
            "Level 3 *",
            "Level 3 *",
          ),
        ],
      },
      {
        outcome:
          "Develop and sustain a competent, ethical, and engaged workforce.",
        strategies:
          "Support workforce development through scholarships, training, and incentives",
        kpis: [
          target(
            "No. of personnel/faculty scholarship grantees",
            "10 *",
            "12 *",
            "15 *",
            "18 *",
            "20 *",
          ),
          target(
            "No. of personnel/faculty who completed trainings/seminars",
            "100 *",
            "120 *",
            "140 *",
            "160 *",
            "180 *",
          ),
          target(
            "No. of personnel/faculty who received incentives/awards",
            "15 *",
            "20 *",
            "25 *",
            "30 *",
            "35 *",
          ),
        ],
      },
      {
        outcome:
          "Strengthen responsible and accountable financial stewardship.",
        strategies:
          "Comply with the rules and regulations prescribed by DBM and COA",
        kpis: [
          target(
            "COA Opinion Received",
            "Qualified *",
            "Unmodified *",
            "Unmodified *",
            "Unmodified *",
            "Unmodified *",
          ),
          target(
            "% of COA recommendations complied",
            "80% *",
            "85% *",
            "90% *",
            "95% *",
            "100% *",
          ),
        ],
      },
      {
        outcome:
          "Strengthen responsible and accountable financial stewardship.",
        strategies: "Ensure proper utilization of entrusted funds",
        kpis: [
          target(
            "Budget Utilization Rate",
            "0.98",
            "98% *",
            "99% *",
            "99% *",
            "100% *",
          ),
        ],
      },
      {
        outcome:
          "Institutionalize evidence-based governance and decision-making.",
        strategies:
          "Establish an integrated data collection and analytics to support evidenced-based policies, transparent governance, performance monitoring, and decision-making",
        kpis: [
          target(
            "Executive Dashboard uptime, Data Privacy Compliance",
            "90% *",
            "95% *",
            "98% *",
            "99% *",
            "100% *",
          ),
        ],
      },
      {
        outcome:
          "Institutionalize evidence-based governance and decision-making.",
        strategies:
          "Establish the University Executive Command Center to enable high-level decision-making",
        kpis: [
          target(
            "Executive Command Center",
            "Planning *",
            "Operational *",
            "Expanded *",
            "Optimized *",
            "Integrated *",
          ),
        ],
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
    goal: "Re-engineer student and stakeholder-centered service delivery",
    details: [
      {
        outcome: "Strengthen holistic student welfare and support services.",
        strategies:
          "Digitalize admission and guidance counseling platforms, expand student organization support, and establish active mental health response network",
        kpis: [
          target(
            "Student feedback and satisfaction rate",
            "80% *",
            "85% *",
            "88% *",
            "90% *",
            "92% *",
          ),
        ],
      },
      {
        outcome: "Promote equitable access to financial aid and scholarships.",
        strategies:
          "Optimize scholarship management and promote equal opportunity and access to student aids and scholarships",
        kpis: [
          target(
            "No. of University-funded scholarship/student financial aid beneficiaries",
            "7",
            "10 *",
            "15 *",
            "20 *",
            "25 *",
          ),
        ],
      },
      {
        outcome: "Ensure consistent and responsive service delivery.",
        strategies:
          "Institutionalize standards, citizen's charter, manual, and workflows",
        kpis: [
          target(
            "Customer satisfaction rate",
            "82% *",
            "85% *",
            "88% *",
            "90% *",
            "95% *",
          ),
        ],
      },
      {
        outcome: "Modernize and digitally enable institutional operations.",
        strategies:
          "Re-engineer and simplify administrative and frontline service processes",
        kpis: [
          target(
            "Customer satisfaction rate",
            "82% *",
            "85% *",
            "88% *",
            "90% *",
            "95% *",
          ),
        ],
      },
      {
        outcome: "Modernize and digitally enable institutional operations.",
        strategies:
          "Continue and expand implementation of the Smart and Green Campus Program",
        kpis: [
          target(
            "No. of trees planted/maintained",
            "500 *",
            "750 *",
            "1,000 *",
            "1,250 *",
            "1,500 *",
          ),
        ],
      },
      {
        outcome: "Modernize and digitally enable institutional operations.",
        strategies:
          "Construct and maintain quality physical facilities and learning resources",
        kpis: [
          target(
            "No. of laboratories improved/maintained",
            "58",
            "58.0",
            "60.0",
            "60.0",
            "62.0",
          ),
          target(
            "No. of classrooms improved/maintained",
            "83",
            "83.0",
            "85.0",
            "85.0",
            "87.0",
          ),
          target(
            "No. of student space/lounge constructed/improved",
            "4",
            "4.0",
            "4.0",
            "5.0",
            "5.0",
          ),
          target(
            "No. of new buildings/facilities constructed",
            "1",
            "1.0",
            "1.0",
            "2.0",
            "2.0",
          ),
        ],
      },
      {
        outcome: "Modernize and digitally enable institutional operations.",
        strategies:
          "Adopt paperless operations, automated management systems, and digital tools",
        kpis: [
          target(
            "Amount reduction in paper consumption",
            "10% *",
            "20% *",
            "35% *",
            "50% *",
            "70% *",
          ),
        ],
      },
      {
        outcome:
          "Strengthen transparency, institutional image, and brand identity.",
        strategies:
          "Improve strategic communication and public information delivery through social media, website, and other platforms",
        kpis: [
          target(
            "% increase in social media engagement",
            "5% *",
            "10% *",
            "15% *",
            "20% *",
            "25% *",
          ),
        ],
      },
      {
        outcome:
          "Strengthen transparency, institutional image, and brand identity.",
        strategies:
          "Strengthen the use of transparency seal to provide accessible and validated information and statistics for public use.",
        kpis: [
          target(
            "% increase in website traffic; social media engagement",
            "10% *",
            "15% *",
            "20% *",
            "25% *",
            "30% *",
          ),
        ],
      },
    ],
  },
];
