// controllers/reportController.js
const LicensurePerformance = require("../../models/achievements/licensurePerformanceModel");
const GlobalRecognition = require("../../models/achievements/globalRecognitionModel");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// @desc    Export Styled Consolidated Institutional Report to Native Excel (.xlsx)
// @route   GET /api/v1/licensure-performance/export/csv
exports.exportToCSV = async (req, res) => {
  try {
    const { year, collegeId } = req.query;
    let query = {};

    if (year) query.rankingYear = Number(year);
    if (collegeId) query.collegeId = collegeId;

    if (req.user.role === "dean") {
      query.collegeId = req.user.collegeId;
    }

    // 1. Fetch data from both models simultaneously
    const [licensureRecords, recognitionRecords] = await Promise.all([
      LicensurePerformance.find(query).sort({ rankingYear: -1 }),
      GlobalRecognition.find(query).sort({ rankingYear: -1 })
    ]);

    // 2. Initialize ExcelJS Workbook & Sheet Configuration
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Institutional Summary");

    // Explicitly enable visual gridlines
    worksheet.views = [{ showGridLines: true }];

    // Reusable Color Scheme Definitions
    const burgundyHeaderFill = { type: "pattern", pattern: "solid", fgColor: { argb: "660033" } };
    const slateTableFill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
    const thinBorder = {
      top: { style: "thin", color: { argb: "CBD5E1" } },
      bottom: { style: "thin", color: { argb: "CBD5E1" } },
      left: { style: "thin", color: { argb: "CBD5E1" } },
      right: { style: "thin", color: { argb: "CBD5E1" } }
    };

    // Main Report Document Header Banner
    worksheet.addRow([]); // Spacer
    const titleRow = worksheet.addRow(["CONSOLIDATED HIGHER EDUCATION INSTITUTIONAL REPORT"]);
    titleRow.getCell(1).font = { name: "Arial", size: 16, bold: true, color: { argb: "660033" } };

    const metaRow = worksheet.addRow([`Generated On: ${new Date().toLocaleDateString()}`]);
    metaRow.getCell(1).font = { name: "Arial", size: 10, italic: true, color: { argb: "64748B" } };
    worksheet.addRow([]); // Spacer

    // ==========================================
    // SECTION 1: LICENSURE PERFORMANCE MATRIX
    // ==========================================
    const s1Title = worksheet.addRow(["1. LICENSURE PERFORMANCE RECORDS"]);
    s1Title.getCell(1).font = { name: "Arial", size: 12, bold: true, color: { argb: "660033" } };
    worksheet.addRow([]); // Spacer

    const s1Headers = ["Year", "Target (%)", "Actual (%)", "Variance (%)", "Program Name", "Passed", "Total", "Rate (%)"];
    const s1HeaderRow = worksheet.addRow(s1Headers);
    s1HeaderRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
      cell.fill = burgundyHeaderFill;
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = thinBorder;
    });
    s1HeaderRow.height = 24;

    // Populate Licensure Data Rows
    licensureRecords.forEach((rec) => {
      rec.programs.forEach((prog) => {
        const dataRow = worksheet.addRow([
          rec.rankingYear,
          `${rec.summaryKpis.target}%`,
          `${rec.summaryKpis.actual}%`,
          `${rec.summaryKpis.variance}%`,
          prog.programName.toUpperCase(),
          prog.passedCandidates,
          prog.totalCandidates,
          `${prog.percentage}%`
        ]);
        
        dataRow.eachCell((cell, colNumber) => {
          cell.font = { name: "Arial", size: 10 };
          cell.border = thinBorder;
          cell.alignment = { vertical: "middle", horizontal: colNumber === 5 ? "left" : "center" };
        });
        dataRow.height = 20;
      });
    });

    worksheet.addRow([]); // Section Dividers
    worksheet.addRow([]);

    // ==========================================
    // SECTION 2: GLOBAL RECOGNITIONS & MILESTONES
    // ==========================================
    const s2Title = worksheet.addRow(["2. GLOBAL RECOGNITION & ACHIEVEMENTS"]);
    s2Title.getCell(1).font = { name: "Arial", size: 12, bold: true, color: { argb: "660033" } };
    worksheet.addRow([]); // Spacer

    const s2Headers = ["Year", "Ranking Body", "Rating Name", "Overall Status Rank", "Overall Status Subtext", "Metric Label", "Metric Rank", "Metric Context", "Source Reference", "Status"];
    const s2HeaderRow = worksheet.addRow(s2Headers);
    s2HeaderRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "1E293B" } };
      cell.fill = slateTableFill;
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = thinBorder;
    });
    s2HeaderRow.height = 24;

    // Populate Global Recognition Rows
    recognitionRecords.forEach((rec) => {
      const overallRank = rec.overallStatus?.rank || "N/A";
      const overallSubtext = rec.overallStatus?.subText || "N/A";
      const source = rec.sourceRef || "N/A";
      const status = rec.isCertifiedOfficial ? "Certified Official" : "Unofficial";

      const appendMetricsRow = (metric) => {
        const dataRow = worksheet.addRow([
          rec.rankingYear,
          rec.rankingBody,
          rec.ratingName,
          overallRank,
          overallSubtext,
          metric ? metric.label.toUpperCase() : "N/A",
          metric ? metric.rank : "N/A",
          metric ? metric.contextLabel || "N/A" : "N/A",
          source,
          status
        ]);

        dataRow.eachCell((cell) => {
          cell.font = { name: "Arial", size: 10 };
          cell.border = thinBorder;
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
        dataRow.height = 20;
      };

      if (rec.metrics && rec.metrics.length > 0) {
        rec.metrics.forEach((metric) => appendMetricsRow(metric));
      } else {
        appendMetricsRow(null);
      }
    });

    // Automatically optimize column widths dynamically based on longest text strings
    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellVal = cell.value ? cell.value.toString() : "";
        if (cellVal.length > maxLen) {
          maxLen = cellVal.length;
        }
      });
      column.width = maxLen < 12 ? 14 : maxLen + 4;
    });

    // Set Response headers to point to Excel OpenXML schema format streams
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Consolidated_Institutional_Report.xlsx"
    );

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Export Consolidated Institutional Report to Multi-Section Styled PDF
// @route   GET /api/v1/licensure-performance/export/pdf
exports.exportToPDF = async (req, res) => {
  try {
    const { year, collegeId } = req.query;
    let query = {};

    if (year) query.rankingYear = Number(year);
    if (collegeId) query.collegeId = collegeId;

    if (req.user.role === "dean") {
      query.collegeId = req.user.collegeId;
    }

    // Fetch data from both collections
    const [licensureRecords, recognitionRecords] = await Promise.all([
      LicensurePerformance.find(query).sort({ rankingYear: -1 }),
      GlobalRecognition.find(query).sort({ rankingYear: -1 })
    ]);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Consolidated_Institutional_Report.pdf");
    doc.pipe(res);

    // --- GLOBAL COVER / HEADER ---
    doc.fillColor("#660033").font("Helvetica-Bold").fontSize(22).text("MASTER INSTITUTIONAL PERFORMANCE AUDIT");
    doc.fillColor("#475569").fontSize(10).text(`Generated: ${new Date().toLocaleDateString()} | Multi-Model Data Compilation Scope`).moveDown(2);

    // ==========================================
    // SECTION 1: LICENSURE PERFORMANCE BREAKDOWN
    // ==========================================
    doc.fillColor("#660033").font("Helvetica-Bold").fontSize(14).text("1. Performance in Licensure Examinations");
    doc.moveTo(50, doc.y + 4).lineTo(550, doc.y + 4).strokeColor("#660033").stroke();
    doc.moveDown(1.5);

    if (licensureRecords.length === 0) {
      doc.font("Helvetica-Oblique").fontSize(10).fillColor("#94a3b8").text("No board exam records found for this scope.").moveDown(1.5);
    } else {
      licensureRecords.forEach((record) => {
        doc.font("Helvetica-Bold").fontSize(11).fillColor("#1e293b").text(`Academic Period Year: ${record.rankingYear}`);
        doc.font("Helvetica").fontSize(9).fillColor("#475569")
          .text(`• Target: ${record.summaryKpis.target}% | Actual: ${record.summaryKpis.actual}% | Variance: ${record.summaryKpis.variance >= 0 ? "+" : ""}${record.summaryKpis.variance}%`)
          .moveDown(0.5);

        let tableY = doc.y;
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#1e293b");
        doc.text("Course Registry Title", 60, tableY);
        doc.text("Verified Pass rate", 450, tableY);
        doc.moveTo(60, tableY + 12).lineTo(540, tableY + 12).strokeColor("#e2e8f0").stroke();
        
        tableY += 18;
        doc.font("Helvetica").fontSize(9).fillColor("#334155");
        record.programs.forEach((prog) => {
          if (tableY > 730) { doc.addPage(); tableY = 50; }
          doc.text(prog.programName, 60, tableY);
          doc.text(`${prog.passedCandidates}/${prog.totalCandidates} (${prog.percentage}%)`, 450, tableY);
          tableY += 15;
        });
        doc.y = tableY + 15;
      });
    }

    // ==========================================
    // SECTION 2: GLOBAL RECOGNITION & MILESTONES
    // ==========================================
    doc.moveDown(3);
    if (doc.y > 600) doc.addPage();
    
    // 💡 THE FIX: Capture the exact starting height below the previous section table
    const section2Y = doc.y;

    doc
      .fillColor("#660033")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("2. Global Recognition & International Accreditations", 50, section2Y, {
        width: 500, // Forces the layout bounding box back out to the full width of the page
        align: "left"
      });

    // Draw the full-width underline indicator rule safely below the heading box
    doc.moveTo(50, doc.y + 6).lineTo(550, doc.y + 6).strokeColor("#660033").stroke();
    
    // Position the layout pointer cursor cleanly down past the decorative rule
    doc.y += 20; 

    if (recognitionRecords.length === 0) {
      doc
        .font("Helvetica-Oblique")
        .fontSize(10)
        .fillColor("#94a3b8")
        .text("No international recognitions logged for this scope.", 50, doc.y, { width: 500 });
    } else {
      recognitionRecords.forEach((rec) => {
        if (doc.y > 680) doc.addPage();
        
        // 1. Matrix Header Heading (e.g., WURI: World University Rankings for Innovation (2026))
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor("#1e293b")
          .text(`${rec.rankingBody}: ${rec.ratingName} (${rec.rankingYear})`, 50, doc.y, { width: 500 });
        
        // 2. Overall Status Summary Sub-text block (e.g., 330 — Global Top 400...)
        if (rec.overallStatus && rec.overallStatus.rank) {
          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#660033")
            .text(`   Overall Status Rank: ${rec.overallStatus.rank} ${rec.overallStatus.subText ? `— ${rec.overallStatus.subText}` : ""}`, 50, doc.y, { width: 500 });
        }
        
        doc.y += 8;

        // 3. Render each of the Inner Grid Metrics (Rank 32, Rank 40, etc.)
        if (rec.metrics && rec.metrics.length > 0) {
          rec.metrics.forEach((metric) => {
            if (doc.y > 740) doc.addPage();

            // Format line string dynamically based on the presence of contextLabel
            const contextPrefix = metric.contextLabel ? `[${metric.contextLabel.toUpperCase()}] ` : "";
            
            doc
              .font("Helvetica")
              .fontSize(9.5)
              .fillColor("#334155")
              .text(`     • ${contextPrefix}RANK ${metric.rank}: ${metric.label.toUpperCase()}`, 50, doc.y, { width: 500 });
          });
        }

        // 4. Source Reference Meta Tag Footer
        if (rec.sourceRef) {
          doc
            .font("Helvetica-Oblique")
            .fontSize(8)
            .fillColor("#64748b")
            .text(`       Source Ref: ${rec.sourceRef}`, 50, doc.y + 4, { width: 500 });
        }
        
        doc.y += 18; // Controlled dynamic spacing buffer between bullet blocks
      });
    }

    doc.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};