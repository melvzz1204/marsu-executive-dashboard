const ExcelJS = require("exceljs");
const HigherEducation = require("../../models/higherEducation/higherEducationModel");
const HigherEducationTracer = require("../../models/higherEducation/higherEducationTracerModel");
const UploadLog = require("../../models/uploadLogModel");
const {
  ALL_PROGRAMS_LABEL,
  ALL_CAMPUSES_LABEL,
} = require("../../services/higherEducation/tracerAggregation");

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

// Canonical field names mapped to the header spellings we accept across the
// different higher-education workbooks (registry files and the per-program
// employability tracer files). Headers are matched case/space/underscore
// insensitively after normalization.
const HEADER_ALIASES = {
  programName: ["programname", "program"],
  year: ["year"],
  graduateCount: [
    "totalgraduates",
    "graduatecount",
    "graduates",
    "totalgraduate",
    "noofgraduates",
  ],
  employedCount: [
    "totalemployed",
    "noofgraduateemployed",
    "totalgraduateemployed",
    "employed",
  ],
  employabilityRate: [
    "employmentrate",
    "employabilityrate",
    "employmentpercentage",
    "employabilitypercentage",
    "rate",
  ],
  campusBranch: ["campusbranch", "campus"],
  accreditationStatus: ["accreditationstatus", "accreditation"],
  startDate: ["startdate"],
  endDate: ["enddate"],
  yearInitialOperation: ["yearinitialoperation"],
};

const FIELD_BY_ALIAS = (() => {
  const map = {};
  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    aliases.forEach((alias) => {
      map[alias] = field;
    });
  });
  return map;
})();

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const cleanText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const parseEmployabilityRate = (raw) => {
  if (raw === undefined || raw === null) return 0;

  let numeric;
  if (typeof raw === "number") {
    numeric = raw;
  } else {
    numeric = parseFloat(String(raw).replace("%", "").trim());
  }

  if (isNaN(numeric)) return 0;
  // Accept both decimal ratios (0.85) and percentages (85).
  return numeric > 1 ? numeric / 100 : numeric;
};

/**
 * Parse a higher-education workbook into program-registry rows and tracer
 * rows. Handles both the program registry template and the per-program
 * employability template, including college grouping rows that span the
 * program rows beneath them.
 *
 * Exported for unit testing.
 */
function parseHigherEducationWorkbook(workbook) {
  const parsedPrograms = [];
  const parsedTracers = [];

  workbook.eachSheet((worksheet) => {
    if (!worksheet || worksheet.rowCount <= 1) return;

    const headerKeys = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = normalizeHeader(extractCellValue(cell));
      headerKeys[colNumber] = FIELD_BY_ALIAS[key] || null;
    });

    // Current grouping label (college/department), forward-filled from the
    // group header row down to the program rows beneath it.
    let currentGroup = "";

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      const values = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const field = headerKeys[colNumber];
        if (field && values[field] === undefined) {
          values[field] = extractCellValue(cell);
        }
      });

      const programName = cleanText(values.programName);
      const campusBranch = cleanText(values.campusBranch);
      const hasYear = hasValue(values.year);
      const hasGraduate = hasValue(values.graduateCount);
      const hasEmployed = hasValue(values.employedCount);

      // Group/college header row: a label with no measurement data.
      if (programName && !hasYear && !hasGraduate && !hasEmployed) {
        currentGroup = programName;
        return;
      }

      // Skip summary/total rows (e.g. "Total Employment Rate").
      if (/^(grand\s+)?total\b/i.test(programName)) return;

      if (!programName && !hasYear) return;

      // Program registry rows require both campus and program.
      if (campusBranch && programName) {
        const accreditationStatus =
          cleanText(values.accreditationStatus) || "Not Accredited";
        const endDate = parseExcelDate(values.endDate);
        const { isAccredited, reviewStatus } = computeStatusFields(
          accreditationStatus,
          endDate,
        );

        parsedPrograms.push({
          campusBranch,
          programName,
          yearInitialOperation: cleanText(values.yearInitialOperation) || "N/A",
          accreditationStatus,
          startDate: parseExcelDate(values.startDate),
          endDate,
          isAccredited,
          reviewStatus,
        });
      }

      // Tracer rows: one measurement per year / program / campus.
      if (hasYear) {
        const yearVal = parseInt(values.year, 10);
        if (isNaN(yearVal)) return;

        const employabilityRate = parseEmployabilityRate(
          values.employabilityRate,
        );
        const graduateCount = hasGraduate
          ? parseInt(values.graduateCount, 10) || 0
          : 0;
        const employedCount = hasEmployed
          ? parseInt(values.employedCount, 10) || 0
          : Math.round(graduateCount * employabilityRate);

        parsedTracers.push({
          year: yearVal,
          programName: programName || ALL_PROGRAMS_LABEL,
          campusBranch: campusBranch || ALL_CAMPUSES_LABEL,
          collegeName: currentGroup || null,
          graduateCount,
          employabilityRate,
          employedCount,
        });
      }
    });
  });

  return { parsedPrograms, parsedTracers };
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

    const worksheet = workbook.getWorksheet(1); // Get the first worksheet
    if (!worksheet || worksheet.rowCount <= 1) {
      return res.status(400).json({
        success: false,
        error:
          "The uploaded workbook contains no active worksheets or valid data rows.",
      });
    }

    // 3. Parse program registry and tracer rows from the workbook
    const { parsedPrograms, parsedTracers } =
      parseHigherEducationWorkbook(workbook);

    // Collapse in-file duplicates (keeping the last occurrence) so the unique
    // indexes are never violated during writes.
    const dedupedPrograms = new Map();
    parsedPrograms.forEach((program) => {
      dedupedPrograms.set(
        `${program.campusBranch}::${program.programName}`,
        program,
      );
    });
    const uniquePrograms = [...dedupedPrograms.values()];

    const dedupedTracers = new Map();
    parsedTracers.forEach((tracer) => {
      const key = `${tracer.year}::${tracer.programName}::${tracer.campusBranch}`;
      dedupedTracers.set(key, tracer);
    });
    const uniqueTracers = [...dedupedTracers.values()];

    // 4. Validate parsed records count
    if (uniquePrograms.length === 0 && uniqueTracers.length === 0) {
      return res.status(422).json({
        success: false,
        error:
          "Could not find any valid higher education or tracer records in the spreadsheet.",
      });
    }

    // 5. SCAN DATABASE FOR MATCHING RECORDS
    const tracerKeys = uniqueTracers.map((tracer) => ({
      year: tracer.year,
      programName: tracer.programName,
      campusBranch: tracer.campusBranch,
    }));
    const programKeys = uniquePrograms.map((program) => ({
      campusBranch: program.campusBranch,
      programName: program.programName,
    }));

    const [existingTracers, existingPrograms] = await Promise.all([
      tracerKeys.length
        ? HigherEducationTracer.countDocuments({ $or: tracerKeys })
        : 0,
      programKeys.length
        ? HigherEducation.countDocuments({ $or: programKeys })
        : 0,
    ]);

    const conflictCount = existingTracers + existingPrograms;

    // Matching records exist and overwrite is not confirmed -> block.
    if (conflictCount > 0 && !forceOverwrite) {
      await UploadLog.create({
        module: "HIGHER_EDUCATION",
        fileName,
        fileSize,
        uploadedBy,
        status: "DUPLICATE_BLOCK",
        isOverwrite: false,
        errorMessage: `Upload blocked. Found ${conflictCount} existing matching record(s). Confirmation required to overwrite.`,
      }).catch(() => {});

      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: `Found ${conflictCount} existing higher education record(s) matching this file. Overwrite confirmation required.`,
      });
    }

    // 6. SAVE OR UPDATE RECORDS IN MONGODB
    if (uniquePrograms.length > 0) {
      // The registry file is a full snapshot, so an overwrite replaces it.
      if (forceOverwrite) {
        await HigherEducation.deleteMany({});
      }
      await HigherEducation.insertMany(uniquePrograms);
    }

    if (uniqueTracers.length > 0) {
      // Replace only the years present in this file, preserving other years
      // of tracer data, then upsert each year/program/campus record.
      if (forceOverwrite) {
        const years = [...new Set(uniqueTracers.map((tracer) => tracer.year))];
        await HigherEducationTracer.deleteMany({ year: { $in: years } });
      }
      await HigherEducationTracer.bulkWrite(
        uniqueTracers.map((tracer) => ({
          updateOne: {
            filter: {
              year: tracer.year,
              programName: tracer.programName,
              campusBranch: tracer.campusBranch,
            },
            update: { $set: tracer },
            upsert: true,
          },
        })),
      );
    }

    const totalRecordsProcessed = uniquePrograms.length + uniqueTracers.length;

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
        ? `Successfully synchronized dataset! Processed ${uniquePrograms.length} program(s) and ${uniqueTracers.length} tracer record(s).`
        : `Successfully uploaded dataset! Processed ${uniquePrograms.length} program(s) and ${uniqueTracers.length} tracer record(s).`,
      stats: {
        programsProcessed: uniquePrograms.length,
        tracerRecordsProcessed: uniqueTracers.length,
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
    const logs = await UploadLog.find({
      module: { $in: ["HIGHER_EDUCATION", "HIGHER_EDUCATION_LICENSURE"] },
    })
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
    const result = await UploadLog.deleteMany({
      module: { $in: ["HIGHER_EDUCATION", "HIGHER_EDUCATION_LICENSURE"] },
    });

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

exports.parseHigherEducationWorkbook = parseHigherEducationWorkbook;
