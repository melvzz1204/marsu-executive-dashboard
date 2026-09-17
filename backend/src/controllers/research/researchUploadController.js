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
 * General text cleaning for Excel cells: trims, collapses stray whitespace
 * (double spaces, line breaks), and repairs a missing space after a period
 * ("S.Dr." -> "S. Dr.") so jammed names split correctly downstream.
 */
function cleanText(value) {
  return String(value || "")
    .replace(/\.([A-Z])/g, ". $1")
    .replace(/\s+/g, " ")
    .trim();
}

// Known typos in College_Unit cells, fixed before save.
const COLLEGE_TYPO_FIXES = [
  [/Technoloogy/gi, "Technology"],
  [/Collegee/gi, "College"],
];

/**
 * Normalize an Academic_Program cell: clean whitespace and unify code
 * variants like "MAEd- EM" and "MAEd-EM" so they group as one program.
 */
function normalizeProgramName(name) {
  return cleanText(name)
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a college/unit cell: clean whitespace, fix known typos.
 * Multi-college cells are kept whole (faithful to the source row).
 */
function normalizeCollegeName(name) {
  let out = cleanText(name);
  for (const [pattern, fix] of COLLEGE_TYPO_FIXES) {
    out = out.replace(pattern, fix);
  }
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Name suffixes / post-nominals that must never stand alone as an author
 * entry. Handles Filipino surname-first cells like "Dela Cruz, Jr., Juan"
 * which must stay ONE author, not three ("Dela Cruz" / "Jr." / "Juan").
 */
const AUTHOR_SUFFIXES = new Set([
  "jr",
  "sr",
  "ii",
  "iii",
  "iv",
  // NOTE: single-letter "v" is deliberately NOT a suffix — in Filipino
  // names it is overwhelmingly a middle initial ("Michael V. Capiña"),
  // and treating it as one keeps it from being eaten ("Capiña, Michael").
  "vi",
  "vii",
  "viii",
  "phd",
  "edd",
  "md",
  "dds",
  "dmd",
  "esq",
  "cpa",
  "rn",
  "lpt",
]);

function isAuthorSuffix(part) {
  return AUTHOR_SUFFIXES.has(
    String(part || "")
      .toLowerCase()
      .replace(/[.]/g, "")
      .trim(),
  );
}

/** Single capital/initial fragment: "A", "A.", "S.D.". */
function isInitialFragment(part) {
  return /^[A-Z](?:\.[A-Z]){0,3}\.?$/.test(
    String(part || "").replace(/\s/g, ""),
  );
}

/** Bare surname candidate: single token, or a particle-led phrase
 * ("Dela Cruz", "De Chavez") — never a suffix, initial, or given phrase. */
function isSurnameFragment(part) {
  const t = String(part || "").trim();
  if (!t || isAuthorSuffix(t) || isInitialFragment(t)) return false;
  if (!/\s/.test(t)) return true;
  const first = t.split(/\s+/)[0].toLowerCase().replace(/\./g, "");
  return SURNAME_PARTICLES.has(first);
}

/** Given-name candidate: multi-token ("Arriane Grace R.") or an initial. */
function isGivenFragment(part) {
  const t = String(part || "").trim();
  if (!t) return false;
  return /\s/.test(t) || isInitialFragment(t);
}

/** Last token is a suffix: "Lemente Jr.", "Reyes, Jr.". */
function endsWithSuffix(part) {
  const toks = String(part || "")
    .trim()
    .split(/\s+/);
  return toks.length > 0 && isAuthorSuffix(toks[toks.length - 1]);
}

/**
 * Re-attach bare suffix fragments to the name they belong to.
 * A suffix always rejoins the previous name; it also absorbs the next
 * fragment ONLY when nothing follows it:
 *   ["Dela Cruz", "Jr.", "Juan"] -> ["Dela Cruz, Jr., Juan"]
 *   ["Par", "III", "Sajul", ...] -> ["Par, III"] + rest (Sajul kept separate)
 *   ["Udanga", "Cuevas"]         -> untouched
 */
function mergeSuffixFragments(parts) {
  const merged = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    const next = parts[i + 1];
    if (next !== undefined && isAuthorSuffix(next)) {
      const after = parts[i + 2];
      if (after !== undefined && i + 2 === parts.length - 1) {
        merged.push(`${part}, ${next}, ${after}`);
        i += 3;
      } else {
        merged.push(`${part}, ${next}`);
        i += 2;
      }
    } else if (merged.length > 0 && isAuthorSuffix(part)) {
      // Leading/trailing bare suffix: "Reyes, Jr.".
      merged[merged.length - 1] = `${merged[merged.length - 1]}, ${part}`;
      i += 1;
    } else {
      merged.push(part);
      i += 1;
    }
  }
  return merged;
}

// Academic/professional titles that start a new author when jammed against
// the previous name without any delimiter ("Alvaro S.Dr. Leodegario" or
// "Aristeo, P.Dr. Leodegario").
const AUTHOR_TITLES = "(?:Dr|Prof|Atty|Engr|Hon|Mr|Mrs|Ms)";

/**
 * Pair surname-first fragments back into full names:
 * ["Sajul", "Glaidys Ghail P."] -> ["Sajul, Glaidys Ghail P."].
 * A bare single+single pair only merges once the cell has already shown
 * the surname-first pattern (anchor), so given-name-first lists like
 * ["Udanga", "Cuevas"] still split into two authors.
 */
function pairSurnameGiven(parts, knownSurnames = new Set()) {
  // Two-fragment "Surname, Given" cells are ambiguous alone — resolve them
  // against surnames seen across the whole sheet: pair only when the first
  // is a known surname and the second is not ("Nobleza, Randy", never when
  // both could be surnames or neither is known).
  if (
    parts.length === 2 &&
    isSurnameFragment(parts[0]) &&
    isSurnameFragment(parts[1]) &&
    knownSurnames.has(parts[0].trim().toUpperCase()) &&
    !knownSurnames.has(parts[1].trim().toUpperCase())
  ) {
    return [`${parts[0]}, ${parts[1]}`];
  }
  // Pure single-token even lists of 4+: surname-first pairs
  // ("Nolos, Ronnel, Bugarin, Jeany"). Two-fragment cells stay split —
  // "Udanga, Cuevas" is genuinely ambiguous.
  if (
    parts.length >= 4 &&
    parts.length % 2 === 0 &&
    parts.every(
      (p) =>
        !/\s/.test(p.trim()) &&
        !isAuthorSuffix(p) &&
        !isInitialFragment(p),
    )
  ) {
    const paired = [];
    for (let i = 0; i < parts.length; i += 2) {
      paired.push(`${parts[i]}, ${parts[i + 1]}`);
    }
    return paired;
  }
  // Anchor: the cell demonstrably uses surname-first order somewhere
  // (a surname followed by a multi-token given name or an initial).
  const anchored = parts.some(
    (p, idx) => isSurnameFragment(p) && isGivenFragment(parts[idx + 1]),
  );
  const out = [];
  let i = 0;
  while (i < parts.length) {
    const cur = parts[i];
    const nxt = parts[i + 1];
    const afterNext = parts[i + 2];
    const curTokens = cur.trim().split(/\s+/).length;
    if (
      nxt !== undefined &&
      endsWithSuffix(cur) &&
      curTokens <= 3 &&
      isGivenFragment(nxt) &&
      (afterNext === undefined || isSurnameFragment(afterNext))
    ) {
      // "Lemente Jr." + "Renato F." (followed by another surname or end).
      out.push(`${cur}, ${nxt}`);
      i += 2;
      continue;
    }
    if (
      nxt !== undefined &&
      isSurnameFragment(cur) &&
      !isGivenFragment(nxt)
    ) {
      // Bare "Surname, Given" run: absorb a following middle initial too
      // ("Mandia, Eangeline, B." -> one author), otherwise pair only when
      // the cell's format is anchored ("Nolos" + "Ronnel").
      if (afterNext !== undefined && isInitialFragment(afterNext)) {
        out.push(`${cur}, ${nxt}, ${afterNext}`);
        i += 3;
        continue;
      }
      if (anchored) {
        out.push(`${cur}, ${nxt}`);
        i += 2;
        continue;
      }
    }
    if (
      nxt !== undefined &&
      isSurnameFragment(cur) &&
      isGivenFragment(nxt)
    ) {
      // Standard "Surname, Given ..." pair.
      out.push(`${cur}, ${nxt}`);
      i += 2;
      continue;
    }
    out.push(cur);
    i += 1;
  }
  // A lone initial is never an author — fold it into the previous entry
  // ("Dela Cruz, Danica Nina" + "M." -> one author). This kills an entire
  // class of ghost entries the same way suffix-merging killed lone "Jr.".
  const folded = [];
  for (const entry of out) {
    if (folded.length > 0 && isInitialFragment(entry)) {
      folded[folded.length - 1] = `${folded[folded.length - 1]}, ${entry}`;
    } else {
      folded.push(entry);
    }
  }
  return folded;
}

// Titles stripped from author names alongside suffixes (the registry keeps
// surname / firstname / middle-initial only).
const TITLE_WORDS = new Set(["dr", "prof", "atty", "engr", "hon", "mr", "mrs", "ms"]);

/** True for suffix/title tokens ("Jr.", "III", "Dr.") — never name content. */
function isDroppableToken(token) {
  const key = String(token || "")
    .toLowerCase()
    .replace(/\./g, "");
  return AUTHOR_SUFFIXES.has(key) || TITLE_WORDS.has(key);
}

// Surname particles kept with the family name ("Dela Cruz", "De La Vega").
const SURNAME_PARTICLES = new Set([
  "dela",
  "de",
  "del",
  "la",
  "las",
  "los",
  "san",
  "santa",
  "santo",
  "van",
  "von",
  "der",
  "den",
  "di",
  "da",
  "dos",
  "das",
  "do",
  "st",
]);

/** Canonical single-person name without commas: "Juan Dela Cruz" -> parts. */
function splitGivenFirstName(text) {
  const toks = String(text || "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !isDroppableToken(t));
  if (toks.length === 0) return null;
  if (toks.length === 1) return { surname: toks[0], given: "" };
  if (isInitialFragment(toks[toks.length - 1])) {
    // Trailing initial is a middle initial, not a surname
    // ("Nikka Mae J." -> surname "Nikka Mae", given "J.").
    const mi = toks.pop();
    return { surname: toks.join(" "), given: mi };
  }
  const surnameParts = [toks.pop()];
  while (
    toks.length > 0 &&
    SURNAME_PARTICLES.has(
      toks[toks.length - 1].toLowerCase().replace(/\./g, ""),
    )
  ) {
    surnameParts.unshift(toks.pop());
  }
  return { surname: surnameParts.join(" "), given: toks.join(" ") };
}

/**
 * Canonical author format: "Surname, Firstname, M."
 * - Strips titles (Dr./Prof./...) and suffixes (Jr./Sr./III/...).
 * - Reorders given-first names ("Merryrose Palma" -> "Palma, Merryrose").
 * - Splits a trailing initial off as the middle initial.
 * - Keeps single tokens untouched ("Santos" stays "Santos").
 */
function normalizeAuthorName(raw) {
  let text = cleanText(raw);
  if (!text) return "";
  text = text.replace(/^(?:dr|prof|atty|engr|hon|mr|mrs|ms)\.\s+/i, "");
  text = text.replace(/^(?:dr|prof|atty|engr|hon|mr|mrs|ms)\.\s+/i, "");
  if (!text) return "";

  let surname = "";
  let given = "";
  if (text.includes(",")) {
    const kept = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((seg) => !isDroppableToken(seg.replace(/\s/g, "")));
    if (kept.length === 0) return "";
    if (kept.length === 1) {
      const single = splitGivenFirstName(kept[0]);
      if (!single) return "";
      surname = single.surname;
      given = single.given;
    } else {
      surname = kept[0]
        .split(/\s+/)
        .filter((t) => !isDroppableToken(t))
        .join(" ");
      given = kept
        .slice(1)
        .join(" ")
        .split(/\s+/)
        .filter((t) => !isDroppableToken(t))
        .join(" ");
      if (!surname) return given;
      if (!given) return surname;
    }
  } else {
    const single = splitGivenFirstName(text);
    if (!single) return "";
    surname = single.surname;
    given = single.given;
  }
  if (!given) return surname;

  const gToks = given.split(/\s+/).filter(Boolean);
  let mi = "";
  if (gToks.length > 1 && isInitialFragment(gToks[gToks.length - 1])) {
    mi = `${gToks.pop().replace(/\.*$/, "")}.`;
  }
  const firstname = gToks.join(" ");
  if (!firstname) return mi ? `${surname}, ${mi}` : surname;
  return mi ? `${surname}, ${firstname}, ${mi}` : `${surname}, ${firstname}`;
}

/**
 * Split a raw author cell into full names. Strong delimiters (; | / & and)
 * separate authors and their parts are kept whole; commas are only a
 * fallback, with title-splitting, suffix-aware merging and surname/given
 * pairing so fragments like "Jr." never become standalone authors.
 * Every name is normalized to "Surname, Firstname, M." format.
 * `knownSurnames` (upper-cased surnames seen across the sheet) resolves
 * ambiguous two-fragment cells ("Nobleza, Randy" -> one author).
 */
function parseAuthors(rawAuthors, knownSurnames = new Set()) {
  if (!rawAuthors) return ["Unknown Author"];
  const cleaned = cleanText(rawAuthors);
  if (!cleaned) return ["Unknown Author"];
  if (/[;|/&]|\band\b/i.test(cleaned)) {
    const parts = mergeSuffixFragments(
      cleaned
        .split(/[;|/&]|\band\b/i)
        .map((a) => a.trim())
        .filter(Boolean),
    );
    const names = parts.map(normalizeAuthorName).filter(Boolean);
    return names.length ? names : ["Unknown Author"];
  }
  let parts = cleaned
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  // Split authors jammed without any delimiter: "Alvaro S. Dr. Leodegario".
  parts = parts
    .flatMap((p) =>
      p.split(new RegExp(`(?<=\\S)\\s+(?=${AUTHOR_TITLES}\\.)`)),
    )
    .map((a) => a.trim())
    .filter(Boolean);
  parts = pairSurnameGiven(mergeSuffixFragments(parts), knownSurnames);
  const names = parts.map(normalizeAuthorName).filter(Boolean);
  return names.length ? names : ["Unknown Author"];
}

/**
 * Batch author parsing with a shared surname corpus: first pass collects
 * surnames from confident parses, second pass resolves ambiguous
 * two-fragment cells against them. Returns one name array per input cell.
 */
function parseAuthorsBatch(rawCells) {
  const firstPass = rawCells.map((raw) => parseAuthors(raw));
  const knownSurnames = new Set();
  for (const names of firstPass) {
    for (const name of names) {
      const comma = name.indexOf(",");
      if (comma > 0) {
        knownSurnames.add(name.slice(0, comma).trim().toUpperCase());
      }
    }
  }
  return rawCells.map((raw) => parseAuthors(raw, knownSurnames));
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
  if (clean.includes("PERCEPTION") || clean.includes("SOCIAL"))
    return "Social Perception";
  if (clean.includes("QUALITATIVE")) return "Qualitative Study";
  if (clean.includes("IMPACT")) return "Impact Analysis";
  if (clean.includes("MODEL") || clean.includes("DEVELOPMENT"))
    return "Model Development";
  return "Other";
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

      // Carry-forward state for merged College_Unit / Academic_Program
      // ranges (reset per sheet).
      let lastCollegeUnit = "";
      let lastAcademicProgram = "";

      const headerRow = worksheet.getRow(1);
      const colIndexes = {};

      headerRow.eachCell((cell, colNumber) => {
        const headerText = extractCellValue(cell)
          .toUpperCase()
          .replace(/[\s_]+/g, "");

        // NOTE: "Title of Journal" contains "TITLE" — exclude it from the generic
        // title match so Research_Title keeps priority.
        if (headerText.includes("TITLE") && !headerText.includes("JOURNAL"))
          colIndexes.title = colNumber;
        // "Lead Researcher / Authors" normalizes to "LEADRESEARCHER/AUTHORS"
        if (headerText.includes("AUTHOR") || headerText.includes("LEADRESEARCH"))
          colIndexes.authors = colNumber;
        if (headerText.includes("YEAR")) colIndexes.year = colNumber;
        if (headerText.includes("SCOPE")) colIndexes.scope = colNumber;
        if (
          headerText.includes("CONF") ||
          headerText.includes("JOURNAL") ||
          headerText.includes("TITLEOFJOURNAL")
        )
          colIndexes.conferenceOrJournal = colNumber;
        if (headerText.includes("CAT")) colIndexes.category = colNumber;
        if (headerText.includes("VENUE") && !headerText.includes("FORUM"))
          colIndexes.venue = colNumber;
        if (headerText.includes("DURATION") || headerText.includes("DAYS"))
          colIndexes.durationDays = colNumber;
        if (
          headerText.includes("STATUS") &&
          !headerText.includes("PROPOSAL") &&
          !headerText.includes("COMPLETION") &&
          !headerText.includes("PUBLIC")
        )
          colIndexes.status = colNumber;
        // "College_Unit" normalizes to "COLLEGEUNIT"
        if (
          headerText.includes("COLLEGE") ||
          headerText.includes("DEPT") ||
          headerText.includes("UNIT")
        )
          colIndexes.collegeCode = colNumber;
        // "Academic_Program" normalizes to "ACADEMICPROGRAM"
        if (headerText.includes("ACADEMICPROGRAM") || headerText.includes("PROGRAM"))
          colIndexes.academicProgram = colNumber;
        if (headerText.includes("FUND") || headerText.includes("GRANT"))
          colIndexes.fundingGrantMillions = colNumber;
        // "Research_Title" normalizes to "RESEARCHTITLE" — ensure it wins over generic TITLE
        if (headerText.includes("RESEARCHTITLE"))
          colIndexes.title = colNumber;

        // Headers from Excel Template
        if (
          headerText.includes("PROPOSALSTATUS") ||
          headerText.includes("PROPOSAL")
        )
          colIndexes.proposalStatus = colNumber;
        if (
          headerText.includes("COMPLETIONSTATUS") ||
          headerText.includes("COMPLETION")
        )
          colIndexes.completionStatus = colNumber;
        if (
          headerText.includes("PRESENTATIONSTAGE") ||
          headerText.includes("STAGE")
        )
          colIndexes.presentationStage = colNumber;
        if (
          headerText.includes("PRESENTATIONFORUM") ||
          headerText.includes("FORUM")
        )
          colIndexes.presentationForumVenue = colNumber;
        if (
          headerText.includes("PUBLICATIONSTATUS") ||
          headerText.includes("PUBLICATION")
        )
          colIndexes.publicationStatus = colNumber;
        if (
          headerText.includes("INTELLECTUAL") ||
          // tolerate common misspelling "Intelectual_Property_Type_Acquired" (single L)
          headerText.includes("INTELECTUAL") ||
          headerText.includes("PROPERTY") ||
          headerText.includes("IP")
        )
          colIndexes.intellectualPropertyTypeAcquired = colNumber;
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
      if (!colIndexes.fundingGrantMillions)
        colIndexes.fundingGrantMillions = 11;

      // Corpus pass: surnames seen across the sheet resolve ambiguous
      // two-fragment cells ("Nobleza, Randy" -> one author).
      const sheetAuthorCells = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        if (
          !cleanText(extractCellValue(row.getCell(colIndexes.title)))
        )
          return;
        sheetAuthorCells.push(
          extractCellValue(row.getCell(colIndexes.authors)),
        );
      });
      const sheetKnownSurnames = new Set();
      for (const names of sheetAuthorCells.map((raw) => parseAuthors(raw))) {
        for (const name of names) {
          const comma = name.indexOf(",");
          if (comma > 0) {
            sheetKnownSurnames.add(
              name.slice(0, comma).trim().toUpperCase(),
            );
          }
        }
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        try {
          const title = cleanText(
            extractCellValue(row.getCell(colIndexes.title)),
          );
          if (!title) return;

          const rawAuthors = extractCellValue(row.getCell(colIndexes.authors));
          // Suffix-aware split so surname-first names like
          // "Dela Cruz, Jr., Juan" stay one full name (never a lone "Jr.").
          const authors = parseAuthors(rawAuthors, sheetKnownSurnames);

          const rawYear = extractCellValue(row.getCell(colIndexes.year));
          const year = parseYearFromText(rawYear) || new Date().getFullYear();

          const rawScope = extractCellValue(row.getCell(colIndexes.scope));
          const scope = normalizeScope(rawScope);

          const conferenceOrJournal =
            cleanText(
              extractCellValue(row.getCell(colIndexes.conferenceOrJournal)),
            ) || "N/A";

          const rawCategory = extractCellValue(
            row.getCell(colIndexes.category),
          );
          const category = normalizeCategory(rawCategory);

          const venue =
            extractCellValue(row.getCell(colIndexes.venue)) || "N/A";

          const rawDuration = extractCellValue(
            row.getCell(colIndexes.durationDays),
          );
          const durationDays = parseInt(rawDuration, 10) || 0;

          const rawStatus = extractCellValue(
            row.getCell(colIndexes.status),
          ).toUpperCase();
          const validStatuses = [
            "COMPLETED",
            "ONGOING",
            "PUBLISHED",
            "UNDER_REVIEW",
          ];
          const status = validStatuses.includes(rawStatus)
            ? rawStatus
            : "COMPLETED";

          // Merged College_Unit / Academic_Program cells only store their
          // value in the top row of the merged range — carry the last-seen
          // value forward so grouped rows keep their unit instead of
          // falling back to a wrong default.
          const rawCollegeCell = normalizeCollegeName(
            extractCellValue(row.getCell(colIndexes.collegeCode)),
          );
          if (rawCollegeCell) lastCollegeUnit = rawCollegeCell;
          const collegeCode = (lastCollegeUnit || "CICS").toUpperCase();

          // Academic_Program column — cleaned value kept as-is, "N/A" when blank
          const rawProgramCell = colIndexes.academicProgram
            ? normalizeProgramName(
                extractCellValue(row.getCell(colIndexes.academicProgram)),
              )
            : "";
          if (rawProgramCell) lastAcademicProgram = rawProgramCell;
          const academicProgram = lastAcademicProgram || "N/A";

          const rawFunding = extractCellValue(
            row.getCell(colIndexes.fundingGrantMillions),
          );
          const fundingGrantMillions = parseFloat(rawFunding) || 0.0;

          // Extract lifecycle & IP fields
          const proposalStatus = colIndexes.proposalStatus
            ? extractCellValue(row.getCell(colIndexes.proposalStatus)) || "N/A"
            : "N/A";
          const completionStatus = colIndexes.completionStatus
            ? extractCellValue(row.getCell(colIndexes.completionStatus)) ||
              "N/A"
            : "N/A";
          const presentationStage = colIndexes.presentationStage
            ? extractCellValue(row.getCell(colIndexes.presentationStage)) ||
              "N/A"
            : "N/A";
          const presentationForumVenue = colIndexes.presentationForumVenue
            ? extractCellValue(
                row.getCell(colIndexes.presentationForumVenue),
              ) || "N/A"
            : "N/A";
          const publicationStatus = colIndexes.publicationStatus
            ? extractCellValue(row.getCell(colIndexes.publicationStatus)) ||
              "N/A"
            : "N/A";
          const intellectualPropertyTypeAcquired =
            colIndexes.intellectualPropertyTypeAcquired
              ? extractCellValue(
                  row.getCell(colIndexes.intellectualPropertyTypeAcquired),
                ) || "None"
              : "None";

          // Calculate metric flags dynamically (case-insensitive for free-text Excel values)
          const isCompleted =
            completionStatus.toLowerCase() === "completed" ||
            status === "COMPLETED";
          const isPresenting =
            (presentationStage && presentationStage !== "N/A") ||
            (presentationForumVenue && presentationForumVenue !== "N/A");
          const isPublished =
            publicationStatus.toLowerCase() === "published" ||
            status === "PUBLISHED";
          const hasIntellectualProperty = Boolean(
            intellectualPropertyTypeAcquired &&
              !["none", "n/a", ""].includes(
                intellectualPropertyTypeAcquired.toLowerCase(),
              ),
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
            academicProgram,
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
          console.warn(
            `Skipping row ${rowNumber} in sheet '${worksheet.name}':`,
            rowErr.message,
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
          { upsert: true, new: true },
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

/**
 * GET /api/v1/research/template
 * Streams a downloadable .xlsx template with the exact 9 expected headers + sample rows
 */
exports.downloadResearchTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Research Dataset");

    const headers = [
      "College_Unit",
      "Academic_Program",
      "Research_Title",
      "Lead Researcher / Authors",
      "Year",
      "Completion_Status",
      "Publication_Status",
      "Title of Journal",
      "Intelectual_Property_Type_Acquired",
    ];

    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: "middle", wrapText: true };

    sheet.addRow([
      "CICS",
      "BSIT",
      "Level of Satisfaction of Residents on Government Service Delivery",
      "Dela Cruz, J.; Santos, M.",
      2023,
      "Completed",
      "Published",
      "Journal of Public Governance",
      "Copyrighted",
    ]);
    sheet.addRow([
      "CED",
      "BEEd",
      "Tracer Study of Midwifery Graduates 2006-2022",
      "Reyes, A.",
      2024,
      "Ongoing",
      "Unpublished",
      "N/A",
      "None",
    ]);

    sheet.columns.forEach((col) => {
      col.width = 28;
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Research_Upload_Template.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Failed to generate research template:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate template file.",
    });
  }
};

// Exported for reuse (clean-file generation, tests) — not HTTP routes.
exports.helpers = {
  cleanText,
  normalizeCollegeName,
  normalizeProgramName,
  normalizeAuthorName,
  parseAuthors,
  parseAuthorsBatch,
};
