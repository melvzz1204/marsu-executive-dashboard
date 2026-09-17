// Shared helpers for graduate employability tracer data. A tracer collection
// may contain institution-wide rows (programName === "All Programs") and/or
// program-specific rows. These helpers keep the classification, yearly
// roll-up, and per-program summary logic consistent across the analytics
// controller, the President's Report resolvers, and the chat tool registry.

const ALL_PROGRAMS_LABEL = "All Programs";
const ALL_CAMPUSES_LABEL = "All Campuses";

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const normalizeLabel = (value) =>
  typeof value === "string" ? value.trim() : "";

// True when a row represents institution-wide totals rather than one program.
const isInstitutionProgramName = (programName) => {
  const value = normalizeLabel(programName).toLowerCase();
  return !value || value === ALL_PROGRAMS_LABEL.toLowerCase() || value === "all";
};

const isInstitutionRow = (doc) => isInstitutionProgramName(doc?.programName);

// Employed count falls back to rate * graduates when not explicitly stored.
const resolveEmployed = (doc) => {
  if (doc?.employedCount !== undefined && doc?.employedCount !== null) {
    return toNumber(doc.employedCount);
  }
  return Math.round(toNumber(doc?.graduateCount) * toNumber(doc?.employabilityRate));
};

const formatRatePercent = (rate) => Math.round(toNumber(rate) * 10000) / 100;

// Collapse a set of tracer rows into a single chronological series. Multiple
// rows for the same year are summed (graduating classes and employed alumni)
// and the rate is weighted by graduate count.
const buildYearSeries = (docs = []) => {
  const byYear = new Map();

  docs.forEach((doc) => {
    const year = Math.round(toNumber(doc?.year));
    if (!year) return;

    const current =
      byYear.get(year) || { year, graduateCount: 0, employedCount: 0 };
    current.graduateCount += toNumber(doc.graduateCount);
    current.employedCount += resolveEmployed(doc);
    byYear.set(year, current);
  });

  return [...byYear.values()]
    .sort((a, b) => a.year - b.year)
    .map((entry) => {
      const rate =
        entry.graduateCount > 0 ? entry.employedCount / entry.graduateCount : 0;
      return {
        year: entry.year,
        totalGraduates: entry.graduateCount,
        graduateCount: entry.graduateCount,
        employedCount: entry.employedCount,
        employabilityRate: rate,
        employabilityPercentage: formatRatePercent(rate),
      };
    });
};

// Aggregate program-specific rows into per-program (per-campus) outcomes with
// a graduate-weighted employability rate.
const summarizePrograms = (docs = []) => {
  const byProgram = new Map();

  docs
    .filter((doc) => !isInstitutionRow(doc))
    .forEach((doc) => {
      const programName = normalizeLabel(doc?.programName) || ALL_PROGRAMS_LABEL;
      const campusBranch =
        normalizeLabel(doc?.campusBranch) || ALL_CAMPUSES_LABEL;
      const key = `${programName}::${campusBranch}`;

      const current = byProgram.get(key) || {
        programName,
        campusBranch,
        collegeName: normalizeLabel(doc?.collegeName) || null,
        totalGraduates: 0,
        employedCount: 0,
        years: new Set(),
      };

      if (!current.collegeName) {
        current.collegeName = normalizeLabel(doc?.collegeName) || null;
      }

      current.totalGraduates += toNumber(doc.graduateCount);
      current.employedCount += resolveEmployed(doc);
      const year = Math.round(toNumber(doc.year));
      if (year) current.years.add(year);
      byProgram.set(key, current);
    });

  return [...byProgram.values()]
    .map((entry) => {
      const rate =
        entry.totalGraduates > 0
          ? entry.employedCount / entry.totalGraduates
          : 0;
      return {
        programName: entry.programName,
        campusBranch: entry.campusBranch,
        collegeName: entry.collegeName || null,
        totalGraduates: entry.totalGraduates,
        employedCount: entry.employedCount,
        employabilityRate: rate,
        employabilityPercentage: formatRatePercent(rate),
        years: [...entry.years].sort((a, b) => a - b),
      };
    })
    .sort(
      (a, b) =>
        b.employabilityPercentage - a.employabilityPercentage ||
        b.totalGraduates - a.totalGraduates
    );
};

module.exports = {
  ALL_PROGRAMS_LABEL,
  ALL_CAMPUSES_LABEL,
  isInstitutionProgramName,
  isInstitutionRow,
  resolveEmployed,
  formatRatePercent,
  buildYearSeries,
  summarizePrograms,
};
