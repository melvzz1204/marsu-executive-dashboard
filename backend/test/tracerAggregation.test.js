const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isInstitutionRow,
  buildYearSeries,
  summarizePrograms,
} = require("../src/services/higherEducation/tracerAggregation");

test("isInstitutionRow treats missing and All Programs labels as institution-wide", () => {
  assert.equal(isInstitutionRow({ programName: "All Programs" }), true);
  assert.equal(isInstitutionRow({ programName: "" }), true);
  assert.equal(isInstitutionRow({}), true);
  assert.equal(isInstitutionRow({ programName: "BS Information Technology" }), false);
});

test("buildYearSeries sums program rows per year and weights the rate", () => {
  const series = buildYearSeries([
    {
      year: 2024,
      programName: "BSIT",
      campusBranch: "Boac",
      graduateCount: 100,
      employedCount: 80,
      employabilityRate: 0.8,
    },
    {
      year: 2024,
      programName: "BSED",
      campusBranch: "Boac",
      graduateCount: 300,
      employedCount: 150,
      employabilityRate: 0.5,
    },
    {
      year: 2023,
      programName: "BSIT",
      campusBranch: "Boac",
      graduateCount: 100,
      employedCount: 60,
      employabilityRate: 0.6,
    },
  ]);

  assert.equal(series.length, 2);
  assert.deepEqual(series.map((entry) => entry.year), [2023, 2024]);

  const y2024 = series[1];
  assert.equal(y2024.totalGraduates, 400);
  assert.equal(y2024.employedCount, 230);
  // (80 + 150) / (100 + 300) = 0.575 -> 57.5%
  assert.equal(y2024.employabilityPercentage, 57.5);
});

test("buildYearSeries falls back to rate * graduates when employed count is absent", () => {
  const [entry] = buildYearSeries([
    {
      year: 2022,
      programName: "BSN",
      campusBranch: "Gasan",
      graduateCount: 50,
      employabilityRate: 0.7,
    },
  ]);

  assert.equal(entry.employedCount, 35);
  assert.equal(entry.employabilityPercentage, 70);
});

test("summarizePrograms groups per program and campus, ranked by employability", () => {
  const summary = summarizePrograms([
    {
      year: 2024,
      programName: "All Programs",
      campusBranch: "All Campuses",
      graduateCount: 1000,
      employedCount: 500,
      employabilityRate: 0.5,
    },
    {
      year: 2024,
      programName: "BSIT",
      campusBranch: "Boac",
      graduateCount: 100,
      employedCount: 90,
      employabilityRate: 0.9,
    },
    {
      year: 2023,
      programName: "BSIT",
      campusBranch: "Boac",
      graduateCount: 100,
      employedCount: 70,
      employabilityRate: 0.7,
    },
    {
      year: 2024,
      programName: "BSED",
      campusBranch: "Boac",
      graduateCount: 200,
      employedCount: 100,
      employabilityRate: 0.5,
    },
  ]);

  // Institution-wide rows are excluded from the program breakdown.
  assert.equal(summary.length, 2);
  assert.equal(summary[0].programName, "BSIT");
  // (90 + 70) / (100 + 100) = 0.8 -> 80%
  assert.equal(summary[0].employabilityPercentage, 80);
  assert.deepEqual(summary[0].years, [2023, 2024]);
  assert.equal(summary[1].programName, "BSED");
});
