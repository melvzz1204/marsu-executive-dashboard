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

        if (!colA && !colB) return;

        // --- Detect Campus Header boundaries ---
        // Headers may appear in Col A (e.g., "BOAC CAMPUS-Tanza...") or Col B
        const targetHeaderStr = colA.toUpperCase().includes("CAMPUS") ? colA : colB;

        if (targetHeaderStr && targetHeaderStr.toUpperCase().includes("CAMPUS")) {
          let rawName = targetHeaderStr.split(/CAMPUS/i)[0].replace(/[-_]/g, "").trim();
          if (!rawName) rawName = targetHeaderStr.replace(/CAMPUS/i, "").trim();

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
        // In the Excel matrix, program titles are located in Column B (Cell 2)
        const programName = colB;

        // Skip header titles, instructions, empty spacer rows, or pure numeric strings
        if (
          !programName ||
          !isNaN(programName) ||
          programName.toUpperCase().includes("PROGRAM NAME") ||
          programName.toUpperCase().includes("LIST UNDERGRADUATE") ||
          programName.toUpperCase().includes("SPELL OUT") ||
          programName.toUpperCase().includes("INCOMPLETE ENTRIES") ||
          programName.toUpperCase().includes("MEANS OF VERIFICATION")
        ) {
          return;
        }

        // Dynamically deduce department group
        let department = "General";
        if (programName.includes("Engineering")) department = "Engineering";
        else if (programName.includes("Education") || programName.includes("Teacher")) department = "Education";
        else if (programName.includes("Technology") || programName.includes("Information")) department = "Technology";
        else if (programName.includes("Business") || programName.includes("Accountancy")) department = "Business";
        else if (programName.includes("Nursing") || programName.includes("Midwifery")) department = "Sciences";

        // Extract value mappings: Col C (Cell 3) = Priority, Col D (Cell 4) = Neither
        const priorityVal = row.getCell(3).value;
        const neitherVal = row.getCell(4).value;

        const priorityCount = priorityVal !== null && priorityVal !== undefined && !isNaN(priorityVal) ? Number(priorityVal) : 0;
        const neitherCount = neitherVal !== null && neitherVal !== undefined && !isNaN(neitherVal) ? Number(neitherVal) : 0;

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
        error: "Could not parse any valid program rows. Please check your Excel headers and formatting.",
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