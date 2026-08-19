import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../api/axios";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-PH");

// SVG Metric Icons
const EnrollmentIcon = () => (
  <svg
    className="w-5 h-5 text-marsu-burgundy"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 14l9-5-9-5-9 5 9 5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
    />
  </svg>
);

const EmployabilityIcon = () => (
  <svg
    className="w-5 h-5 text-emerald-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const BudgetIcon = () => (
  <svg
    className="w-5 h-5 text-blue-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const BoardPassingIcon = () => (
  <svg
    className="w-5 h-5 text-purple-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
    />
  </svg>
);

const ResearchIcon = () => (
  <svg
    className="w-5 h-5 text-teal-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.595 15.12a2 2 0 00-1.81.547l-.238.239a2 2 0 000 2.828l.238.239a2 2 0 001.81.547l2.387-.477a6 6 0 013.86.517l.318.158a6 6 0 003.86.517l2.387-.477a2 2 0 001.022-.547l.238-.239a2 2 0 000-2.828l-.238-.239zM12 3v9m0 0l-3-3m3 3l3-3"
    />
  </svg>
);

const PublicationIcon = () => (
  <svg
    className="w-5 h-5 text-amber-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const InfrastructureIcon = () => (
  <svg
    className="w-5 h-5 text-indigo-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0h6M9 7h1m-1 4h1m4-4h1m-1 4h1"
    />
  </svg>
);

const ExtensionIcon = () => (
  <svg
    className="w-5 h-5 text-rose-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V11a2 2 0 00-2-2h-1a2 2 0 01-2-2V5a2 2 0 00-2-2H9.375C7.07 3 5.097 4.316 3.055 6.935zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 22 },
  },
};

const Sparkline = ({ data, trend, title }) => {
  const values = data.map(Number).filter((value) => Number.isFinite(value));

  if (values.length < 2) return null;

  const width = 240;
  const height = 38;
  const padding = 3;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;
  const points = values.map((value, index) => ({
    x: padding + (index / (values.length - 1)) * (width - padding * 2),
    y: height - padding - ((value - minimum) / range) * (height - padding * 2),
  }));
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const areaPoints = `${padding},${height} ${linePoints} ${width - padding},${height}`;
  const color =
    trend === "negative"
      ? "#e11d48"
      : trend === "positive"
        ? "#059669"
        : "#64748b";
  const gradientId = `sparkline-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div
      className="relative z-10 mt-2 h-10 w-full"
      aria-label={`${title} historical trend`}
    >
      <svg
        className="h-full w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
      >
        <title>{`${title} historical trend`}</title>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        <polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map(({ x, y }, index) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={index === points.length - 1 ? 2.8 : 1.7}
            fill={index === points.length - 1 ? color : "white"}
            stroke={color}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
};

const KPICard = ({
  tabId,
  blockId,
  title,
  value,
  change,
  trend,
  trendData = [],
  comparisonLabel,
  metricContext,
  icon: MetricIcon,
  iconBg,
  comingSoon = false,
  onClick,
}) => {
  const trendStyles = {
    positive: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    negative: "bg-rose-50 text-rose-700 border-rose-200/80",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const trendSymbol =
    trend === "positive" ? "↑ " : trend === "negative" ? "↓ " : "";

  const handleClick = () => {
    if (onClick) {
      onClick({ tabId, blockId });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Navigate to ${title} section`}
      className="relative min-h-[205px] cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-xl hover:border-marsu-gold/60 focus:outline-none focus:ring-2 focus:ring-marsu-gold transition-all duration-300 flex flex-col justify-between"
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-sans text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            {title}
          </p>

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1">
            <span className="font-oswald text-3xl font-extrabold tracking-tight text-slate-900">
              {value}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {metricContext}
            </span>
          </div>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${iconBg} shadow-sm`}
        >
          <MetricIcon />
        </div>
      </div>

      {!comingSoon && (
        <Sparkline data={trendData} trend={trend} title={title} />
      )}

      <div className="relative z-10 mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${trendStyles[trend]}`}
        >
          {comingSoon
            ? "Coming soon"
            : change === null
              ? "No baseline"
              : `${trendSymbol}${change}`}
        </span>
        <span className="text-[11px] font-medium text-slate-500">
          {comingSoon ? "Data coming soon" : comparisonLabel}
        </span>
      </div>
    </motion.article>
  );
};

const getTrend = (change) => {
  if (change === null || change === 0) return "neutral";
  return change > 0 ? "positive" : "negative";
};

const formatChange = (change, suffix) => {
  if (change === null) return null;
  return `${Math.abs(change).toFixed(1)}${suffix}`;
};

const calculatePercentageChange = (current, previous) => {
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    previous <= 0
  ) {
    return null;
  }
  return ((current - previous) / previous) * 100;
};

export function ExecutiveKPIs({ onNavigate }) {
  const [sources, setSources] = useState({
    enrollment: null,
    higherEducation: null,
    licensure: null,
  });
  const [sourceErrors, setSourceErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchKpis = async () => {
      setIsLoading(true);
      const [enrollmentResult, higherEducationResult, licensureResult] =
        await Promise.allSettled([
          api.get("/public-viewing/trend", {
            params: { semester: "1st Semester" },
            signal: controller.signal,
          }),
          api.get("/higher-education/stats", { signal: controller.signal }),
          api.get("/higher-education/licensure/stats", {
            signal: controller.signal,
          }),
        ]);

      if (controller.signal.aborted) return;

      const errors = [];
      const nextSources = {
        enrollment: null,
        higherEducation: null,
        licensure: null,
      };

      if (enrollmentResult.status === "fulfilled") {
        nextSources.enrollment = enrollmentResult.value.data?.data ?? [];
      } else {
        errors.push("enrollment");
      }

      if (higherEducationResult.status === "fulfilled") {
        nextSources.higherEducation =
          higherEducationResult.value.data?.data ?? null;
      } else {
        errors.push("higher education");
      }

      if (licensureResult.status === "fulfilled") {
        nextSources.licensure = licensureResult.value.data?.data?.records ?? [];
      } else {
        errors.push("licensure");
      }

      setSources(nextSources);
      setSourceErrors(errors);
      setIsLoading(false);
    };

    fetchKpis();
    return () => controller.abort();
  }, [refreshKey]);

  const handleCardClick = ({ tabId, blockId }) => {
    if (typeof onNavigate === "function") {
      onNavigate(tabId, blockId);
      return;
    }

    // Default Fallback: Smooth scroll if element with blockId exists
    if (blockId) {
      const targetElement = document.getElementById(blockId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const kpiData = useMemo(() => {
    const enrollmentTrend = Array.isArray(sources.enrollment)
      ? [...sources.enrollment].sort((a, b) => a.academicYear - b.academicYear)
      : [];
    const currentEnrollment = enrollmentTrend.at(-1);
    const previousEnrollment = enrollmentTrend.at(-2);
    const enrollmentChange = currentEnrollment
      ? calculatePercentageChange(
          Number(currentEnrollment.totalStudents),
          Number(previousEnrollment?.totalStudents),
        )
      : null;

    const higherEducation = sources.higherEducation;
    const tracerMatrix = Array.isArray(higherEducation?.tracerStudyMatrix)
      ? [...higherEducation.tracerStudyMatrix].sort((a, b) => a.year - b.year)
      : [];
    const currentTracer = tracerMatrix.at(-1);
    const previousTracer = tracerMatrix.at(-2);
    const employabilityChange =
      currentTracer && previousTracer
        ? Number(currentTracer.employabilityPercentage) -
          Number(previousTracer.employabilityPercentage)
        : null;

    const licensureRecords = Array.isArray(sources.licensure)
      ? sources.licensure.filter((item) => !item.isNda)
      : [];
    const licensureByYear = Object.values(
      licensureRecords.reduce((yearly, item) => {
        const year = Number(item.year);
        if (!Number.isFinite(year)) return yearly;

        if (!yearly[year]) yearly[year] = { year, takers: 0, passed: 0 };
        yearly[year].takers += Number(item.takers) || 0;
        yearly[year].passed += Number(item.passed) || 0;
        return yearly;
      }, {}),
    )
      .sort((a, b) => a.year - b.year)
      .map((item) => ({
        ...item,
        rate: item.takers > 0 ? (item.passed / item.takers) * 100 : 0,
      }));
    const currentLicensure = licensureByYear.at(-1);
    const previousLicensure = licensureByYear.at(-2);
    const licensureChange =
      currentLicensure && previousLicensure
        ? currentLicensure.rate - previousLicensure.rate
        : null;

    const hasEnrollment = Boolean(currentEnrollment);
    const hasEmployability = Boolean(currentTracer);
    const hasLicensure = Boolean(currentLicensure);

    const comingSoonKpi = (title, tabId, blockId, icon, iconBg) => ({
      tabId,
      blockId,
      title,
      value: "Coming soon",
      metricContext: "",
      change: null,
      trend: "neutral",
      comparisonLabel: "",
      comingSoon: true,
      iconBg,
      icon,
    });

    return [
      {
        tabId: "enrollment",
        blockId: "block-enrollment",
        title: "Total System Enrollment",
        value: hasEnrollment
          ? NUMBER_FORMATTER.format(
              Number(currentEnrollment.totalStudents) || 0,
            )
          : "Coming soon",
        metricContext: hasEnrollment
          ? `students, AY ${currentEnrollment.academicYear}`
          : "",
        change: formatChange(enrollmentChange, "%"),
        trend: getTrend(enrollmentChange),
        comparisonLabel:
          enrollmentChange === null
            ? "previous year unavailable"
            : "year over year",
        comingSoon: !hasEnrollment,
        trendData: enrollmentTrend.map((item) => item.totalStudents),
        iconBg: "bg-marsu-burgundy/5 border-marsu-burgundy/10",
        icon: EnrollmentIcon,
      },
      {
        tabId: "Higher Education",
        blockId: "block-employability-tracer",
        title: "Graduate Employability Rate",
        value: hasEmployability
          ? `${Number(currentTracer.employabilityPercentage).toFixed(1)}%`
          : "Coming soon",
        metricContext: hasEmployability
          ? `tracer year ${currentTracer.year}`
          : "",
        change: formatChange(employabilityChange, " pp"),
        trend: getTrend(employabilityChange),
        comparisonLabel:
          employabilityChange === null
            ? "previous tracer unavailable"
            : "from previous tracer",
        comingSoon: !hasEmployability,
        trendData: tracerMatrix.map((item) => item.employabilityPercentage),
        iconBg: "bg-emerald-50 border-emerald-100",
        icon: EmployabilityIcon,
      },
      comingSoonKpi(
        "Budget Utilization (BUR)",
        "budget",
        "block-budget-utilization",
        BudgetIcon,
        "bg-blue-50 border-blue-100",
      ),
      {
        tabId: "Higher Education",
        blockId: "block-licensure-examination",
        title: "Licensure Passing Rate",
        value: hasLicensure
          ? `${currentLicensure.rate.toFixed(1)}%`
          : "Coming soon",
        metricContext: hasLicensure ? `exam year ${currentLicensure.year}` : "",
        change: formatChange(licensureChange, " pp"),
        trend: getTrend(licensureChange),
        comparisonLabel:
          licensureChange === null
            ? "previous year unavailable"
            : "from previous exam year",
        comingSoon: !hasLicensure,
        trendData: licensureByYear.map((item) => item.rate),
        iconBg: "bg-purple-50 border-purple-100",
        icon: BoardPassingIcon,
      },
      comingSoonKpi(
        "Research Funding Secured",
        "research",
        "block-research-metrics",
        ResearchIcon,
        "bg-teal-50 border-teal-100",
      ),
      comingSoonKpi(
        "Faculty Publication Rate",
        "research",
        "block-research-metrics",
        PublicationIcon,
        "bg-amber-50 border-amber-100",
      ),
      comingSoonKpi(
        "Infrastructure Modernization",
        "general administration",
        "block-general-administration",
        InfrastructureIcon,
        "bg-indigo-50 border-indigo-100",
      ),
      comingSoonKpi(
        "Extension Footprint",
        "support to operation",
        "block-support-operation",
        ExtensionIcon,
        "bg-rose-50 border-rose-100",
      ),
    ];
  }, [sources]);

  if (isLoading) {
    return (
      <div
        className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Loading executive KPIs"
      >
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="min-h-[165px] animate-pulse rounded-xl border border-slate-200/80 bg-white p-5 flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="h-3 w-28 rounded bg-slate-100" />
              <div className="h-8 w-36 rounded bg-slate-200" />
            </div>
            <div className="h-5 w-28 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section
      className="space-y-4"
      aria-label="Executive key performance indicators"
    >
      {sourceErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-amber-500 bg-amber-50/80 rounded-r-lg px-4 py-2.5 text-xs text-amber-900 shadow-sm"
          role="status"
        >
          <span className="font-medium">
            ⚠️ Live <strong>{sourceErrors.join(" and ")}</strong> metrics could
            not be fully updated.
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="font-extrabold text-amber-950 underline decoration-amber-500 underline-offset-2 hover:text-marsu-burgundy transition-colors"
          >
            Retry Fetching
          </motion.button>
        </motion.div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {kpiData.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} onClick={handleCardClick} />
        ))}
      </motion.div>
    </section>
  );
}

export default ExecutiveKPIs;
