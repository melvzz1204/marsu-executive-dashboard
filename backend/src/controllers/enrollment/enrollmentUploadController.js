const ExcelJS = require("exceljs");
const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");
const { compareCampusPrograms } = require("../../utils/diffChecker");

/**
 * Helper: Helper to parse raw Excel buffer using your custom campus/program matrix logic
 */
async function parseEnrollmentExcelBuffer(fileBuffer, originalName) {
  let academicYear = 2021; // Default fallback
  if (originalName) {
    const match = originalName.match(/\b(20\d{2})\b/);
    if (match) {
      academicYear = Number(match[1]);
    }
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("The uploaded workbook contains no active worksheets.");
  }

  let currentCampus = "";
  const campusDataMap = {};

  worksheet.eachRow((row, rowNumber) => {
    try {
      const firstCellVal = row.getCell(1).value;
      if (firstCellVal === null || firstCellVal === undefined) return;

      const firstCell = String(firstCellVal).trim();
      if (!firstCell) return;

      // Detect Campus Header boundaries
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

      if (!currentCampus) return;

      const secondCellVal = row.getCell(2).value;
      if (!secondCellVal) return;

      const programName = String(secondCellVal).trim();
      if (!programName || !isNaN(programName)) return;

      let department = "General";
      if (programName.includes("Engineering")) department = "Engineering";
      else if (programName.includes("Education") || programName.includes("Teacher")) department = "Education";
      else if (programName.includes("Technology") || programName.includes("Information")) department = "Technology";
      else if (programName.includes("Business") || programName.includes("Accountancy")) department = "Business";
      else if (programName.includes("Nursing") || programName.includes("Midwifery")) department = "Sciences";

      const priorityVal = row.getCell(3).value;
      const neitherVal = row.getCell(4).value;

      const priorityCount = priorityVal && !isNaN(priorityVal) ? Number(priorityVal) : 0;
      const neitherCount = neitherVal && !isNaN(neitherVal) ? Number(neitherVal) : 0;

      const studentCount = priorityCount > 0 ? priorityCount : neitherCount;
      const isPriorityProgram = priorityCount > 0;

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

  return { academicYear, campusDataMap };
}

// =========================================================================
// STEP 1: PREVIEW ENROLLMENT UPLOAD (Diff Detection)
// @route   POST /api/v1/enrollment/upload-preview
// @access  Private/Admin
// =========================================================================
exports.previewEnrollmentUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Please upload an Excel spreadsheet (.xlsx) file." });
    }

    const { academicYear, campusDataMap } = await parseEnrollmentExcelBuffer(req.file.buffer, req.file.originalname);

    const processedCampuses = Object.keys(campusDataMap);
    if (processedCampuses.length === 0) {
      return res.status(422).json({
        success: false,
        error: "Could not parse any valid program rows. Please make sure headers contain 'CAMPUS'.",
      });
    }

    const diffResults = {
      academicYear,
      summary: { totalCampuses: processedCampuses.length, newCount: 0, modifiedCount: 0, unchangedCount: 0 },
      campusDetails: [],
    };

    // Compare each incoming campus block with existing MongoDB record
    for (const campusName of processedCampuses) {
      const incomingPrograms = campusDataMap[campusName];
      const existingRecord = await EnrollmentAnalytics.findOne({ academicYear, campus: campusName });

      if (!existingRecord) {
        // Entire campus document is new
        diffResults.summary.newCount++;
        diffResults.campusDetails.push({
          campus: campusName,
          status: "NEW",
          programs: incomingPrograms,
        });
      } else {
        // Delegate comparison logic to utils/diffChecker.js
        const changes = compareCampusPrograms(existingRecord.programs, incomingPrograms);

        if (changes.length > 0) {
          diffResults.summary.modifiedCount++;
          diffResults.campusDetails.push({
            campus: campusName,
            status: "MODIFIED",
            changes,
            programs: incomingPrograms,
          });
        } else {
          diffResults.summary.unchangedCount++;
          diffResults.campusDetails.push({
            campus: campusName,
            status: "UNCHANGED",
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `File analyzed for Academic Year ${academicYear}. Review changes before committing.`,
      data: diffResults,
    });
  } catch (error) {
    console.error("Enrollment upload preview error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// =========================================================================
// STEP 2: CONFIRM ENROLLMENT UPLOAD (Commit to MongoDB)
// @route   POST /api/v1/enrollment/upload-confirm
// @access  Private/Admin
// =========================================================================
exports.confirmEnrollmentUpload = async (req, res) => {
  try {
    const { academicYear, campusDetails } = req.body;

    if (!academicYear || !campusDetails || !Array.isArray(campusDetails)) {
      return res.status(400).json({ success: false, error: "Invalid payload provided for confirmation." });
    }

    const savePromises = campusDetails.map(async (item) => {
      if (item.status === "UNCHANGED") return;

      let record = await EnrollmentAnalytics.findOne({ academicYear, campus: item.campus });

      if (record) {
        record.programs = item.programs;
      } else {
        record = new EnrollmentAnalytics({
          academicYear,
          campus: item.campus,
          programs: item.programs,
        });
      }
      return record.save();
    });

    await Promise.all(savePromises.filter(Boolean));

    return res.status(200).json({
      success: true,
      message: `Enrollment analytics for Academic Year ${academicYear} successfully saved!`,
    });
  } catch (error) {
    console.error("Enrollment upload commit error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};