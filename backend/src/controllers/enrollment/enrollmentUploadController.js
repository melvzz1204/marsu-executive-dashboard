const ExcelJS = require("exceljs");
const mongoose = require("mongoose");
const EnrollmentAnalytics = require("../../models/enrollment/enrollmentAnalyticsModel");
const UploadLog = require("../../models/uploadLogModel");

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
 * Helper to format a start year into "AY YYYY-YYYY" format (e.g., 2021 -> "AY 2021-2022")
 */
function formatAcademicYear(year) {
  if (!year) return null;
  const numYear = Number(year);
  if (isNaN(numYear)) return String(year);
  return `AY ${numYear}-${numYear + 1}`;
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

  return text.trim();
}

/**
 * Helper to format raw byte count into human-readable string (e.g. "1.24 MB")
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

exports.uploadEnrollmentExcel = async (req, res) => {
  const fileName = req.file?.originalname || "Unknown_File.xlsx";
  const fileSize = formatFileSize(req.file?.size);
  const uploadedBy = req.user?.name || req.user?.id || "Authenticated Admin";
  const forceOverwrite =
    req.body.overwrite === "true" || req.body.overwrite === true;

  try {
    // 1. Defend against missing file payload
    if (!req.file) {
      await UploadLog.create({
        module: "ENROLLMENT",
        fileName: "N/A",
        fileSize: "0 KB",
        uploadedBy,
        status: "FAILED",
        errorMessage: "No file was attached to the request.",
      });

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
      await UploadLog.create({
        module: "ENROLLMENT",
        fileName,
        fileSize,
        uploadedBy,
        targetYear: formatAcademicYear(targetYear),
        status: "FAILED",
        errorMessage: "Workbook contains no active worksheets.",
      });

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

          if (!programName || !campus) return;

          const parsedStudentCount = Number(rawCount);
          if (!Number.isFinite(parsedStudentCount) || parsedStudentCount < 0) {
            return;
          }
          const studentCount = Math.trunc(parsedStudentCount);
          const isPriorityProgram =
            classification.toUpperCase().includes("CHED") ||
            classification.toUpperCase().includes("PRIORITY");

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

    // AUTO-DETECT TARGET YEAR & SEMESTER FROM PARSED DATA
    let detectedSemester = null;
    if (groupsToSave.length > 0) {
      if (!targetYear) {
        const detectedYears = [
          ...new Set(groupsToSave.map((g) => g.academicYear)),
        ];
        targetYear = detectedYears[0] || null;
      }
      const detectedSemesters = [
        ...new Set(groupsToSave.map((g) => g.semester)),
      ];
      detectedSemester =
        detectedSemesters.length === 1
          ? detectedSemesters[0]
          : detectedSemesters.length > 1
            ? "Multi-Semester"
            : null;
    }

    const formattedTargetYear = formatAcademicYear(targetYear);

    if (groupsToSave.length === 0) {
      const errText = formattedTargetYear
        ? `No valid enrollment records found matching academic year ${formattedTargetYear}.`
        : "Could not find any tabs matching a valid school year format with enrollment data.";

      await UploadLog.create({
        module: "ENROLLMENT",
        fileName,
        fileSize,
        uploadedBy,
        targetYear: formattedTargetYear,
        semester: detectedSemester,
        status: "FAILED",
        errorMessage: errText,
      });

      return res.status(422).json({
        success: false,
        error: errText,
      });
    }

    // Calculate total individual program records parsed across all groups
    const totalProgramRecords = groupsToSave.reduce(
      (sum, group) => sum + group.programs.length,
      0,
    );

    // 5. SCAN DATABASE FOR DUPLICATE GROUPS
    const duplicateConditions = groupsToSave.map((g) => ({
      academicYear: g.academicYear,
      campus: g.campus,
      semester: g.semester,
    }));

    const existingRecords = await EnrollmentAnalytics.find({
      $or: duplicateConditions,
    });

    // ⚠️ IF MATCHES FOUND AND ADMIN HAS NOT CONFIRMED OVERWRITE -> LOG & RETURN 409
    if (existingRecords.length > 0 && !forceOverwrite) {
      const blockMessage = `Found ${existingRecords.length} existing campus/semester group(s) in the database matching this Excel file.`;

      await UploadLog.create({
        module: "ENROLLMENT",
        fileName,
        fileSize,
        uploadedBy,
        targetYear: formattedTargetYear,
        semester: detectedSemester,
        status: "DUPLICATE_BLOCK",
        groupsProcessed: groupsToSave.length,
        recordsProcessed: totalProgramRecords,
        isOverwrite: false,
        errorMessage: blockMessage,
      });

      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: blockMessage,
      });
    }

    // 6. Atomically save or overwrite all groups.
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const group of groupsToSave) {
          let record = await EnrollmentAnalytics.findOne({
            academicYear: group.academicYear,
            campus: group.campus,
            semester: group.semester,
          }).session(session);

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
          await record.save({ session });
        }
      });
    } finally {
      await session.endSession();
    }

    // 7. RECORD SUCCESSFUL UPLOAD OR OVERWRITE LOG
    await UploadLog.create({
      module: "ENROLLMENT",
      fileName,
      fileSize,
      uploadedBy,
      targetYear: formattedTargetYear,
      semester: detectedSemester,
      status: forceOverwrite ? "OVERWRITE" : "SUCCESS",
      groupsProcessed: groupsToSave.length,
      recordsProcessed: totalProgramRecords,
      isOverwrite: forceOverwrite,
    });

    return res.status(201).json({
      success: true,
      message: forceOverwrite
        ? `Successfully overwritten enrollment dataset! Processed ${groupsToSave.length} campus/semester group(s).`
        : `Successfully ingested enrollment dataset! Processed ${groupsToSave.length} campus/semester group(s).`,
      recordsIngested: groupsToSave.length,
      totalProgramsProcessed: totalProgramRecords,
    });
  } catch (error) {
    console.error("Critical ExcelJS Data Processing Failure Exception:", error);

    await UploadLog.create({
      module: "ENROLLMENT",
      fileName,
      fileSize,
      uploadedBy,
      status: "FAILED",
      errorMessage: error.message,
    }).catch((logErr) =>
      console.error("Failed to persist failure log to MongoDB:", logErr),
    );

    const isWorkbookError = /zip|workbook|excel|xlsx/i.test(error.message);
    return res.status(isWorkbookError ? 400 : 500).json({
      success: false,
      error: isWorkbookError
        ? "The uploaded file is not a valid Excel workbook."
        : "Enrollment upload processing failed.",
    });
  }
};

/**
 * GET /api/v1/enrollment/logs
 * Retrieves the spreadsheet upload history logs
 */
exports.getUploadLogs = async (req, res) => {
  try {
    const logs = await UploadLog.find({ module: "ENROLLMENT" })
      .sort({ uploadedAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Failed to fetch upload logs:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve upload history logs.",
    });
  }
};

/**
 * DELETE /api/v1/enrollment/logs
 * Permanently clears enrollment upload history logs.
 */
exports.clearUploadLogs = async (req, res) => {
  try {
    const result = await UploadLog.deleteMany({ module: "ENROLLMENT" });

    return res.status(200).json({
      success: true,
      message: "Enrollment upload history cleared.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Failed to clear enrollment upload logs:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to clear upload history logs.",
    });
  }
};
