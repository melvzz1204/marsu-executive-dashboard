const ExcelJS = require("exceljs");
const LicensureExam = require("../../models/higherEducation/licensureExamModel");
const UploadLog = require("../../models/uploadLogModel");

/**
 * Safely extracts string content from ExcelJS cell values
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
 * Format file size helper
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * @desc Fetch Licensure Performance Matrix and Analytics Summary
 * @route GET /api/v1/higher-education/licensure/stats
 */
exports.getLicensureStats = async (req, res) => {
  try {
    const { year, category } = req.query;
    const filter = {};

    if (year) filter.year = parseInt(year, 10);
    if (category && category !== "All") filter.category = category;

    const records = await LicensureExam.find(filter).sort({ category: 1, programName: 1 });

    // Aggregate summary per year
    const summaryByYear = await LicensureExam.aggregate([
      { $match: { isNda: false } },
      {
        $group: {
          _id: "$year",
          totalTakers: { $sum: "$takers" },
          totalPassed: { $sum: "$passed" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          year: "$_id",
          totalTakers: 1,
          totalPassed: 1,
          overallPassingRate: {
            $cond: [
              { $gt: ["$totalTakers", 0] },
              { $round: [{ $multiply: [{ $divide: ["$totalPassed", "$totalTakers"] }, 100] }, 2] },
              0,
            ],
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: records.length,
      data: {
        records,
        summaryByYear,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving licensure examination performance data.",
      error: error.message,
    });
  }
};

/**
 * @desc Upload & Parse Multi-Sheet Licensure Performance Excel File
 * @route POST /api/v1/higher-education/licensure/upload
 */
exports.uploadLicensureExcel = async (req, res) => {
  const fileName = req.file?.originalname || "Licensure_Performance.xlsx";
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

    const parsedRecords = [];

    // Parse every worksheet (e.g. "Licensure Performance 2026", "Licensure Performance 2025")
    workbook.eachSheet((worksheet) => {
      // Extract year from sheet name or header column
      const sheetName = worksheet.name;
      const yearMatch = sheetName.match(/\d{4}/);
      const yearFromSheet = yearMatch ? parseInt(yearMatch[0], 10) : null;

      if (!worksheet || worksheet.rowCount <= 1) return;

      const headers = [];
      worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = extractCellValue(cell);
      });

      let currentCategory = "";

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip Header

        const rawCat = extractCellValue(row.getCell(1));
        const programName = extractCellValue(row.getCell(2));
        const rawTakers = extractCellValue(row.getCell(3));
        const rawPassed = extractCellValue(row.getCell(4));
        const rawPassingRate = extractCellValue(row.getCell(5));

        // Forward fill empty categories
        if (rawCat && !rawCat.startsWith("*") && rawCat.toUpperCase() !== "TOTAL") {
          currentCategory = rawCat;
        }

        // Skip non-data rows (Summary TOTAL row, footnotes)
        if (
          !programName ||
          programName.toUpperCase() === "TOTAL" ||
          rawCat.startsWith("*")
        ) {
          return;
        }

        // Detect pending results / NDA
        const isNda =
          String(rawTakers).toUpperCase() === "NDA" ||
          String(rawPassed).toUpperCase() === "NDA";

        const takers = isNda ? 0 : parseInt(rawTakers, 10) || 0;
        const passed = isNda ? 0 : parseInt(rawPassed, 10) || 0;

        let passingRate = 0;
        if (!isNda) {
          if (typeof rawPassingRate === "number") {
            passingRate = rawPassingRate > 1 ? rawPassingRate / 100 : rawPassingRate;
          } else {
            const cleanedRate = parseFloat(String(rawPassingRate).replace("%", "").trim());
            passingRate = isNaN(cleanedRate)
              ? takers > 0
                ? passed / takers
                : 0
              : cleanedRate > 1
              ? cleanedRate / 100
              : cleanedRate;
          }
        }

        const examYear = yearFromSheet || new Date().getFullYear();

        parsedRecords.push({
          year: examYear,
          category: currentCategory || "General",
          programName,
          takers,
          passed,
          passingRate: Math.round(passingRate * 10000) / 10000,
          isNda,
        });
      });
    });

    if (parsedRecords.length === 0) {
      return res.status(422).json({
        success: false,
        error: "No valid licensure performance records found in spreadsheet.",
      });
    }

    // Duplicate pre-flight check
    const recordConditions = parsedRecords.map((r) => ({
      year: r.year,
      programName: r.programName,
    }));

    const existingRecords = await LicensureExam.find({ $or: recordConditions });

    if (existingRecords.length > 0 && !forceOverwrite) {
      await UploadLog.create({
        module: "HIGHER_EDUCATION",
        fileName,
        fileSize,
        uploadedBy,
        status: "DUPLICATE_BLOCK",
        isOverwrite: false,
        errorMessage: `Upload blocked. Found ${existingRecords.length} duplicate licensure records.`,
      }).catch(() => {});

      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: `Found ${existingRecords.length} existing licensure records matching this file. Overwrite confirmation required.`,
      });
    }

    // Save or Overwrite DB Entries
    const savePromises = parsedRecords.map((item) =>
      LicensureExam.findOneAndUpdate(
        { year: item.year, programName: item.programName },
        { $set: item },
        { upsert: true, new: true, runValidators: true }
      )
    );

    await Promise.all(savePromises);

    // Write Upload Audit Log
    await UploadLog.create({
      module: "HIGHER_EDUCATION",
      fileName,
      fileSize,
      uploadedBy,
      status: forceOverwrite ? "OVERWRITE" : "SUCCESS",
      recordsProcessed: parsedRecords.length,
      isOverwrite: forceOverwrite,
    });

    return res.status(201).json({
      success: true,
      message: forceOverwrite
        ? `Successfully overwritten ${parsedRecords.length} licensure performance records!`
        : `Successfully ingested ${parsedRecords.length} licensure performance records!`,
      count: parsedRecords.length,
    });
  } catch (error) {
    console.error("Critical Licensure Processing Exception:", error);

    await UploadLog.create({
      module: "HIGHER_EDUCATION",
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