const ExcelJS = require("exceljs");
const HigherEducation = require("../../models/higherEducation/higherEducationModel");
const HigherEducationTracer = require("../../models/higherEducation/higherEducationTracerModel");
const UploadLog = require("../../models/uploadLogModel"); // Adjust path if your models folder structure differs

/**
 * Helper to normalize date strings, Date objects, or Excel serial numbers
 */
const parseExcelDate = (val) => {
  if (!val || val === "NaT" || val === "N/A") return null;

  // Handle standard JS Date object (ExcelJS automatically converts date cells to Date objects)
  if (val instanceof Date && !isNaN(val)) return val;

  // Handle Excel serial date numbers
  if (typeof val === "number") {
    return new Date(Math.round((val - 25569) * 86400 * 1000));
  }

  // Handle date strings
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Helper to safely extract raw primitive values from ExcelJS Cell Objects
 */
const getCellValue = (cell) => {
  if (!cell || cell.value === null || cell.value === undefined) return "";

  // If cell value is an object (e.g. Formula, Hyperlink, or RichText)
  if (typeof cell.value === "object") {
    if (cell.value.result !== undefined) return cell.value.result;
    if (cell.value.text !== undefined) return cell.value.text;
    if (cell.value instanceof Date) return cell.value;
  }

  return cell.value;
};

/**
 * Helper to calculate accreditation and review status fields
 */
const computeStatusFields = (accreditationStatus, endDate) => {
  const NON_ACCREDITED_STATUSES = [
    "Not Accredited",
    "Candidate Status",
    "In Progress",
    "For Phase-out",
    "N/A",
    "",
  ];

  const cleanStatus = accreditationStatus ? String(accreditationStatus).trim() : "";
  const isAccredited = Boolean(cleanStatus && !NON_ACCREDITED_STATUSES.includes(cleanStatus));

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
};

/**
 * @desc Upload & process Excel File into both Program & Tracer collections
 * @route POST /api/v1/higher-education/upload
 */
exports.uploadHigherEducationExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an Excel file.",
      });
    }

    const fileSizeFormatted = req.file.size
      ? `${(req.file.size / 1024).toFixed(1)} KB`
      : "0 KB";

    // Read Excel Workbook from Memory Buffer using ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1); // Get the first worksheet
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: "Uploaded Excel file contains no valid worksheets.",
      });
    }

    // Extract Headers from Row 1
    const headers = [];
    const headerRow = worksheet.getRow(1);

    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const val = getCellValue(cell);
      headers[colNumber] = val ? String(val).trim() : "";
    });

    // Parse Data Rows into JSON Array
    const rawData = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip Header Row

      const rowData = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const headerName = headers[colNumber];
        if (headerName) {
          rowData[headerName] = getCellValue(cell);
        }
      });
      rawData.push(rowData);
    });

    if (rawData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Uploaded Excel file is empty.",
      });
    }

    let programCount = 0;
    let tracerCount = 0;
    const errors = [];

    for (let index = 0; index < rawData.length; index++) {
      const row = rawData[index];
      const rowNum = index + 2; // Row offset considering Header Row

      // -------------------------------------------------------------
      // 1. Process Program Registry Data
      // -------------------------------------------------------------
      const campusBranch = row["Campus_Branch"] ? String(row["Campus_Branch"]).trim() : "";
      const programName = row["Program_Name"] ? String(row["Program_Name"]).trim() : "";

      if (campusBranch && programName) {
        const accreditationStatus = row["Accreditation_Status"]
          ? String(row["Accreditation_Status"]).trim()
          : "Not Accredited";
        const startDate = parseExcelDate(row["Start_Date"]);
        const endDate = parseExcelDate(row["End_Date"]);

        const { isAccredited, reviewStatus } = computeStatusFields(accreditationStatus, endDate);

        const programData = {
          campusBranch,
          programName,
          yearInitialOperation: row["Year_Initial_Operation"]
            ? String(row["Year_Initial_Operation"]).trim()
            : "N/A",
          accreditationStatus,
          startDate,
          endDate,
          isAccredited,
          reviewStatus,
        };

        await HigherEducation.findOneAndUpdate(
          { campusBranch, programName },
          { $set: programData },
          { upsert: true, new: true, runValidators: true }
        );
        programCount++;
      }

      // -------------------------------------------------------------
      // 2. Process Yearly Employability & Graduate Tracer Data
      // -------------------------------------------------------------
      const yearVal = row["Year"] ? parseInt(row["Year"], 10) : null;
      if (yearVal && !isNaN(yearVal)) {
        let rawEmployability = row["Employability_Rate"];
        let employabilityRate = 0;

        if (typeof rawEmployability === "number") {
          employabilityRate = rawEmployability > 1 ? rawEmployability / 100 : rawEmployability;
        } else if (typeof rawEmployability === "string") {
          const cleaned = parseFloat(rawEmployability.replace("%", "").trim());
          if (!isNaN(cleaned)) {
            employabilityRate = cleaned > 1 ? cleaned / 100 : cleaned;
          }
        }

        const tracerData = {
          year: yearVal,
          graduateCount: row["Graduate_Count"] ? parseInt(row["Graduate_Count"], 10) || 0 : 0,
          employabilityRate,
        };

        await HigherEducationTracer.findOneAndUpdate(
          { year: yearVal },
          { $set: tracerData },
          { upsert: true, new: true, runValidators: true }
        );
        tracerCount++;
      }
    }

    const totalRecords = programCount + tracerCount;
    const logStatus = errors.length > 0 ? "PARTIAL_SUCCESS" : "SUCCESS";

    // Write Upload Log to Centralized Schema
    await UploadLog.create({
      module: "HIGHER_EDUCATION",
      fileName: req.file.originalname,
      fileSize: fileSizeFormatted,
      uploadedBy: req.user
        ? `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim()
        : "System Admin",
      status: logStatus,
      recordsProcessed: totalRecords,
      errorMessage: errors.length > 0 ? errors.join(" | ") : null,
    });

    return res.status(200).json({
      success: true,
      message: `Excel processed: ${programCount} programs and ${tracerCount} tracer records saved/updated.`,
      stats: {
        programsProcessed: programCount,
        tracerRecordsProcessed: tracerCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    // Attempt logging catastrophic failure if file metadata exists
    if (req.file) {
      await UploadLog.create({
        module: "HIGHER_EDUCATION",
        fileName: req.file.originalname,
        fileSize: req.file.size ? `${(req.file.size / 1024).toFixed(1)} KB` : "0 KB",
        uploadedBy: req.user
          ? `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim()
          : "System Admin",
        status: "FAILED",
        recordsProcessed: 0,
        errorMessage: error.message,
      }).catch(() => {}); // Prevent secondary uncaught errors during crash logging
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the Excel file.",
      error: error.message,
    });
  }
};

/**
 * @desc Retrieve spreadsheet upload history logs for Higher Education
 * @route GET /api/v1/higher-education/logs
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
    console.error("Failed to fetch Higher Education upload logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve upload history logs.",
      error: error.message,
    });
  }
};