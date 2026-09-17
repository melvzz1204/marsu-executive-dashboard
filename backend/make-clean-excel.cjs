const ExcelJS = require("exceljs");
const {
  helpers: { cleanText, normalizeCollegeName, normalizeProgramName, parseAuthorsBatch },
} = require("./src/controllers/research/researchUploadController");

const SRC = "C:\\Users\\Admin\\Downloads\\Planning_Research_Master.xlsx";
const DEST = process.env.CLEAN_DEST ||
  "C:\\Users\\Admin\\Downloads\\Planning_Research_Master_CLEAN.xlsx";

const HEADERS = [
  "College_Unit",
  "Academic_Program",
  "Research_Title",
  "Lead Researcher / Authors",
  "Year",
  "Completion_Status",
  "Presentation_Stage",
  "Presentation Forum / Venue",
  "Publication_Status",
  "Title of Journal",
  "Intelectual_Property_Type_Acquired",
];

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SRC);
  const ws = wb.worksheets[0];

  const extract = (cell) => {
    if (!cell || cell.value === null || cell.value === undefined) return "";
    const v = cell.value;
    if (typeof v === "object") {
      if (v.result !== undefined && v.result !== null) return String(v.result).trim();
      if (v.richText) return v.richText.map((t) => t.text).join("").trim();
      if (v instanceof Date) return v.toISOString().slice(0, 10);
    }
    return String(v).trim();
  };
  // Header positions resolved by name (same matching spirit as the uploader).
  const norm = (h) => String(h || "").toUpperCase().replace(/[\s_]+/g, "");
  const pos = {};
  ws.getRow(1).eachCell((c, n) => { pos[norm(extract(c))] = n; });
  const col = (names) => {
    for (const name of names) if (pos[name]) return pos[name];
    return 0;
  };
  const C = {
    college: col(["COLLEGEUNIT", "COLLEGE"]),
    program: col(["ACADEMICPROGRAM", "PROGRAM"]),
    title: col(["RESEARCHTITLE", "TITLE"]),
    authors: col(["LEADRESEARCHER/AUTHORS", "AUTHORS", "LEADRESEARCHER"]),
    year: col(["YEAR"]),
    completion: col(["COMPLETIONSTATUS", "COMPLETION"]),
    presStage: col(["PRESENTATIONSTAGE", "STAGE"]),
    forum: col(["PRESENTATIONFORUM", "FORUM"]),
    pub: col(["PUBLICATIONSTATUS", "PUBLICATION"]),
    journal: col(["TITLEOFJOURNAL", "JOURNAL"]),
    ip: col(["INTELECTUALPROPERTYTYPEACQUIRED", "INTELLECTUALPROPERTYTYPEACQUIRED", "PROPERTY"]),
  };

  const stats = {
    written: 0, skipped: 0, carriedCollege: 0, carriedProgram: 0,
    typoCollege: 0, programUnified: 0, wsFixed: 0, journalTypo: 0,
  };
  const rows = [];
  let lastCollege = "", lastProgram = "";

  // First pass: collect titled rows so author parsing can use the
  // sheet-wide surname corpus (resolves "Nobleza, Randy" -> one author).
  const pending = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const g = (n) => (n ? extract(row.getCell(n)) : "");
    const title = cleanText(g(C.title));
    if (!title) { stats.skipped++; continue; }
    pending.push({ g, title, rawAuthors: g(C.authors) });
  }
  const parsedAuthorsList = parseAuthorsBatch(pending.map((p) => p.rawAuthors));

  pending.forEach(({ g, title, rawAuthors }, idx) => {
    const rawCollege = g(C.college);
    const college = normalizeCollegeName(rawCollege);
    if (college) lastCollege = college;
    else if (lastCollege) stats.carriedCollege++;
    if (/technoloogy|collegee/i.test(rawCollege)) stats.typoCollege++;

    const rawProgram = g(C.program);
    const program = normalizeProgramName(rawProgram);
    if (program) lastProgram = program;
    else if (lastProgram) stats.carriedProgram++;
    if (rawProgram && program !== rawProgram.trim()) stats.programUnified++;

    const authors = parsedAuthorsList[idx].join("; ");
    if (/\s{2,}|\.([A-Z])/.test(rawAuthors)) stats.wsFixed++;

    let journal = cleanText(g(C.journal));
    if (/agiculture/i.test(journal) && !/agriculture/i.test(journal)) {
      journal = journal.replace(/agiculture/gi, (m) =>
        m[0] === m[0].toUpperCase() ? "Agriculture" : "agriculture",
      );
      stats.journalTypo++;
    }

    rows.push([
      lastCollege,
      lastProgram,
      title,
      authors,
      g(C.year).trim(),
      cleanText(g(C.completion)),
      cleanText(g(C.presStage)),
      cleanText(g(C.forum)),
      cleanText(g(C.pub)),
      journal,
      cleanText(g(C.ip)),
    ]);
    stats.written++;
  });

  const out = new ExcelJS.Workbook();
  const sheet = out.addWorksheet("Research_Master_Log");
  sheet.addRow(HEADERS);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle", wrapText: true };
  rows.forEach((vals) => sheet.addRow(vals));
  sheet.columns = [
    { width: 32 }, { width: 16 }, { width: 60 }, { width: 55 }, { width: 8 },
    { width: 14 }, { width: 16 }, { width: 30 }, { width: 14 }, { width: 45 }, { width: 24 },
  ];
  await out.xlsx.writeFile(DEST);

  console.log(`WROTE: ${DEST}`);
  console.log(JSON.stringify(stats, null, 1));
})().catch((e) => { console.error("ERROR:", e); process.exit(1); });
