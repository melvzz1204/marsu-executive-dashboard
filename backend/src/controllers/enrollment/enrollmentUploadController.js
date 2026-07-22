// controllers/enrollment/enrollmentUploadController.js
const ExcelJS = require("exceljs");
const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");

/**
 * Safely extracts string content from ExcelJS cell values regardless of cell type
 * (handles string, number, formula object, rich text object, etc.)
 */
function extractCellValue(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return "";
  if (typeof cell.value === "object") {
    if (cell.value.result !== undefined && cell.value.result !== null) {
      return String(cell.value.result).trim();
    }
    if (cell.value.richText) {
      return cell.value.richText.map((t) => t.text).join("").trim();
    }
  }
  return String(cell.value).trim();
}

// @desc    Upload and parse Consolidated Enrollment Excel sheet safely using ExcelJS
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

    // 2. Dynamic Year Extraction with solid fallback defaults
    let academicYear = 2021; // Default fallback integer
    if (req.file.originalname) {
      const match = req.file.originalname.match(/\b(20\d{2})\b/);
      if (match) {
        academicYear = Number(match[1]);
      }
    }

    // 3. Extract the file memory buffer cleanly using ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).json({
        success: false,
        error: "The uploaded workbook contains no active worksheets.",
      });
    }

    let currentCampus = "";
    const campusDataMap = {};

    // 4. Defensive Row Iteration
    worksheet.eachRow((row, rowNumber) => {
      try {
        const colA = extractCellValue(row.getCell(1));
        const colB = extractCellValue(row.getCell(2));
        const colC = extractCellValue(row.getCell(3));
        const colD = extractCellValue(row.getCell(4));

        if (!colA && !colB && !colC && !colD) return;

        // Combine text across first two columns to reliably detect headers & skip words
        const combinedRowStart = `${colA} ${colB}`.trim().toUpperCase();

        // --- Ignore Bottom Table Footers & Table Headers ---
        if (
          combinedRowStart.startsWith("TOTAL") ||
          combinedRowStart.startsWith("GRAND TOTAL") ||
          combinedRowStart.startsWith("PERCENTAGE") ||
          combinedRowStart.includes("PROGRAM NAME") ||
          combinedRowStart.includes("NO. OF ENROLLMENT") ||
          combinedRowStart.includes("SUPPORTING DOCUMENTS") ||
          combinedRowStart.includes("LIST UNDERGRADUATE") ||
          combinedRowStart.includes("CHED-IDENTIFIED") ||
          combinedRowStart.includes("NEITHER")
        ) {
          return;
        }

        // --- Detect Campus Header Boundaries ---
        // e.g. "BOAC CAMPUS-Tanza...", "GASAN CAMPUS-Pinggan...", "SANTA CRUZ CAMPUS..."
        if (colA.toUpperCase().includes("CAMPUS") || colB.toUpperCase().includes("CAMPUS")) {
          const rawCampusStr = colA.toUpperCase().includes("CAMPUS") ? colA : colB;
          
          let rawName = rawCampusStr.split(/CAMPUS/i)[0].replace(/[-_]/g, "").trim();
          if (!rawName) rawName = rawCampusStr.replace(/CAMPUS/i, "").trim();

          if (rawName.toUpperCase().includes("SANTA CRUZ")) {
            currentCampus = "Santa Cruz";
          } else {
            currentCampus = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
          }

          if (!campusDataMap[currentCampus]) {
            campusDataMap[currentCampus] = [];
          }
          return;
        }

        // Skip rows until a campus context block is established
        if (!currentCampus) return;

        // --- Extract Program Data ---
        // Program Name is in Column B (Cell 2) or Column A if unnumbered
        let programName = colB;
        if (!programName || !isNaN(programName)) {
          // If colB was a row number (e.g. 1, 2, 3), check colC or colA
          if (isNaN(colA) && colA.length > 3) {
            programName = colA;
          }
        }

        // Skip invalid/numeric program titles
        if (!programName || !isNaN(programName) || programName.length < 3) {
          return;
        }

        // Dynamically deduce department group
        let department = "General";
        if (programName.includes("Engineering")) department = "Engineering";
        else if (programName.includes("Education") || programName.includes("Teacher") || programName.includes("Arts")) department = "Education";
        else if (programName.includes("Technology") || programName.includes("Information") || programName.includes("Computer")) department = "Technology";
        else if (programName.includes("Business") || programName.includes("Accountancy")) department = "Business";
        else if (programName.includes("Nursing") || programName.includes("Midwifery") || programName.includes("Agriculture")) department = "Sciences";

        // Extract value mappings: Priority vs Neither
        // Look in cells 3, 4, or 5 depending on column alignment
        const valCol3 = row.getCell(3).value;
        const valCol4 = row.getCell(4).value;

        const priorityCount = valCol3 !== null && valCol3 !== undefined && !isNaN(valCol3) ? Number(valCol3) : 0;
        const neitherCount = valCol4 !== null && valCol4 !== undefined && !isNaN(valCol4) ? Number(valCol4) : 0;

        const studentCount = priorityCount > 0 ? priorityCount : neitherCount;
        const isPriorityProgram = priorityCount > 0;

        // Generate program shortcode abbreviation
        const words = programName.replace("Bachelor of Science", "BS").replace("Bachelor of", "B").split(" ");
        const programCode = words.map((w) => (w ? w.charAt(0).toUpperCase() : "")).join("").substring(0, 6);

        if (studentCount >= 0) {
          campusDataMap[currentCampus].push({
            programName,
            programCode,
            department,
            studentCount,
            isPriorityProgram,
            isActive: studentCount > 0,
          });
        }
      } catch (rowErr) {
        console.warn(`Skipping row context at index line ${rowNumber}:`, rowErr.message);
      }
    });

    // 5. Filter out any empty campus blocks before saving
    const processedCampuses = Object.keys(campusDataMap).filter(
      (campus) => campusDataMap[campus] && campusDataMap[campus].length > 0
    );

    if (processedCampuses.length === 0) {
      return res.status(422).json({
        success: false,
        error: "Could not parse any valid program rows. Please check your Excel table structure.",
      });
    }

    // 6. Build atomic save operations inside MongoDB
    const savePromises = processedCampuses.map(async (campusName) => {
      const programsArray = campusDataMap[campusName];

      let record = await EnrollmentAnalytics.findOne({ academicYear, campus: campusName });

      if (record) {
        record.programs = programsArray;
      } else {
        record = new EnrollmentAnalytics({
          academicYear,
          campus: campusName,
          programs: programsArray,
        });
      }
      return record.save();
    });

    await Promise.all(savePromises.filter(Boolean));

    return res.status(201).json({
      success: true,
      message: `Successfully processed enrollment metrics! Imported ${processedCampuses.length} campus directories for Academic Year ${academicYear}.`,
      campusesImported: processedCampuses,
    });
  } catch (error) {
    console.error("Critical ExcelJS Data Processing Failure Exception:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};