const ExcelJS = require("exceljs");
const BudgetUtilization = require("../../models/finance/budgetUtilizationModel");
const UploadLog = require("../../models/uploadLogModel");

/**
 * Safely extracts string or numeric value from ExcelJS cell
 */
function extractCellValue(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return 0;
  if (typeof cell.value === "object") {
    if (cell.value.result !== undefined && cell.value.result !== null) {
      return parseFloat(cell.value.result) || 0;
    }
    if (cell.value.richText) {
      const text = cell.value.richText.map((t) => t.text).join("").trim();
      return parseFloat(text) || 0;
    }
  }
  if (typeof cell.value === "string") {
    const cleaned = cell.value.replace(/[^0-9.-]+/g, "");
    return parseFloat(cleaned) || 0;
  }
  return Number(cell.value) || 0;
}

/**
 * Helper to format byte sizes for logs
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * @desc Get Budget Utilization Rate analytics payload
 * @route GET /api/v1/budget/stats
 */
exports.getBudgetStats = async (req, res) => {
  try {
    const fiscalYear = req.query.fiscalYear
      ? parseInt(req.query.fiscalYear, 10)
      : new Date().getFullYear();

    let budget = await BudgetUtilization.findOne({ fiscalYear });

    // Fallback: Fetch latest available record if specific fiscalYear isn't found
    if (!budget) {
      budget = await BudgetUtilization.findOne().sort({ fiscalYear: -1 });
    }

    if (!budget) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No budget utilization records found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        fiscalYear: budget.fiscalYear,
        summary: {
          totalAllotment: budget.totalAllotment,
          totalObligated: budget.totalObligated,
          burEfficiencyPercentage:
            Math.round(budget.burEfficiency * 10000) / 100,
          targetPacePercentage:
            Math.round(budget.targetPace * 10000) / 100,
        },
        breakdown: [
          {
            category: "Personnel Services (PS)",
            approvedAllocation: budget.psApproved,
            actualObligations: budget.psObligated,
          },
          {
            category: "MOOE",
            approvedAllocation: budget.mooeApproved,
            actualObligations: budget.mooeObligated,
          },
          {
            category: "Capital Outlay (CO)",
            approvedAllocation: budget.coApproved,
            actualObligations: budget.coObligated,
          },
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching budget utilization statistics",
      error: error.message,
    });
  }
};

/**
 * @desc Upload & process Budget Utilization Excel File
 * @route POST /api/v1/budget/upload
 */
exports.uploadBudgetExcel = async (req, res) => {
  const fileName = req.file?.originalname || "Budget_Report.xlsx";
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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload an Excel spreadsheet (.xlsx) file.",
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet || worksheet.rowCount <= 1) {
      return res.status(400).json({
        success: false,
        error: "The uploaded workbook contains no active data rows.",
      });
    }

    const headers = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber] = cell.value ? String(cell.value).trim() : "";
    });

    // Parse row values (Assuming standard row layout or vertical table)
    let fiscalYear = req.body.fiscalYear
      ? parseInt(req.body.fiscalYear, 10)
      : new Date().getFullYear();
    let psApproved = 0, psObligated = 0;
    let mooeApproved = 0, mooeObligated = 0;
    let coApproved = 0, coObligated = 0;
    let targetPace = 0.90;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const category = String(row.getCell(1).value || "").trim().toUpperCase();
      const approved = extractCellValue(row.getCell(2));
      const obligated = extractCellValue(row.getCell(3));

      if (category.includes("PS") || category.includes("PERSONNEL")) {
        psApproved = approved;
        psObligated = obligated;
      } else if (category.includes("MOOE")) {
        mooeApproved = approved;
        mooeObligated = obligated;
      } else if (category.includes("CO") || category.includes("CAPITAL")) {
        coApproved = approved;
        coObligated = obligated;
      }

      // Check if Fiscal Year is provided in a cell
      const fyCell = row.getCell(4).value;
      if (fyCell && !isNaN(parseInt(fyCell, 10))) {
        fiscalYear = parseInt(fyCell, 10);
      }
    });

    // Check pre-existing duplicate record
    const existingRecord = await BudgetUtilization.findOne({ fiscalYear });

    if (existingRecord && !forceOverwrite) {
      await UploadLog.create({
        module: "SYSTEM",
        fileName,
        fileSize,
        uploadedBy,
        status: "DUPLICATE_BLOCK",
        isOverwrite: false,
        errorMessage: `Upload blocked. Record for FY ${fiscalYear} already exists.`,
      }).catch(() => {});

      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: `Budget utilization data for Fiscal Year ${fiscalYear} already exists.`,
      });
    }

    // Upsert database document
    const updatedBudget = await BudgetUtilization.findOneAndUpdate(
      { fiscalYear },
      {
        $set: {
          fiscalYear,
          psApproved,
          psObligated,
          mooeApproved,
          mooeObligated,
          coApproved,
          coObligated,
          targetPace,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    await UploadLog.create({
      module: "SYSTEM",
      fileName,
      fileSize,
      uploadedBy,
      status: forceOverwrite ? "OVERWRITE" : "SUCCESS",
      recordsProcessed: 1,
      isOverwrite: forceOverwrite,
    });

    return res.status(201).json({
      success: true,
      message: forceOverwrite
        ? `Successfully overwritten budget utilization data for FY ${fiscalYear}.`
        : `Successfully ingested budget utilization data for FY ${fiscalYear}.`,
      data: updatedBudget,
    });
  } catch (error) {
    console.error("Critical Budget Utilization Processing Exception:", error);

    await UploadLog.create({
      module: "SYSTEM",
      fileName,
      fileSize,
      uploadedBy,
      status: "FAILED",
      errorMessage: error.message,
      isOverwrite: forceOverwrite,
    }).catch(() => {});

    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc Fetch budget upload history logs
 * @route GET /api/v1/budget/logs
 */
exports.getBudgetUploadLogs = async (req, res) => {
  try {
    const logs = await UploadLog.find({ module: "SYSTEM" })
      .sort({ uploadedAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch budget upload history logs.",
    });
  }
};