// controllers/enrollment/enrollmentUploadController.js
const ExcelJS = require("exceljs");
const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");

/**
 * Safely extracts string content from ExcelJS cell values regardless of cell type
 */
function extractCellValue(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return "";
  if (typeof cell.value === "object") {
    if (cell.value.result !== undefined && cell.value.result !== null) {
      return String(cell.value.result).trim();
    }
    if (cell.value.richText) {
      return cell.value.richText
        .map((t) => t.text)
        .join("")
        .trim();
    }
  }
  return String(cell.value).trim();
}

/**
 * Helper to parse a 4-digit start year from text (e.g., "2022-2023 Enrollment" -> 2022)
 */
function parseYearFromText(text) {
  if (!text) return null;
  const match = String(text).match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

/**
 * Helper to normalize semester text extracted directly from sheet content/cells
 */
function normalizeSemesterFromContent(text) {
  if (!text) return "1st Semester";
  const cleanStr = String(text).toUpperCase().trim();

  if (
    cleanStr.includes("2ND") ||
    cleanStr.includes("SECOND") ||
    cleanStr === "2"
  ) {
    return "2nd Semester";
  }
  if (
    cleanStr.includes("1ST") ||
    cleanStr.includes("FIRST") ||
    cleanStr === "1"
  ) {
    return "1st Semester";
  }
  if (cleanStr.includes("SUMMER") || cleanStr.includes("MIDYEAR")) {
    return "Summer";
  }

  // Return verbatim if already formatted (e.g., "1st Semester")
  return text.trim();
}

// @desc    Upload and parse Consolidated Enrollment Excel sheet across valid year tabs
// @route   POST /api/v1/enrollment/upload
// @access  Private/Admin
exports.uploadEnrollmentExcel = async (req, res) => {
  try {
    // 1. Defend against missing file payload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload an Excel spreadsheet (.xlsx) file.",
      });
    }

    // 2. Extract target academic year from request body if specified
    let targetYear = null;
    const yearInput = req.body.academicYear || req.body.year;
    if (yearInput) {
      targetYear = parseYearFromText(yearInput);
    }

    // 3. Load the Excel file buffer using ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      return res.status(400).json({
        success: false,
        error: "The uploaded workbook contains no active worksheets.",
      });
    }

    const datasetByYearCampusAndSemester = {};

    // 4. Loop through ALL worksheets/tabs in the file
    workbook.worksheets.forEach((worksheet) => {
      // Check ONLY if the TAB / SHEET NAME contains a 4-digit school year format
      const tabYear = parseYearFromText(worksheet.name);

      // Skip tabs that do NOT have a school year in their name or have no data rows
      if (!tabYear || worksheet.rowCount <= 1) {
        return;
      }

      // Filter by targetYear if user specified one in request payload
      if (targetYear && tabYear !== targetYear) {
        return;
      }

      // Identify Header Row Mapping for this sheet
      const headerRow = worksheet.getRow(1);
      const colIndexes = {};

      headerRow.eachCell((cell, colNumber) => {
        const headerText = extractCellValue(cell)
          .toUpperCase()
          .replace(/[\s_]+/g, "");
        if (headerText.includes("SEMESTER") || headerText.includes("SEM"))
          colIndexes.semester = colNumber;
        if (headerText.includes("CAMPUS")) colIndexes.campus = colNumber;
        if (headerText.includes("PROGRAMCODE") || headerText.includes("CODE"))
          colIndexes.programCode = colNumber;
        if (headerText.includes("PROGRAMNAME") || headerText.includes("NAME"))
          colIndexes.programName = colNumber;
        if (
          headerText.includes("CLASSIFICATION") ||
          headerText.includes("PRIORITY")
        )
          colIndexes.programClassification = colNumber;
        if (
          headerText.includes("ENROLLEDCOUNT") ||
          headerText.includes("ENROLLED") ||
          headerText.includes("COUNT")
        )
          colIndexes.enrolledCount = colNumber;
      });

      // Header index fallbacks
      if (!colIndexes.semester) colIndexes.semester = 2;
      if (!colIndexes.campus) colIndexes.campus = 3;
      if (!colIndexes.programCode) colIndexes.programCode = 4;
      if (!colIndexes.programName) colIndexes.programName = 5;
      if (!colIndexes.programClassification)
        colIndexes.programClassification = 6;
      if (!colIndexes.enrolledCount) colIndexes.enrolledCount = 7;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        try {
          // Read and normalize semester DIRECTLY from row content
          const rawRowSemester = extractCellValue(
            row.getCell(colIndexes.semester),
          );
          const semester = normalizeSemesterFromContent(rawRowSemester);

          const campus = extractCellValue(row.getCell(colIndexes.campus));
          const programCode = extractCellValue(
            row.getCell(colIndexes.programCode),
          );
          const programName = extractCellValue(
            row.getCell(colIndexes.programName),
          );
          const classification = extractCellValue(
            row.getCell(colIndexes.programClassification),
          );
          const rawCount = extractCellValue(
            row.getCell(colIndexes.enrolledCount),
          );

          // Skip completely blank rows
          if (!programName && !campus) return;

          const studentCount = parseInt(rawCount, 10) || 0;
          const isPriorityProgram =
            classification.toUpperCase().includes("CHED") ||
            classification.toUpperCase().includes("PRIORITY");

          // Infer department group
          let department = "General";
          if (
            programName.includes("Engineering") ||
            programCode.includes("CE") ||
            programCode.includes("EE")
          )
            department = "Engineering";
          else if (
            programName.includes("Education") ||
            programName.includes("Teacher") ||
            programName.includes("Arts")
          )
            department = "Education";
          else if (
            programName.includes("Technology") ||
            programName.includes("Information") ||
            programName.includes("Computer")
          )
            department = "Technology";
          else if (
            programName.includes("Business") ||
            programName.includes("Accountancy")
          )
            department = "Business";
          else if (
            programName.includes("Nursing") ||
            programName.includes("Midwifery") ||
            programName.includes("Agriculture")
          )
            department = "Sciences";

          const formattedCampus = campus
            ? campus.charAt(0).toUpperCase() + campus.slice(1).toLowerCase()
            : "Boac";

          // Group strictly by (School Year from Tab Name) + (Campus) + (Semester from Row Cell)
          const groupKey = `${tabYear}_${formattedCampus}_${semester.replace(/\s+/g, "")}`;

          if (!datasetByYearCampusAndSemester[groupKey]) {
            datasetByYearCampusAndSemester[groupKey] = {
              academicYear: tabYear,
              campus: formattedCampus,
              semester: semester,
              programs: [],
            };
          }

          datasetByYearCampusAndSemester[groupKey].programs.push({
            programName,
            programCode:
              programCode || programName.substring(0, 6).toUpperCase(),
            department,
            semester,
            programClassification: classification,
            studentCount,
            isPriorityProgram,
            isActive: studentCount > 0,
          });
        } catch (rowErr) {
          console.warn(
            `Skipping row at line ${rowNumber} in sheet '${worksheet.name}':`,
            rowErr.message,
          );
        }
      });
    });

    const groupsToSave = Object.values(datasetByYearCampusAndSemester);

    if (groupsToSave.length === 0) {
      return res.status(422).json({
        success: false,
        error: targetYear
          ? `No valid enrollment records found matching academic year ${targetYear}.`
          : "Could not find any tabs matching a valid school year format with enrollment data.",
      });
    }

    // 5. Save or update inside MongoDB
    const savePromises = groupsToSave.map(async (group) => {
      let record = await EnrollmentAnalytics.findOne({
        academicYear: group.academicYear,
        campus: group.campus,
        semester: group.semester,
      });

      if (record) {
        record.programs = group.programs;
      } else {
        record = new EnrollmentAnalytics({
          academicYear: group.academicYear,
          campus: group.campus,
          semester: group.semester,
          programs: group.programs,
        });
      }
      return record.save();
    });
    await Promise.all(savePromises);

    return res.status(201).json({
      success: true,
      message: `Successfully ingested enrollment dataset! Processed ${groupsToSave.length} campus/semester group(s)${
        targetYear ? ` specifically for Academic Year ${targetYear}` : ""
      }.`,
      recordsIngested: groupsToSave.length,
    });
  } catch (error) {
    console.error("Critical ExcelJS Data Processing Failure Exception:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
