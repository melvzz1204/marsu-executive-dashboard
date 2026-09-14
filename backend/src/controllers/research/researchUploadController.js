const ExcelJS = require("exceljs");
const ResearchPaper = require("../../models/research/researchAnalyticsModel");
const ResearchUploadLog = require("../../models/research/uploadLogModel");

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
 * Helper to parse a 4-digit start year from text
 */
function parseYearFromText(text) {
  if (!text) return null;
  const match = String(text).match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

/**
 * Helper to format raw byte count into human-readable string
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Helper to map full Excel College/Unit strings into Schema collegeCode
 */
function mapCollegeToCode(collegeStr) {
  if (!collegeStr) return "CICS";
  const s = String(collegeStr).toUpperCase();

  if (s.includes("INFORMATION") || s.includes("COMPUTING") || s.includes("CICS")) return "CICS";
  if (s.includes("BUSINESS") || s.includes("ACCOUNTANCY") || s.includes("CBMA")) return "CBMA";
  if (s.includes("EDUCATION") || s.includes("CED")) return "CED";
  if (s.includes("INDUSTRIAL") || s.includes("TECHNOLO") || s.includes("CIT")) return "CIT";
  if (s.includes("AGRICULTURE") || s.includes("CA")) return "CA";
  if (s.includes("ENGINEERING") || s.includes("CE")) return "CE";
  if (
    s.includes("ENVIRONMENTAL") ||
    s.includes("GOVERNANCE") ||
    s.includes("ARTS") ||
    s.includes("ALLIED") ||
    s.includes("FISHERIES") ||
    s.includes("CRIMINAL") ||
    s.includes("GRADUATE")
  ) {
    return "CAS";
  }

  return "CICS";
}

/**
 * POST /api/v1/research/upload
 * Process and ingest research papers from Excel spreadsheet
 */
exports.uploadResearchExcel = async (req, res) => {
  const fileName = req.file?.originalname || "Unknown_File.xlsx";
  const fileSize = formatFileSize(req.file?.size);
  const uploadedBy = req.user?.name || req.user?.id || "Authenticated Admin";
  const forceOverwrite =
    req.body.overwrite === "true" || req.body.overwrite === true;

  try {
    // 1. Defend against missing file payload
    if (!req.file) {
      await ResearchUploadLog.create({
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

    // 2. Load workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      await ResearchUploadLog.create({
        fileName,
        fileSize,
        uploadedBy,
        status: "FAILED",
        errorMessage: "Workbook contains no active worksheets.",
      });

      return res.status(400).json({
        success: false,
        error: "The uploaded workbook contains no active worksheets.",
      });
    }

    const parsedPapers = [];

    // 3. Iterate sheets and rows
    workbook.worksheets.forEach((worksheet) => {
      if (worksheet.rowCount <= 1) return;

      const headerRow = worksheet.getRow(1);
      const colIndexes = {};

      headerRow.eachCell((cell, colNumber) => {
        const headerText = extractCellValue(cell)
          .toUpperCase()
          .replace(/[\s_]+/g, "");

        if (headerText.includes("COLLEGE") || headerText.includes("UNIT"))
          colIndexes.collegeUnit = colNumber;
        if (headerText.includes("PROGRAM") || headerText.includes("ACADEMIC"))
          colIndexes.academicProgram = colNumber;
        if (headerText.includes("TITLE") && !headerText.includes("JOURNAL"))
          colIndexes.title = colNumber;
        if (headerText.includes("AUTHOR") || headerText.includes("RESEARCHER"))
          colIndexes.authors = colNumber;
        if (headerText.includes("YEAR")) colIndexes.year = colNumber;

        // Lifecycle & IP Headers
        if (headerText.includes("COMPLETION")) colIndexes.completionStatus = colNumber;
        if (headerText.includes("PUBLICATION")) colIndexes.publicationStatus = colNumber;
        if (headerText.includes("JOURNAL") || headerText.includes("CONF"))
          colIndexes.titleOfJournal = colNumber;
        if (
          headerText.includes("INTELLECTUAL") ||
          headerText.includes("INTELECTUAL") ||
          headerText.includes("PROPERTY") ||
          headerText.includes("IP")
        )
          colIndexes.intellectualPropertyTypeAcquired = colNumber;
      });

      // Template structural positional fallbacks for Research_Master_Log
      if (!colIndexes.collegeUnit) colIndexes.collegeUnit = 1;
      if (!colIndexes.academicProgram) colIndexes.academicProgram = 2;
      if (!colIndexes.title) colIndexes.title = 3;
      if (!colIndexes.authors) colIndexes.authors = 4;
      if (!colIndexes.year) colIndexes.year = 5;
      if (!colIndexes.completionStatus) colIndexes.completionStatus = 6;
      if (!colIndexes.publicationStatus) colIndexes.publicationStatus = 7;
      if (!colIndexes.titleOfJournal) colIndexes.titleOfJournal = 8;
      if (!colIndexes.intellectualPropertyTypeAcquired)
        colIndexes.intellectualPropertyTypeAcquired = 9;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        try {
          const title = extractCellValue(row.getCell(colIndexes.title));
          if (!title) return;

          // Parse authors paired as [LastName, FirstName MI]
          const rawAuthors = extractCellValue(row.getCell(colIndexes.authors));
          let authors = ["Unknown Author"];

          if (rawAuthors) {
            const parts = rawAuthors.split(",").map((a) => a.trim()).filter(Boolean);
            const pairedAuthors = [];

            for (let i = 0; i < parts.length; i += 2) {
              const lastName = parts[i];
              const firstName = parts[i + 1] || "";

              if (lastName && firstName) {
                pairedAuthors.push(`${firstName} ${lastName}`);
              } else if (lastName) {
                pairedAuthors.push(lastName);
              }
            }

            if (pairedAuthors.length > 0) {
              authors = pairedAuthors;
            }
          }

          const rawYear = extractCellValue(row.getCell(colIndexes.year));
          const year = parseYearFromText(rawYear) || new Date().getFullYear();

          const collegeUnit = extractCellValue(row.getCell(colIndexes.collegeUnit)) || "N/A";
          
          // Fallback: If academic_program is empty or N/A, copy collegeUnit
          const rawAcademicProgram = colIndexes.academicProgram
            ? extractCellValue(row.getCell(colIndexes.academicProgram))
            : "";
          const academicProgram = (rawAcademicProgram && rawAcademicProgram !== "N/A") 
            ? rawAcademicProgram 
            : collegeUnit;

          const collegeCode = mapCollegeToCode(collegeUnit);

          const completionStatus = colIndexes.completionStatus
            ? extractCellValue(row.getCell(colIndexes.completionStatus)) || "N/A"
            : "N/A";

          const publicationStatus = colIndexes.publicationStatus
            ? extractCellValue(row.getCell(colIndexes.publicationStatus)) || "N/A"
            : "N/A";

          const titleOfJournal = colIndexes.titleOfJournal
            ? extractCellValue(row.getCell(colIndexes.titleOfJournal)) || "N/A"
            : "N/A";

          const intellectualPropertyTypeAcquired = colIndexes.intellectualPropertyTypeAcquired
            ? extractCellValue(row.getCell(colIndexes.intellectualPropertyTypeAcquired)) || "None"
            : "None";

          parsedPapers.push({
            title,
            authors,
            year,
            collegeUnit,
            collegeCode,
            academicProgram,
            completionStatus,
            publicationStatus,
            titleOfJournal,
            intellectualPropertyTypeAcquired,
          });
        } catch (rowErr) {
          console.warn(
            `Skipping row ${rowNumber} in sheet '${worksheet.name}':`,
            rowErr.message
          );
        }
      });
    });

    if (parsedPapers.length === 0) {
      await ResearchUploadLog.create({
        fileName,
        fileSize,
        uploadedBy,
        status: "FAILED",
        errorMessage:
          "No valid research paper records found in the spreadsheet.",
      });

      return res.status(422).json({
        success: false,
        error: "No valid research paper records found in the spreadsheet.",
      });
    }

    // 4. SCAN DATABASE FOR DUPLICATE PAPER TITLES
    const titlesToIngest = parsedPapers.map((p) => p.title);
    const existingPapers = await ResearchPaper.find({
      title: { $in: titlesToIngest },
    });

    // IF DUPLICATES FOUND AND ADMIN HAS NOT CONFIRMED OVERWRITE -> RETURN 409
    if (existingPapers.length > 0 && !forceOverwrite) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: `Found ${existingPapers.length} existing paper title(s) in the database matching this Excel file.`,
      });
    }

    // 5. SAVE OR OVERWRITE PAPERS IN MONGODB
    const savePromises = parsedPapers.map(async (paperData) => {
      if (forceOverwrite) {
        return ResearchPaper.findOneAndUpdate(
          { title: paperData.title },
          paperData,
          { upsert: true, new: true, runValidators: true }
        );
      } else {
        return ResearchPaper.create(paperData);
      }
    });

    await Promise.all(savePromises);

    // 6. RECORD SUCCESS LOG
    await ResearchUploadLog.create({
      fileName,
      fileSize,
      uploadedBy,
      status: "SUCCESS",
      recordsProcessed: parsedPapers.length,
      isOverwrite: forceOverwrite,
    });

    return res.status(201).json({
      success: true,
      message: forceOverwrite
        ? `Successfully overwritten research papers dataset! Processed ${parsedPapers.length} records.`
        : `Successfully ingested research papers dataset! Processed ${parsedPapers.length} records.`,
      recordsIngested: parsedPapers.length,
    });
  } catch (error) {
    console.error("Critical Research Excel Processing Exception:", error);

    await ResearchUploadLog.create({
      fileName,
      fileSize,
      uploadedBy,
      status: "FAILED",
      errorMessage: error.message,
    }).catch((logErr) => console.error("Failed to write failure log:", logErr));

    const isWorkbookError = /zip|workbook|excel|xlsx/i.test(error.message);
    return res.status(isWorkbookError ? 400 : 500).json({
      success: false,
      error: isWorkbookError
        ? "The uploaded file is not a valid Excel workbook."
        : "Research upload processing failed.",
    });
  }
};

/**
 * GET /api/v1/research/logs
 * Retrieves the research spreadsheet upload history logs
 */
exports.getResearchUploadLogs = async (req, res) => {
  try {
    const logs = await ResearchUploadLog.find()
      .sort({ uploadedAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Failed to fetch research upload logs:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve upload history logs.",
    });
  }
};