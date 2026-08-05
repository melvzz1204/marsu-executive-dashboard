const ExcelJS = require("exceljs");
const ResearchPaper = require("../../models/research/researchAnalyticsModel");
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
 * Normalize paper scope values
 */
function normalizeScope(scopeStr) {
  if (!scopeStr) return "Regional Scope";
  const clean = scopeStr.toUpperCase();
  if (clean.includes("INTERN")) return "International Scope";
  if (clean.includes("NAT")) return "National Scope";
  return "Regional Scope";
}

/**
 * Normalize paper category values
 */
function normalizeCategory(catStr) {
  if (!catStr) return "Other";
  const clean = catStr.toUpperCase();
  if (clean.includes("PERCEPTION") || clean.includes("SOCIAL")) return "Social Perception";
  if (clean.includes("QUALITATIVE")) return "Qualitative Study";
  if (clean.includes("IMPACT")) return "Impact Analysis";
  if (clean.includes("MODEL") || clean.includes("DEVELOPMENT")) return "Model Development";
  return "Other";
}

/**
 * POST /api/v1/research/upload
 * Process and ingest research papers from Excel spreadsheet
 */
exports.uploadResearchExcel = async (req, res) => {
  const fileName = req.file?.originalname || "Unknown_File.xlsx";
  const fileSize = formatFileSize(req.file?.size);
  const uploadedBy = req.body.uploadedBy || req.user?.name || "System Admin";
  const forceOverwrite = req.body.overwrite === "true" || req.body.overwrite === true;

  try {
    // 1. Defend against missing file payload
    if (!req.file) {
      await UploadLog.create({
        module: "RESEARCH",
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
      await UploadLog.create({
        module: "RESEARCH",
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
        const headerText = extractCellValue(cell).toUpperCase().replace(/[\s_]+/g, "");

        if (headerText.includes("TITLE")) colIndexes.title = colNumber;
        if (headerText.includes("AUTHOR")) colIndexes.authors = colNumber;
        if (headerText.includes("YEAR")) colIndexes.year = colNumber;
        if (headerText.includes("SCOPE")) colIndexes.scope = colNumber;
        if (headerText.includes("CONF") || headerText.includes("JOURNAL")) colIndexes.conferenceOrJournal = colNumber;
        if (headerText.includes("CAT")) colIndexes.category = colNumber;
        if (headerText.includes("VENUE") && !headerText.includes("FORUM")) colIndexes.venue = colNumber;
        if (headerText.includes("DURATION") || headerText.includes("DAYS")) colIndexes.durationDays = colNumber;
        if (headerText.includes("STATUS") && !headerText.includes("PROPOSAL") && !headerText.includes("COMPLETION") && !headerText.includes("PUBLIC")) colIndexes.status = colNumber;
        if (headerText.includes("COLLEGE") || headerText.includes("DEPT")) colIndexes.collegeCode = colNumber;
        if (headerText.includes("FUND") || headerText.includes("GRANT")) colIndexes.fundingGrantMillions = colNumber;

        // Headers from Excel Template
        if (headerText.includes("PROPOSALSTATUS") || headerText.includes("PROPOSAL")) colIndexes.proposalStatus = colNumber;
        if (headerText.includes("COMPLETIONSTATUS") || headerText.includes("COMPLETION")) colIndexes.completionStatus = colNumber;
        if (headerText.includes("PRESENTATIONSTAGE") || headerText.includes("STAGE")) colIndexes.presentationStage = colNumber;
        if (headerText.includes("PRESENTATIONFORUM") || headerText.includes("FORUM")) colIndexes.presentationForumVenue = colNumber;
        if (headerText.includes("PUBLICATIONSTATUS") || headerText.includes("PUBLICATION")) colIndexes.publicationStatus = colNumber;
        if (headerText.includes("INTELLECTUAL") || headerText.includes("PROPERTY") || headerText.includes("IP")) colIndexes.intellectualPropertyTypeAcquired = colNumber;
      });

      // Header index fallbacks if headers are missing
      if (!colIndexes.title) colIndexes.title = 1;
      if (!colIndexes.authors) colIndexes.authors = 2;
      if (!colIndexes.year) colIndexes.year = 3;
      if (!colIndexes.scope) colIndexes.scope = 4;
      if (!colIndexes.conferenceOrJournal) colIndexes.conferenceOrJournal = 5;
      if (!colIndexes.category) colIndexes.category = 6;
      if (!colIndexes.venue) colIndexes.venue = 7;
      if (!colIndexes.durationDays) colIndexes.durationDays = 8;
      if (!colIndexes.status) colIndexes.status = 9;
      if (!colIndexes.collegeCode) colIndexes.collegeCode = 10;
      if (!colIndexes.fundingGrantMillions) colIndexes.fundingGrantMillions = 11;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        try {
          const title = extractCellValue(row.getCell(colIndexes.title));
          if (!title) return;

          const rawAuthors = extractCellValue(row.getCell(colIndexes.authors));
          const authors = rawAuthors
            ? rawAuthors.split(",").map((a) => a.trim()).filter(Boolean)
            : ["Unknown Author"];

          const rawYear = extractCellValue(row.getCell(colIndexes.year));
          const year = parseYearFromText(rawYear) || new Date().getFullYear();

          const rawScope = extractCellValue(row.getCell(colIndexes.scope));
          const scope = normalizeScope(rawScope);

          const conferenceOrJournal = extractCellValue(row.getCell(colIndexes.conferenceOrJournal)) || "N/A";

          const rawCategory = extractCellValue(row.getCell(colIndexes.category));
          const category = normalizeCategory(rawCategory);

          const venue = extractCellValue(row.getCell(colIndexes.venue)) || "N/A";

          const rawDuration = extractCellValue(row.getCell(colIndexes.durationDays));
          const durationDays = parseInt(rawDuration, 10) || 0;

          const rawStatus = extractCellValue(row.getCell(colIndexes.status)).toUpperCase();
          const validStatuses = ["COMPLETED", "ONGOING", "PUBLISHED", "UNDER_REVIEW"];
          const status = validStatuses.includes(rawStatus) ? rawStatus : "COMPLETED";

          const collegeCode = extractCellValue(row.getCell(colIndexes.collegeCode)).toUpperCase() || "CICS";

          const rawFunding = extractCellValue(row.getCell(colIndexes.fundingGrantMillions));
          const fundingGrantMillions = parseFloat(rawFunding) || 0.0;

          // Extract lifecycle & IP fields
          const proposalStatus = colIndexes.proposalStatus ? extractCellValue(row.getCell(colIndexes.proposalStatus)) || "N/A" : "N/A";
          const completionStatus = colIndexes.completionStatus ? extractCellValue(row.getCell(colIndexes.completionStatus)) || "N/A" : "N/A";
          const presentationStage = colIndexes.presentationStage ? extractCellValue(row.getCell(colIndexes.presentationStage)) || "N/A" : "N/A";
          const presentationForumVenue = colIndexes.presentationForumVenue ? extractCellValue(row.getCell(colIndexes.presentationForumVenue)) || "N/A" : "N/A";
          const publicationStatus = colIndexes.publicationStatus ? extractCellValue(row.getCell(colIndexes.publicationStatus)) || "N/A" : "N/A";
          const intellectualPropertyTypeAcquired = colIndexes.intellectualPropertyTypeAcquired ? extractCellValue(row.getCell(colIndexes.intellectualPropertyTypeAcquired)) || "None" : "None";

          // Calculate metric flags dynamically
          const isCompleted = completionStatus.toLowerCase() === "completed" || status === "COMPLETED";
          const isPresenting = (presentationStage && presentationStage !== "N/A") || (presentationForumVenue && presentationForumVenue !== "N/A");
          const isPublished = publicationStatus.toLowerCase() === "published" || status === "PUBLISHED";
          const hasIntellectualProperty = Boolean(
            intellectualPropertyTypeAcquired &&
            !["none", "n/a", ""].includes(intellectualPropertyTypeAcquired.toLowerCase())
          );

          parsedPapers.push({
            title,
            authors,
            year,
            scope,
            conferenceOrJournal,
            category,
            venue,
            durationDays,
            status,
            collegeCode,
            fundingGrantMillions,
            proposalStatus,
            completionStatus,
            presentationStage,
            presentationForumVenue,
            publicationStatus,
            intellectualPropertyTypeAcquired,
            isCompleted,
            isPresenting,
            isPublished,
            hasIntellectualProperty,
          });
        } catch (rowErr) {
          console.warn(`Skipping row ${rowNumber} in sheet '${worksheet.name}':`, rowErr.message);
        }
      });
    });

    if (parsedPapers.length === 0) {
      await UploadLog.create({
        module: "RESEARCH",
        fileName,
        fileSize,
        uploadedBy,
        status: "FAILED",
        errorMessage: "No valid research paper records found in the spreadsheet.",
      });

      return res.status(422).json({
        success: false,
        error: "No valid research paper records found in the spreadsheet.",
      });
    }

    // 4. SCAN DATABASE FOR DUPLICATE PAPER TITLES
    const titlesToIngest = parsedPapers.map((p) => p.title);
    const existingPapers = await ResearchPaper.find({ title: { $in: titlesToIngest } });

    // ⚠️ IF DUPLICATES FOUND AND ADMIN HAS NOT CONFIRMED OVERWRITE -> RETURN 409
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
          { upsert: true, new: true }
        );
      } else {
        return ResearchPaper.create(paperData);
      }
    });

    await Promise.all(savePromises);

    // 6. RECORD SUCCESS LOG
    await UploadLog.create({
      module: "RESEARCH",
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

    await UploadLog.create({
      module: "RESEARCH",
      fileName,
      fileSize,
      uploadedBy,
      status: "FAILED",
      errorMessage: error.message,
    }).catch((logErr) => console.error("Failed to write failure log:", logErr));

    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/v1/research/logs
 * Retrieves the research spreadsheet upload history logs
 */
exports.getResearchUploadLogs = async (req, res) => {
  try {
    const logs = await UploadLog.find({ module: "RESEARCH" })
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