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
 * @desc Upload & process Excel File into both Program & Tracer collections
 * @route POST /api/v1/higher-education/upload
 */
exports.uploadHigherEducationExcel = async (req, res) => {
  const fileName = req.file?.originalname || "Unknown_File.xlsx";
  const fileSize = formatFileSize(req.file?.size);
  const uploadedBy =
    req.body.uploadedBy ||
    (req.user
      ? `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim()
      : null) ||
    req.user?.name ||
    "System Admin";
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

    const worksheet = workbook.getWorksheet(1); // Get the first worksheet
    if (!worksheet || worksheet.rowCount <= 1) {
      return res.status(400).json({
        success: false,
        error:
          "The uploaded workbook contains no active worksheets or valid data rows.",
      });
    }

    // 3. Extract Headers and Parse Data Rows
    const headers = [];
    const headerRow = worksheet.getRow(1);

    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const val = extractCellValue(cell);
      headers[colNumber] = val ? String(val).trim() : "";
    });

    const parsedPrograms = [];
    const parsedTracers = [];

    worksheet.eachRow((row, rowNumber) => {
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
          hasExplicitAccreditation: Boolean(
            rawAccreditation && rawAccreditation !== "Not Accredited",
          ),
        });
      }

      // Process Yearly Employability & Graduate Tracer Data
      const yearVal = rowData["Year"] ? parseInt(rowData["Year"], 10) : null;
      if (yearVal && !isNaN(yearVal)) {
        let rawEmployability = rowData["Employability_Rate"];
        let employabilityRate = 0;

        if (typeof rawEmployability === "number") {
          employabilityRate =
            rawEmployability > 1 ? rawEmployability / 100 : rawEmployability;
        } else if (typeof rawEmployability === "string") {
          const cleaned = parseFloat(rawEmployability.replace("%", "").trim());
          if (!isNaN(cleaned)) {
            employabilityRate = cleaned > 1 ? cleaned / 100 : cleaned;
          }
        }

        parsedTracers.push({
          year: yearVal,
          graduateCount: rowData["Graduate_Count"]
            ? parseInt(rowData["Graduate_Count"], 10) || 0
            : 0,
          employabilityRate,
        });
      }
    });

    // 4. Validate parsed records count
    if (parsedPrograms.length === 0 && parsedTracers.length === 0) {
      return res.status(422).json({
        success: false,
        error:
          "Could not find any valid higher education or tracer records in the spreadsheet.",
      });
    }

    // 5. SCAN DATABASE FOR DUPLICATE RECORDS
    const programConditions = parsedPrograms.map((p) => ({
      campusBranch: p.campusBranch,
      programName: p.programName,
    }));

    let existingPrograms = [];
    if (programConditions.length > 0) {
      existingPrograms = await HigherEducation.find({ $or: programConditions });
    }

    // IF MATCHES FOUND AND ADMIN HAS NOT CONFIRMED OVERWRITE -> RETURN 409
    if (existingPrograms.length > 0 && !forceOverwrite) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: `Found ${existingPrograms.length} existing higher education program(s) in the database matching this Excel file.`,
      });
    }

    // 6. SAVE OR OVERWRITE RECORDS IN MONGODB
    const saveProgramPromises = parsedPrograms.map(async (programData) => {
      let programToSave = { ...programData };

      if (forceOverwrite) {
        const existing = existingPrograms.find(
          (ep) =>
            ep.campusBranch === programData.campusBranch &&
            ep.programName === programData.programName,
        );

        if (existing) {
          if (!programData.hasExplicitAccreditation) {
            programToSave.accreditationStatus = existing.accreditationStatus;
            programToSave.isAccredited = existing.isAccredited;
            programToSave.reviewStatus = existing.reviewStatus;
          }
          if (!programToSave.startDate)
            programToSave.startDate = existing.startDate;
          if (!programToSave.endDate) programToSave.endDate = existing.endDate;
          if (
            programToSave.yearInitialOperation === "N/A" ||
            !programToSave.yearInitialOperation
          ) {
            programToSave.yearInitialOperation = existing.yearInitialOperation;
          }
        }
      }

      delete programToSave.hasExplicitAccreditation;

      return HigherEducation.findOneAndUpdate(
        {
          campusBranch: programData.campusBranch,
          programName: programData.programName,
        },
        { $set: programToSave },
        { upsert: true, new: true, runValidators: true },
      );
    });

    const saveTracerPromises = parsedTracers.map(async (tracerData) => {
      return HigherEducationTracer.findOneAndUpdate(
        { year: tracerData.year },
        { $set: tracerData },
        { upsert: true, new: true, runValidators: true },
      );
    });

    await Promise.all([...saveProgramPromises, ...saveTracerPromises]);

    const totalRecordsProcessed = parsedPrograms.length + parsedTracers.length;

    // 7. RECORD ONLY SUCCESSFUL UPLOAD OR OVERWRITE LOG
    await UploadLog.create({
      module: "HIGHER_EDUCATION",
      fileName,
      fileSize,
      uploadedBy,
      status: "SUCCESS",
      recordsProcessed: totalRecordsProcessed,
      isOverwrite: forceOverwrite,
    });

    return res.status(201).json({
      success: true,
      message: forceOverwrite
        ? `Successfully overwritten higher education dataset! Processed ${parsedPrograms.length} program(s) and ${parsedTracers.length} tracer record(s).`
        : `Successfully ingested higher education dataset! Processed ${parsedPrograms.length} program(s) and ${parsedTracers.length} tracer record(s).`,
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

    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/v1/higher-education/logs
 * Retrieves the spreadsheet upload history logs
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
