const ExcelJS = require("exceljs");
const HigherEducation = require("../../models/higherEducation/higherEducationModel");
const HigherEducationTracer = require("../../models/higherEducation/higherEducationTracerModel");
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
    if (cell.value instanceof Date) return cell.value;
    if (cell.value.error) return "";
  }
  return String(cell.value).trim();
}

/**
 * Helper to normalize date strings, Date objects, or Excel serial numbers
 */
function parseExcelDate(val) {
  if (!val || val === "NaT" || val === "N/A") return null;
  if (val instanceof Date && !isNaN(val)) return val;
  if (typeof val === "number") {
    return new Date(Math.round((val - 25569) * 86400 * 1000));
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
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

/**
 * Helper to calculate accreditation and review status fields
 */
function computeStatusFields(accreditationStatus, endDate) {
  const NON_ACCREDITED_STATUSES = [
    "Not Accredited",
    "Candidate Status",
    "In Progress",
    "For Phase-out",
    "N/A",
    "",
  ];

  const cleanStatus = accreditationStatus
    ? String(accreditationStatus).trim()
    : "";
  const isAccredited = Boolean(
    cleanStatus && !NON_ACCREDITED_STATUSES.includes(cleanStatus),
  );

  const today = new Date();
  let reviewStatus = "N/A";

  if (endDate && isAccredited) {
    if (new Date(endDate) < today) {
      reviewStatus = "Review Overdue";
    } else {
      reviewStatus = "Up To Date";
    }
  }

  return { isAccredited, reviewStatus };
}

/**
 * Helper to safely parse numeric values
 */
function parseNumeric(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const cleaned = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
  return isNaN(cleaned) ? 0 : cleaned;
}

/**
 * @desc Upload & process Excel File into both Program & Tracer collections
 * @route POST /api/v1/higher-education/upload
 */
exports.uploadHigherEducationExcel = async (req, res) => {
  const fileName = req.file?.originalname || "Unknown_File.xlsx";
  const fileSize = formatFileSize(req.file?.size);
  const uploadedBy = req.user?.name || req.user?.id || "Authenticated Admin";
  const forceOverwrite =
    req.body.overwrite === "true" || req.body.overwrite === true;

  try {
    // 1. Defend against missing file payload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload an Excel spreadsheet (.xlsx) file.",
      });
    }

    // 2. Load the Excel file buffer using ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      return res.status(400).json({
        success: false,
        error: "The uploaded workbook contains no active worksheets.",
      });
    }

    // Sheet 1: Main Higher-education Programs & Institutional Tracer Summary
    const mainWorksheet = workbook.getWorksheet(1);
    const parsedPrograms = [];
    const parsedTracersMap = new Map(); // Keyed by year to aggregate program breakdowns

    if (mainWorksheet && mainWorksheet.rowCount > 1) {
      const headers = [];
      const headerRow = mainWorksheet.getRow(1);

      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const val = extractCellValue(cell);
        headers[colNumber] = val ? String(val).trim() : "";
      });

      mainWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip Header Row

        const rowData = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const headerName = headers[colNumber];
          if (headerName) {
            rowData[headerName] = extractCellValue(cell);
          }
        });

        // Process Program Registry Data
        const campusBranch = rowData["Campus_Branch"]
          ? String(rowData["Campus_Branch"]).trim()
          : "";
        const programName = rowData["Program_Name"]
          ? String(rowData["Program_Name"]).trim()
          : "";

        if (campusBranch && programName) {
          const rawAccreditation = rowData["Accreditation_Status"]
            ? String(rowData["Accreditation_Status"]).trim()
            : "";
          const accreditationStatus = rawAccreditation || "Not Accredited";
          const startDate = parseExcelDate(rowData["Start_Date"]);
          const endDate = parseExcelDate(rowData["End_Date"]);

          const { isAccredited, reviewStatus } = computeStatusFields(
            accreditationStatus,
            endDate,
          );

          parsedPrograms.push({
            campusBranch,
            programName,
            yearInitialOperation: rowData["Year_Initial_Operation"]
              ? String(rowData["Year_Initial_Operation"]).trim()
              : "N/A",
            accreditationStatus,
            startDate,
            endDate,
            isAccredited,
            reviewStatus,
          });
        }

        // Process Yearly Employability & Graduate Tracer Data (Summary)
        const yearVal = parseNumeric(rowData["Year"]);
        if (yearVal && yearVal > 1900) {
          let rawEmployability = rowData["Employability_Rate"];
          let employabilityRate = 0;

          if (typeof rawEmployability === "number") {
            employabilityRate =
              rawEmployability > 1 ? rawEmployability / 100 : rawEmployability;
          } else if (typeof rawEmployability === "string") {
            const cleaned = parseFloat(
              rawEmployability.replace("%", "").trim(),
            );
            if (!isNaN(cleaned)) {
              employabilityRate = cleaned > 1 ? cleaned / 100 : cleaned;
            }
          }

          const graduateCount = parseNumeric(rowData["Graduate_Count"]);
          const rawEmployed = rowData["No._of_Graduate_Employed"];
          let employedCount = 0;

          if (
            rawEmployed !== undefined &&
            rawEmployed !== null &&
            rawEmployed !== ""
          ) {
            employedCount = parseNumeric(rawEmployed);
          } else {
            employedCount = Math.round(graduateCount * employabilityRate);
          }

          if (!parsedTracersMap.has(yearVal)) {
            parsedTracersMap.set(yearVal, {
              year: yearVal,
              graduateCount,
              employabilityRate,
              employedCount,
              programBreakdown: [],
            });
          } else {
            const existing = parsedTracersMap.get(yearVal);
            existing.graduateCount = graduateCount;
            existing.employabilityRate = employabilityRate;
            existing.employedCount = employedCount;
          }
        }
      });
    }

    // Process additional sheets for program employability breakdowns
    workbook.worksheets.forEach((ws) => {
      const sheetName = ws.name ? ws.name.trim() : "";
      if (sheetName.toLowerCase().startsWith("employability_per-program")) {
        // Extract year from sheet name (e.g. "Employability_per-program-2023" -> 2023)
        const sheetYearMatch = sheetName.match(/\d{4}/);
        const sheetYear = sheetYearMatch
          ? parseInt(sheetYearMatch[0], 10)
          : null;

        let currentCollege = "";

        ws.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip Header Row

          const progNameCell = extractCellValue(row.getCell(1));
          const rowYearCell = parseNumeric(extractCellValue(row.getCell(2)));
          const totalGrads = parseNumeric(extractCellValue(row.getCell(3)));
          const totalEmployed = parseNumeric(extractCellValue(row.getCell(4)));
          let empRateRaw = extractCellValue(row.getCell(5));

          if (!progNameCell) return;

          // Check if row is a College Section Header (e.g., "COLLEGE OF EDUCATION")
          if (
            progNameCell.toUpperCase().startsWith("COLLEGE OF") ||
            progNameCell.toUpperCase().includes("SCHOOL OF")
          ) {
            currentCollege = progNameCell.trim();
            return;
          }

          // Skip total / summary rows
          if (
            progNameCell.toLowerCase().includes("total employment rate") ||
            progNameCell.toLowerCase().includes("total")
          ) {
            return;
          }

          const targetYear =
            sheetYear || (rowYearCell > 1900 ? rowYearCell : null);
          if (!targetYear) return;

          let empRate = 0;
          if (typeof empRateRaw === "number") {
            empRate = empRateRaw > 1 ? empRateRaw / 100 : empRateRaw;
          } else if (typeof empRateRaw === "string" && empRateRaw) {
            const cleanRate = parseFloat(empRateRaw.replace("%", "").trim());
            if (!isNaN(cleanRate)) {
              empRate = cleanRate > 1 ? cleanRate / 100 : cleanRate;
            }
          }

          // If formula error (#DIV/0!) or 0, calculate manually
          if (
            (!empRate || isNaN(empRate)) &&
            totalGrads > 0 &&
            totalEmployed >= 0
          ) {
            empRate = Math.round((totalEmployed / totalGrads) * 10000) / 10000;
          }

          const programItem = {
            college: currentCollege || "General",
            programName: progNameCell.trim(),
            totalGraduates: totalGrads,
            totalEmployed: totalEmployed,
            employmentRate: empRate,
          };

          if (!parsedTracersMap.has(targetYear)) {
            parsedTracersMap.set(targetYear, {
              year: targetYear,
              graduateCount: 0,
              employabilityRate: 0,
              employedCount: 0,
              programBreakdown: [programItem],
            });
          } else {
            parsedTracersMap.get(targetYear).programBreakdown.push(programItem);
          }
        });
      }
    });

    const parsedTracers = Array.from(parsedTracersMap.values());

    // 4. Validate parsed records count
    if (parsedPrograms.length === 0 && parsedTracers.length === 0) {
      return res.status(422).json({
        success: false,
        error:
          "Could not find any valid higher education or tracer records in the spreadsheet.",
      });
    }

    // 5. SCAN DATABASE FOR EXISTING RECORDS
    const totalExistingPrograms = await HigherEducation.countDocuments();
    const totalExistingTracers = await HigherEducationTracer.countDocuments();
    const hasExistingData =
      totalExistingPrograms > 0 || totalExistingTracers > 0;

    // IF DATA EXISTS AND OVERWRITE IS NOT CONFIRMED -> BLOCK & RETURN 409
    if (hasExistingData && !forceOverwrite) {
      await UploadLog.create({
        module: "HIGHER_EDUCATION",
        fileName,
        fileSize,
        uploadedBy,
        status: "DUPLICATE_BLOCK",
        isOverwrite: false,
        errorMessage: `Upload blocked. Found existing dataset in database. Confirmation required to overwrite.`,
      }).catch(() => {});

      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: `Found existing higher education records in the database. Re-uploading will replace the dataset with your spreadsheet.`,
      });
    }

    // 6. SAVE OR REPLACE RECORDS IN MONGODB
    if (forceOverwrite) {
      // Clear current collection datasets to reflect deletions made in Excel
      await HigherEducation.deleteMany({});
      await HigherEducationTracer.deleteMany({});
    }

    if (parsedPrograms.length > 0) {
      await HigherEducation.insertMany(parsedPrograms);
    }

    if (parsedTracers.length > 0) {
      await HigherEducationTracer.insertMany(parsedTracers);
    }

    const totalRecordsProcessed = parsedPrograms.length + parsedTracers.length;

    // 7. RECORD LOG
    await UploadLog.create({
      module: "HIGHER_EDUCATION",
      fileName,
      fileSize,
      uploadedBy,
      status: forceOverwrite ? "OVERWRITE" : "SUCCESS",
      recordsProcessed: totalRecordsProcessed,
      isOverwrite: forceOverwrite,
    });

    return res.status(201).json({
      success: true,
      message: forceOverwrite
        ? `Successfully synchronized dataset! Processed ${parsedPrograms.length} program(s) and ${parsedTracers.length} tracer record(s).`
        : `Successfully uploaded dataset! Processed ${parsedPrograms.length} program(s) and ${parsedTracers.length} tracer record(s).`,
      stats: {
        programsProcessed: parsedPrograms.length,
        tracerRecordsProcessed: parsedTracers.length,
      },
    });
  } catch (error) {
    console.error(
      "Critical ExcelJS Higher Education Processing Failure Exception:",
      error,
    );

    await UploadLog.create({
      module: "HIGHER_EDUCATION",
      fileName,
      fileSize,
      uploadedBy,
      status: "FAILED",
      errorMessage: error.message,
      isOverwrite: forceOverwrite,
    }).catch(() => {});

    const isWorkbookError = /zip|workbook|excel|xlsx/i.test(error.message);
    return res.status(isWorkbookError ? 400 : 500).json({
      success: false,
      error: isWorkbookError
        ? "The uploaded file is not a valid Excel workbook."
        : "Higher education upload processing failed.",
    });
  }
};

/**
 * GET /api/v1/higher-education/logs
 */
exports.getUploadLogs = async (req, res) => {
  try {
    const logs = await UploadLog.find({ module: "HIGHER_EDUCATION" })
      .sort({ uploadedAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Failed to fetch higher education upload logs:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve upload history logs.",
    });
  }
};

/**
 * DELETE /api/v1/higher-education/logs
 * Permanently clears higher education upload history logs.
 */
exports.clearUploadLogs = async (req, res) => {
  try {
    const result = await UploadLog.deleteMany({ module: "HIGHER_EDUCATION" });

    return res.status(200).json({
      success: true,
      message: "Higher education upload history cleared.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Failed to clear higher education upload logs:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to clear upload history logs.",
    });
  }
};