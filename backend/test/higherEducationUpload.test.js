const test = require("node:test");
const assert = require("node:assert/strict");
const ExcelJS = require("exceljs");

const {
  parseHigherEducationWorkbook,
} = require("../src/controllers/higherEducation/higherEducationUploadController");

// Mirrors the real per-program employability workbook layout:
// Program_name | Year | Total_graduates | Total_employed | Employment Rate
// with college grouping rows and a trailing total row.
function buildWorkbook(rows) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Employability_per-program-2023");
  rows.forEach((row) => worksheet.addRow(row));
  return workbook;
}

const HEADERS = [
  "Program_name",
  "Year",
  "Total_graduates",
  "Total_employed",
  "Employment Rate",
];

test("parses per-program employability files with college group rows", () => {
  const workbook = buildWorkbook([
    HEADERS,
    ["COLLEGE OF EDUCATION", "", "", "", ""],
    ["BACHELOR OF ELEMENTARY EDUCATION", "2023", "23", "10", "0.4347826087"],
    ["COLLEGE OF ENGINEERING", "", "", "", ""],
    ["BACHELOR OF SCIENCE IN  CIVIL ENGINEERING", "2023", "91", "62", "0.6813186813"],
    ["GRAND TOTAL", "", "1566", "827", ""],
    ["", "Total Employment Rate (Higher Ed)", "1566", "827", "0.5280970626"],
  ]);

  const { parsedPrograms, parsedTracers } = parseHigherEducationWorkbook(workbook);

  // No campus column -> no registry rows, only tracer rows.
  assert.equal(parsedPrograms.length, 0);
  assert.equal(parsedTracers.length, 2);

  const [first, second] = parsedTracers;
  assert.equal(first.programName, "BACHELOR OF ELEMENTARY EDUCATION");
  assert.equal(first.collegeName, "COLLEGE OF EDUCATION");
  assert.equal(first.campusBranch, "All Campuses");
  assert.equal(first.graduateCount, 23);
  assert.equal(first.employedCount, 10);
  assert.equal(first.employabilityRate, 0.4347826087);

  // Double spaces normalized, college forward-filled, total rows skipped.
  assert.equal(second.programName, "BACHELOR OF SCIENCE IN CIVIL ENGINEERING");
  assert.equal(second.collegeName, "COLLEGE OF ENGINEERING");
  assert.equal(second.employedCount, 62);
});

test("accepts percentage-form employment rates and default labels", () => {
  const workbook = buildWorkbook([
    HEADERS,
    ["BACHELOR OF SCIENCE IN AGRICULTURE", "2024", "100", "85", "85"],
  ]);

  const { parsedTracers } = parseHigherEducationWorkbook(workbook);

  assert.equal(parsedTracers.length, 1);
  assert.equal(parsedTracers[0].employabilityRate, 0.85);
  assert.equal(parsedTracers[0].collegeName, null);
});

test("derives employed count from the rate when it is missing", () => {
  const workbook = buildWorkbook([
    HEADERS,
    ["BACHELOR OF SCIENCE IN NURSING", "2024", "50", "", "0.7"],
  ]);

  const { parsedTracers } = parseHigherEducationWorkbook(workbook);

  assert.equal(parsedTracers[0].employedCount, 35);
});
