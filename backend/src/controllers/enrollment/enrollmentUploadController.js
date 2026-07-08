// controllers/enrollment/enrollmentUploadController.js
const ExcelJS = require("exceljs");
const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");

// @desc    Upload and parse Consolidated Enrollment Excel sheet safely using ExcelJS
// @route   POST /api/v1/enrollment/upload
// @access  Private/Admin
exports.uploadEnrollmentExcel = async (req, res) => {
  try {
    // 1. Defend against missing file payload
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "Please upload an Excel spreadsheet (.xlsx) file." 
      });
    }

    // 2. Dynamic Year Extraction with solid fallback defaults
    let academicYear = 2021; // Default fallback to match database schema integer requirements
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
      return res.status(400).json({ success: false, error: "The uploaded workbook contains no active worksheets." });
    }

    let currentCampus = "";
    const campusDataMap = {}; 

    // Defensive Row Iteration
    worksheet.eachRow((row, rowNumber) => {
      try {
        const firstCellVal = row.getCell(1).value;
        if (firstCellVal === null || firstCellVal === undefined) return;

        const firstCell = String(firstCellVal).trim();
        if (!firstCell) return;

        // Detect Campus Header boundaries safely (e.g., "BOAC CAMPUS-Tanza...")
        if (firstCell.toUpperCase().includes("CAMPUS-") || firstCell.toUpperCase().includes("CAMPUS")) {
          let rawName = firstCell.split(/CAMPUS-/i)[0].trim();
          if (!rawName) rawName = firstCell.replace(/CAMPUS/i, "").trim();
          
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

        // If no campus header context block has been established yet, skip data ingestion
        if (!currentCampus) return;

        // Ensure row represents a valid program data item (checking for text title presence in cell 2)
        const secondCellVal = row.getCell(2).value;
        if (!secondCellVal) return; 

        const programName = String(secondCellVal).trim();
        if (!programName || !isNaN(programName)) return; // Skip numeric headers or empty structural spacers

        // Dynamically deduce department acronym groups safely
        let department = "General";
        if (programName.includes("Engineering")) department = "Engineering";
        else if (programName.includes("Education") || programName.includes("Teacher")) department = "Education";
        else if (programName.includes("Technology") || programName.includes("Information")) department = "Technology";
        else if (programName.includes("Business") || programName.includes("Accountancy")) department = "Business";
        else if (programName.includes("Nursing") || programName.includes("Midwifery")) department = "Sciences";

        // Extract value mappings out of column matrices safely
        const priorityVal = row.getCell(3).value;
        const neitherVal = row.getCell(4).value;

        const priorityCount = (priorityVal && !isNaN(priorityVal)) ? Number(priorityVal) : 0;
        const neitherCount = (neitherVal && !isNaN(neitherVal)) ? Number(neitherVal) : 0;

        const studentCount = priorityCount > 0 ? priorityCount : neitherCount;
        const isPriorityProgram = priorityCount > 0;

        // Safeguard against text manipulation crashes during shortcode abbreviations creation
        const words = programName.replace("Bachelor of Science", "BS").replace("Bachelor of", "B").split(" ");
        const programCode = words.map(w => w ? w.charAt(0).toUpperCase() : "").join("").substring(0, 6);

        if (studentCount >= 0) {
          campusDataMap[currentCampus].push({
            programName,
            programCode,
            department,
            studentCount,
            isPriorityProgram,
            isActive: studentCount > 0
          });
        }
      } catch (rowErr) {
        // Log individual row anomaly errors without stopping the loop from reading other records
        console.warn(`Skipping row context at index line ${rowNumber}:`, rowErr.message);
      }
    });

    // 4. Terminate processing chain cleanly if spreadsheet layouts yielded zero valid rows
    const processedCampuses = Object.keys(campusDataMap);
    if (processedCampuses.length === 0) {
      return res.status(422).json({
        success: false,
        error: "Could not parse any valid program rows. Please make sure your file contains headers with the term 'CAMPUS'."
      });
    }

    // 5. Build individual atomic operational saving cycles inside MongoDB
    const savePromises = processedCampuses.map(async (campusName) => {
      const programsArray = campusDataMap[campusName];
      if (!programsArray || programsArray.length === 0) return;

      // Ensure queries seek using uniform types matching your database values
      let record = await EnrollmentAnalytics.findOne({ academicYear: academicYear, campus: campusName });
      
      if (record) {
        record.programs = programsArray;
      } else {
        record = new EnrollmentAnalytics({
          academicYear: academicYear,
          campus: campusName,
          programs: programsArray
        });
      }
      return record.save(); 
    });

    // Filter out undefined executions and resolve promises safely
    await Promise.all(savePromises.filter(Boolean));

    return res.status(201).json({
      success: true,
      message: `Successfully processed spreadsheet matrix data metrics using ExcelJS! Imported ${processedCampuses.length} campus directories for Academic Year ${academicYear}.`,
      campusesImported: processedCampuses
    });

  } catch (error) {
    console.error("Critical ExcelJS Data Processing Failure Exception:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};