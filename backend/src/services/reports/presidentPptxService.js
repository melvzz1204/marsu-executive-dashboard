// Renders the President's Report payload into a native, editable .pptx deck.
// All elements are real PowerPoint text boxes, shapes, tables, and images, so
// the downloaded file can be edited freely in PowerPoint or Google Slides.

const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const {
  COLORS,
  FONTS,
  LOGOS,
  LAYOUT,
  METRICS,
} = require("../../config/presidentReportTheme");

const CONTENT_W = LAYOUT.width - METRICS.marginX * 2;
const FOOTER_Y = LAYOUT.height - METRICS.footerBand;

const hex = (value) => String(value).replace("#", "");

let logoCache = null;

function readLogo(filename) {
  const filePath = path.join(__dirname, "..", "..", "assets", "logos", filename);
  try {
    const buffer = fs.readFileSync(filePath);
    const isPng =
      buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG";
    const width = isPng ? buffer.readUInt32BE(16) : 1;
    const height = isPng ? buffer.readUInt32BE(20) : 1;
    return {
      data: `image/png;base64,${buffer.toString("base64")}`,
      aspect: width / height,
    };
  } catch {
    return null;
  }
}

function getLogos() {
  if (!logoCache) {
    logoCache = {
      marsu: readLogo(LOGOS.marsu),
      bagongPilipinas: readLogo(LOGOS.bagongPilipinas),
      higherEducation: readLogo(LOGOS.higherEducation),
      wuri: readLogo(LOGOS.wuri),
    };
  }
  return logoCache;
}

function addRule(pptx, slide, { x, y, w, h = 0.03, color = COLORS.gold }) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: hex(color) },
    line: { color: hex(color), width: 0 },
  });
}

function addFooterBand(pptx, slide, meta) {
  const logos = getLogos();

  // Single-row footer on white: address line on the left, partner marks on the
  // right, separated by a hairline rule — matching the reference footer design.
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: FOOTER_Y,
    w: LAYOUT.width,
    h: METRICS.footerBand,
    fill: { color: hex(COLORS.white) },
    line: { color: hex(COLORS.white), width: 0 },
  });
  addRule(pptx, slide, {
    x: 0,
    y: FOOTER_Y,
    w: LAYOUT.width,
    h: 0.014,
    color: "E2E8F0",
  });

  const marks = [logos.bagongPilipinas, logos.higherEducation, logos.wuri].filter(
    Boolean,
  );

  const height = METRICS.footerLogoHeight;
  const gap = 0.2;
  const widths = marks.map((mark) => height * mark.aspect);
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    gap * Math.max(0, marks.length - 1);
  const logoX = LAYOUT.width - METRICS.marginX - total;
  const logoY = FOOTER_Y + (METRICS.footerBand - height) / 2;

  let x = logoX;
  marks.forEach((mark, index) => {
    slide.addImage({ data: mark.data, x, y: logoY, w: widths[index], h: height });
    x += widths[index] + gap;
  });

  slide.addText(meta.contact, {
    x: METRICS.marginX,
    y: FOOTER_Y + 0.02,
    w: Math.max(2, logoX - METRICS.marginX - 0.25),
    h: METRICS.footerBand - 0.04,
    fontFace: FONTS.body,
    fontSize: 6.5,
    color: hex(COLORS.slateMuted),
    align: "left",
    valign: "middle",
  });
}

function addLetterhead(pptx, slide, meta) {
  const logos = getLogos();

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: LAYOUT.width,
    h: METRICS.headerBand,
    fill: { color: hex(COLORS.burgundy) },
    line: { color: hex(COLORS.burgundy), width: 0 },
  });
  addRule(pptx, slide, { x: 0, y: METRICS.headerBand, w: LAYOUT.width, h: 0.04 });

  let textX = METRICS.marginX;
  if (logos.marsu) {
    const height = METRICS.headerLogoHeight;
    const width = height * logos.marsu.aspect;
    slide.addImage({
      data: logos.marsu.data,
      x: METRICS.marginX,
      y: (METRICS.headerBand - height) / 2,
      w: width,
      h: height,
    });
    textX = METRICS.marginX + width + 0.16;
  }

  const titleX = LAYOUT.width - 3.7;
  const textW = Math.max(2, titleX - textX - 0.1);

  slide.addText(meta.institution, {
    x: textX,
    y: 0.07,
    w: textW,
    h: 0.28,
    fontFace: FONTS.display,
    fontSize: 13,
    bold: true,
    color: hex(COLORS.white),
    charSpacing: 1,
  });
  slide.addText(meta.office, {
    x: textX,
    y: 0.34,
    w: textW,
    h: 0.22,
    fontFace: FONTS.body,
    fontSize: 9,
    color: hex(COLORS.goldSoft),
  });
  slide.addText(meta.title, {
    x: titleX,
    y: 0.2,
    w: 3.2,
    h: 0.3,
    fontFace: FONTS.body,
    fontSize: 10,
    bold: true,
    color: hex(COLORS.white),
    align: "right",
  });

  addFooterBand(pptx, slide, meta);
}

function addSlideHeading(pptx, slide, title, intro) {
  slide.addText(title, {
    x: METRICS.marginX,
    y: 0.82,
    w: CONTENT_W,
    h: 0.42,
    fontFace: FONTS.display,
    fontSize: 19,
    bold: true,
    color: hex(COLORS.burgundy),
  });
  addRule(pptx, slide, {
    x: METRICS.marginX,
    y: 1.22,
    w: 1.1,
    h: 0.035,
    color: COLORS.gold,
  });

  if (intro) {
    slide.addText(intro, {
      x: METRICS.marginX,
      y: 1.3,
      w: CONTENT_W,
      h: 0.4,
      fontFace: FONTS.body,
      fontSize: 9,
      italic: true,
      color: hex(COLORS.slateMuted),
    });
  }
}

function addCoverSlide(pptx, meta) {
  const logos = getLogos();
  const slide = pptx.addSlide();
  slide.background = { color: hex(COLORS.white) };

  const bandHeight = 1.05;
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: LAYOUT.width,
    h: bandHeight,
    fill: { color: hex(COLORS.burgundy) },
    line: { color: hex(COLORS.burgundy), width: 0 },
  });
  addRule(pptx, slide, { x: 0, y: bandHeight, w: LAYOUT.width, h: 0.05 });

  if (logos.marsu) {
    const height = 0.78;
    const width = height * logos.marsu.aspect;
    slide.addImage({
      data: logos.marsu.data,
      x: (LAYOUT.width - width) / 2,
      y: (bandHeight - height) / 2,
      w: width,
      h: height,
    });
  } else {
    slide.addText(meta.institution, {
      x: METRICS.marginX,
      y: 0.34,
      w: CONTENT_W,
      h: 0.4,
      fontFace: FONTS.display,
      fontSize: 18,
      bold: true,
      color: hex(COLORS.white),
      align: "center",
      charSpacing: 2,
    });
  }

  slide.addText(meta.country, {
    x: METRICS.marginX,
    y: 1.45,
    w: CONTENT_W,
    h: 0.3,
    fontFace: FONTS.body,
    fontSize: 11,
    color: hex(COLORS.slateMuted),
    align: "center",
  });
  slide.addText(meta.institution, {
    x: METRICS.marginX,
    y: 1.75,
    w: CONTENT_W,
    h: 0.5,
    fontFace: FONTS.display,
    fontSize: 22,
    bold: true,
    color: hex(COLORS.burgundy),
    align: "center",
    charSpacing: 1,
  });
  slide.addText(meta.office, {
    x: METRICS.marginX,
    y: 2.3,
    w: CONTENT_W,
    h: 0.3,
    fontFace: FONTS.body,
    fontSize: 13,
    color: hex(COLORS.slate),
    align: "center",
  });
  addRule(pptx, slide, { x: 3.9, y: 2.72, w: 2.2, h: 0.04 });
  slide.addText(meta.title, {
    x: METRICS.marginX,
    y: 2.9,
    w: CONTENT_W,
    h: 0.7,
    fontFace: FONTS.display,
    fontSize: 30,
    bold: true,
    color: hex(COLORS.burgundy),
    align: "center",
  });
  slide.addText(meta.periodLabel, {
    x: METRICS.marginX,
    y: 3.7,
    w: CONTENT_W,
    h: 0.4,
    fontFace: FONTS.body,
    fontSize: 12,
    color: hex(COLORS.slateMuted),
    align: "center",
  });

  addFooterBand(pptx, slide, meta);
}

function addThankYouSlide(pptx, meta) {
  const logos = getLogos();
  const slide = pptx.addSlide();
  slide.background = { color: hex(COLORS.white) };

  const bandHeight = 1.05;
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: LAYOUT.width,
    h: bandHeight,
    fill: { color: hex(COLORS.burgundy) },
    line: { color: hex(COLORS.burgundy), width: 0 },
  });
  addRule(pptx, slide, { x: 0, y: bandHeight, w: LAYOUT.width, h: 0.05 });

  if (logos.marsu) {
    const height = 0.78;
    const width = height * logos.marsu.aspect;
    slide.addImage({
      data: logos.marsu.data,
      x: (LAYOUT.width - width) / 2,
      y: (bandHeight - height) / 2,
      w: width,
      h: height,
    });
  }

  slide.addText(meta.country, {
    x: METRICS.marginX,
    y: 1.5,
    w: CONTENT_W,
    h: 0.3,
    fontFace: FONTS.body,
    fontSize: 11,
    color: hex(COLORS.slateMuted),
    align: "center",
  });
  slide.addText(meta.institution, {
    x: METRICS.marginX,
    y: 1.78,
    w: CONTENT_W,
    h: 0.5,
    fontFace: FONTS.display,
    fontSize: 22,
    bold: true,
    color: hex(COLORS.burgundy),
    align: "center",
    charSpacing: 1,
  });
  slide.addText(meta.office, {
    x: METRICS.marginX,
    y: 2.33,
    w: CONTENT_W,
    h: 0.3,
    fontFace: FONTS.body,
    fontSize: 13,
    color: hex(COLORS.slate),
    align: "center",
  });
  addRule(pptx, slide, { x: 3.9, y: 2.75, w: 2.2, h: 0.04 });
  slide.addText("Thank you very much.", {
    x: METRICS.marginX,
    y: 2.95,
    w: CONTENT_W,
    h: 0.7,
    fontFace: FONTS.display,
    fontSize: 34,
    bold: true,
    color: hex(COLORS.burgundy),
    align: "center",
  });
  slide.addText(meta.periodLabel, {
    x: METRICS.marginX,
    y: 3.72,
    w: CONTENT_W,
    h: 0.4,
    fontFace: FONTS.body,
    fontSize: 12,
    color: hex(COLORS.slateMuted),
    align: "center",
  });

  addFooterBand(pptx, slide, meta);
}

function addAgendaSlide(pptx, meta, agenda) {
  const slide = pptx.addSlide();
  slide.background = { color: hex(COLORS.white) };
  addLetterhead(pptx, slide, meta);

  slide.addText(agenda.eyebrow || meta.title, {
    x: METRICS.marginX,
    y: 0.95,
    w: CONTENT_W,
    h: 0.3,
    fontFace: FONTS.body,
    fontSize: 10,
    bold: true,
    color: hex(COLORS.gold),
    charSpacing: 2,
  });
  slide.addText(agenda.title, {
    x: METRICS.marginX,
    y: 1.25,
    w: CONTENT_W,
    h: 0.5,
    fontFace: FONTS.display,
    fontSize: 24,
    bold: true,
    color: hex(COLORS.burgundy),
  });
  addRule(pptx, slide, { x: METRICS.marginX, y: 1.81, w: 1.1, h: 0.035 });

  const startY = 2.1;
  const rowGap = 0.48;
  (agenda.items || []).forEach((item, index) => {
    const y = startY + index * rowGap;

    slide.addShape(pptx.ShapeType.rect, {
      x: METRICS.marginX,
      y,
      w: 0.42,
      h: 0.34,
      fill: { color: hex(COLORS.burgundy) },
      line: { color: hex(COLORS.burgundy), width: 0 },
    });
    slide.addText(String(index + 1).padStart(2, "0"), {
      x: METRICS.marginX,
      y,
      w: 0.42,
      h: 0.34,
      fontFace: FONTS.body,
      fontSize: 11,
      bold: true,
      color: hex(COLORS.gold),
      align: "center",
      valign: "middle",
    });
    slide.addText(item, {
      x: METRICS.marginX + 0.6,
      y,
      w: CONTENT_W - 0.6,
      h: 0.34,
      fontFace: FONTS.body,
      fontSize: 13,
      color: hex(COLORS.ink),
      valign: "middle",
    });
  });
}

function addDividerSlide(pptx, section, index) {
  const logos = getLogos();
  const slide = pptx.addSlide();
  slide.background = { color: hex(COLORS.burgundy) };

  // Gold spine on the left edge.
  addRule(pptx, slide, {
    x: 0,
    y: 0,
    w: 0.14,
    h: LAYOUT.height,
    color: COLORS.gold,
  });

  // Big section number with a short gold rule beside it.
  slide.addText(String(index + 1).padStart(2, "0"), {
    x: METRICS.marginX,
    y: 1.45,
    w: 1.8,
    h: 0.9,
    fontFace: FONTS.display,
    fontSize: 46,
    bold: true,
    color: hex(COLORS.gold),
  });
  addRule(pptx, slide, {
    x: METRICS.marginX + 1.45,
    y: 1.85,
    w: 1.3,
    h: 0.035,
    color: COLORS.gold,
  });

  slide.addText(section.title, {
    x: METRICS.marginX,
    y: 2.35,
    w: CONTENT_W,
    h: 0.7,
    fontFace: FONTS.display,
    fontSize: 28,
    bold: true,
    color: hex(COLORS.white),
  });

  if (section.intro) {
    slide.addText(section.intro, {
      x: METRICS.marginX,
      y: 3.15,
      w: CONTENT_W - 1.2,
      h: 0.9,
      fontFace: FONTS.body,
      fontSize: 11,
      color: hex(COLORS.goldSoft),
      valign: "top",
    });
  }

  // Partner marks on a white band so the logos stay legible against burgundy.
  const bandHeight = 0.56;
  const bandX = 0.14;
  const bandY = LAYOUT.height - bandHeight;

  slide.addShape(pptx.ShapeType.rect, {
    x: bandX,
    y: bandY,
    w: LAYOUT.width - bandX,
    h: bandHeight,
    fill: { color: hex(COLORS.white) },
    line: { color: hex(COLORS.white), width: 0 },
  });
  addRule(pptx, slide, {
    x: bandX,
    y: bandY,
    w: LAYOUT.width - bandX,
    h: 0.02,
    color: COLORS.gold,
  });

  const footerMarks = [logos.bagongPilipinas, logos.higherEducation, logos.wuri].filter(
    Boolean,
  );
  if (footerMarks.length > 0) {
    const height = 0.32;
    const gap = 0.22;
    const widths = footerMarks.map((mark) => height * mark.aspect);
    const total =
      widths.reduce((sum, width) => sum + width, 0) +
      gap * (footerMarks.length - 1);
    let x = LAYOUT.width - METRICS.marginX - total;
    const y = bandY + (bandHeight - height) / 2;

    footerMarks.forEach((mark, markIndex) => {
      slide.addImage({
        data: mark.data,
        x,
        y,
        w: widths[markIndex],
        h: height,
      });
      x += widths[markIndex] + gap;
    });
  }
}

const headerCell = (text) => ({
  text,
  options: {
    fill: { color: hex(COLORS.burgundy) },
    color: hex(COLORS.white),
    bold: true,
    fontSize: 10,
  },
});

const bodyCell = (text, options = {}) => ({
  text: text === null || text === undefined ? "" : String(text),
  options: {
    color: hex(COLORS.ink),
    fontSize: 9.5,
    ...options,
  },
});

function varianceColor(variance) {
  if (variance === null || variance === undefined) return COLORS.ink;
  if (variance > 0) return COLORS.positive;
  if (variance < 0) return COLORS.negative;
  return COLORS.ink;
}

function formatValue(value, unit) {
  if (value === null || value === undefined) return "";
  return unit ? `${value}${unit}` : String(value);
}

function formatVariance(variance, unit) {
  if (variance === null || variance === undefined) return "";
  const sign = variance > 0 ? "+" : "";
  return `${sign}${variance}${unit || ""}`;
}

function addPlacementChart(pptx, slide, chart, top) {
  const lineSeries = (chart.series || []).find(
    (series) => series.kind === "line",
  );
  const barSeries = (chart.series || []).filter(
    (series) => series.kind !== "line",
  );

  if (
    !lineSeries ||
    barSeries.length !== 2 ||
    !chart.labels ||
    chart.labels.length === 0
  ) {
    return top;
  }

  const bottom = Math.min(top + 2.18, 4.62);
  const height = Math.max(1.2, bottom - top);
  const textColor = hex(COLORS.slateMuted);
  const toChartSeries = (series) => ({
    name: series.name,
    labels: chart.labels,
    values: series.values,
  });

  slide.addChart(
    [
      {
        type: pptx.ChartType.bar,
        data: barSeries.map(toChartSeries),
        options: {
          chartColors: barSeries.map((series) => hex(series.color)),
          chartColorsOpacity: 100,
          barGrouping: "clustered",
          barGapWidthPct: 150,
          showValue: true,
          dataLabelFontFace: FONTS.body,
          dataLabelFontSize: 7.5,
          dataLabelColor: hex(COLORS.slate),
          dataLabelFormatCode: "#,##0",
          dataBorder: { color: hex(COLORS.white), pt: 0.75 },
        },
      },
      {
        type: pptx.ChartType.line,
        data: [toChartSeries(lineSeries)],
        options: {
          secondaryValAxis: true,
          secondaryCatAxis: true,
          chartColors: [
            hex(lineSeries.color),
            hex(lineSeries.color),
            hex(lineSeries.color),
          ],
          chartColorsOpacity: 100,
          lineSmooth: true,
          lineSize: 3.5,
          lineCap: "round",
          lineDataSymbol: "circle",
          lineDataSymbolSize: 7,
          lineDataSymbolLineColor: hex(COLORS.white),
          // Mixed-chart markers expect EMUs rather than points in this path.
          lineDataSymbolLineSize: 25400,
          showValue: true,
          dataLabelFontFace: FONTS.body,
          dataLabelFontSize: 7.5,
          dataLabelColor: hex(COLORS.slate),
          dataLabelFormatCode: '0"%"',
          dataLabelPosition: "t",
        },
      },
    ],
    {
      x: METRICS.marginX,
      y: top,
      w: CONTENT_W,
      h: height,
      chartArea: {
        fill: { color: hex(COLORS.white) },
        roundedCorners: true,
      },
      plotArea: {
        fill: { color: hex(COLORS.white) },
        border: { color: hex(COLORS.line), pt: 0.75 },
      },
      barDir: "col",
      showTitle: false,
      showLegend: true,
      legendPos: "tr",
      legendFontFace: FONTS.body,
      legendFontSize: 8.5,
      legendColor: hex(COLORS.ink),
      catAxisTitle: chart.xLabel,
      catAxisTitleFontFace: FONTS.body,
      catAxisTitleFontSize: 8,
      catAxisTitleColor: textColor,
      catAxisLabelFontFace: FONTS.body,
      catAxisLabelFontSize: 8.5,
      catAxisLabelColor: textColor,
      catAxisLineShow: false,
      catAxisMajorTickMark: "none",
      catGridLine: { style: "none" },
      // pptxgenjs requires BOTH catAxes and valAxes for combo charts; without
      // the secondary category axis the line series' cross-axis reference is
      // undefined and PowerPoint refuses to open the file.
      catAxes: [
        { catAxisTitle: chart.xLabel },
        { catAxisHidden: true, catAxisTitle: "" },
      ],
      valAxes: [
        {
          showValAxisTitle: true,
          valAxisTitle: chart.primaryYLabel,
          valAxisTitleFontFace: FONTS.body,
          valAxisTitleFontSize: 8,
          valAxisTitleColor: textColor,
          valAxisLabelFontFace: FONTS.body,
          valAxisLabelFontSize: 8.5,
          valAxisLabelColor: textColor,
          valAxisLabelFormatCode: "#,##0",
          valAxisMinVal: 0,
          valGridLine: {
            color: hex(COLORS.line),
            size: 0.75,
            style: "solid",
          },
        },
        {
          showValAxisTitle: true,
          valAxisTitle: chart.secondaryYLabel,
          valAxisTitleFontFace: FONTS.body,
          valAxisTitleFontSize: 8,
          valAxisTitleColor: textColor,
          valAxisLabelFontFace: FONTS.body,
          valAxisLabelFontSize: 8.5,
          valAxisLabelColor: textColor,
          valAxisLabelFormatCode: '0"%"',
          valAxisMinVal: 0,
          valAxisMaxVal: 100,
          valGridLine: { style: "none" },
        },
      ],
    },
  );

  return top + height;
}

function addIndicatorSlide(pptx, meta, section, slideData) {
  const slide = pptx.addSlide();
  slide.background = { color: hex(COLORS.white) };
  addLetterhead(pptx, slide, meta);
  addSlideHeading(pptx, slide, slideData.title, null);

  const tableY = 1.42;

  const rows = [
    slideData.columns.map(headerCell),
    ...slideData.rows.map((row) =>
      [
        bodyCell(row.label, { bold: false, align: "left" }),
        bodyCell(formatValue(row.target, row.unit), { align: "center" }),
        bodyCell(formatValue(row.actual, row.unit), {
          align: "center",
          bold: true,
          color: hex(COLORS.burgundy),
        }),
        bodyCell(formatVariance(row.variance, row.unit), {
          align: "center",
          bold: true,
          color: hex(varianceColor(row.variance)),
        }),
      ],
    ),
  ];

  slide.addTable(rows, {
    x: METRICS.marginX,
    y: tableY,
    w: CONTENT_W,
    colW: [4.0, 1.6, 1.6, 1.8],
    fontFace: FONTS.body,
    valign: "middle",
    rowH: 0.4,
    border: { type: "solid", pt: 0.5, color: hex(COLORS.line) },
    autoPage: false,
  });

  let nextY = tableY + 0.4 + slideData.rows.length * 0.4 + 0.22;

  // Optional secondary breakdown table (e.g. per-examination licensure rates).
  if (slideData.program && slideData.program.rows.length > 0) {
    slide.addText(slideData.program.title || "", {
      x: METRICS.marginX,
      y: nextY,
      w: CONTENT_W,
      h: 0.28,
      fontFace: FONTS.body,
      fontSize: 9.5,
      bold: true,
      color: hex(COLORS.slate),
    });
    nextY += 0.3;

    const programRows = [slideData.program.columns.map(headerCell)];
    slideData.program.rows.slice(0, 5).forEach((row) => {
      programRows.push(
        row.map((value, index) =>
          bodyCell(value, { align: index === 0 ? "left" : "center" }),
        ),
      );
    });

    slide.addTable(programRows, {
      x: METRICS.marginX,
      y: nextY,
      w: CONTENT_W,
      colW: [4.5, 1.5, 1.5, 1.5],
      fontFace: FONTS.body,
      valign: "middle",
      rowH: 0.3,
      border: { type: "solid", pt: 0.5, color: hex(COLORS.line) },
      autoPage: false,
    });

    nextY += 0.38 + Math.min(slideData.program.rows.length, 5) * 0.3 + 0.12;
  }

  if (
    slideData.chart?.labels?.length > 0 &&
    slideData.chart?.series?.length > 0
  ) {
    slide.addText(slideData.chart.title, {
      x: METRICS.marginX,
      y: nextY,
      w: CONTENT_W,
      h: 0.26,
      fontFace: FONTS.body,
      fontSize: 9.5,
      bold: true,
      color: hex(COLORS.ink),
    });

    nextY = addPlacementChart(pptx, slide, slideData.chart, nextY + 0.3) + 0.08;
  }

  if (slideData.notes && slideData.notes.length > 0) {
    slide.addText(slideData.notes.join("  "), {
      x: METRICS.marginX,
      y: Math.min(nextY, 4.75),
      w: CONTENT_W,
      h: 0.5,
      fontFace: FONTS.body,
      fontSize: 8,
      color: hex(COLORS.slateMuted),
      valign: "top",
    });
  }
}

function addProgramSlide(pptx, meta, slideData) {
  const slide = pptx.addSlide();
  slide.background = { color: hex(COLORS.white) };
  addLetterhead(pptx, slide, meta);
  addSlideHeading(pptx, slide, slideData.title, null);

  const rows = [slideData.columns.map(headerCell)];

  if (slideData.rows.length === 0) {
    rows.push(
      slideData.columns.map((_, index) =>
        bodyCell("", { align: index === 0 ? "left" : "center" }),
      ),
    );
  } else {
    slideData.rows.forEach((row) => {
      rows.push(
        row.map((value, index) =>
          bodyCell(value, { align: index === 0 ? "left" : "center" }),
        ),
      );
    });
  }

  slide.addTable(rows, {
    x: METRICS.marginX,
    y: 1.42,
    w: CONTENT_W,
    colW: [4.5, 1.5, 1.5, 1.5],
    fontFace: FONTS.body,
    valign: "middle",
    rowH: 0.4,
    border: { type: "solid", pt: 0.5, color: hex(COLORS.line) },
    autoPage: false,
  });
}

// Native, editable PowerPoint charts driven by live dashboard data.
function addChartSlide(pptx, meta, slideData) {
  const slide = pptx.addSlide();
  slide.background = { color: hex(COLORS.white) };
  addLetterhead(pptx, slide, meta);
  addSlideHeading(pptx, slide, slideData.title, null);

  const charts = (slideData.charts || []).filter(
    (chart) => chart.labels && chart.labels.length > 0,
  );

  if (charts.length === 0) {
    slide.addText("Chart data is not available for this period.", {
      x: METRICS.marginX,
      y: 2.2,
      w: CONTENT_W,
      h: 0.4,
      fontFace: FONTS.body,
      fontSize: 10,
      italic: true,
      color: hex(COLORS.slateMuted),
      align: "center",
    });
    return;
  }

  const gap = 0.4;
  const top = 1.5;
  const height = 3.25;
  const width = (CONTENT_W - gap * (charts.length - 1)) / charts.length;

  charts.forEach((chart, index) => {
    const isLine = chart.kind === "line";
    const isHorizontal = chart.orientation === "bar";
    const chartData = [
      {
        name: chart.name || "Series",
        labels: chart.labels,
        values: chart.values,
      },
    ];

    slide.addChart(
      isLine ? pptx.ChartType.line : pptx.ChartType.bar,
      chartData,
      {
        x: METRICS.marginX + index * (width + gap),
        y: top,
        w: width,
        h: height,
        barDir: isHorizontal ? "bar" : "col",
        barGapWidthPct: isHorizontal ? 70 : 120,
        chartColors: [hex(isLine ? COLORS.gold : COLORS.burgundy)],
        chartColorsOpacity: 100,
        chartArea: {
          fill: { color: hex(COLORS.white) },
          roundedCorners: true,
        },
        plotArea: {
          fill: { color: hex(COLORS.white) },
          border: { color: hex(COLORS.line), pt: 0.75 },
        },
        lineSmooth: isLine,
        lineSize: isLine ? 3.5 : undefined,
        lineCap: isLine ? "round" : undefined,
        lineDataSymbol: isLine ? "circle" : "none",
        lineDataSymbolSize: isLine ? 7 : undefined,
        lineDataSymbolLineColor: isLine ? hex(COLORS.white) : undefined,
        lineDataSymbolLineSize: isLine ? 2 : undefined,
        showLegend: false,
        showTitle: Boolean(chart.title),
        title: chart.title,
        titleFontFace: FONTS.body,
        titleFontSize: 11,
        titleColor: hex(COLORS.ink),
        showValue: true,
        dataLabelFontSize: 7.5,
        dataLabelColor: hex(COLORS.slate),
        dataLabelPosition: isLine ? "t" : "outEnd",
        catAxisHidden: false,
        catAxisLabelFontFace: FONTS.body,
        catAxisLabelFontSize: 7.5,
        catAxisLabelColor: hex(COLORS.slateMuted),
        catAxisLineShow: false,
        catAxisMajorTickMark: "none",
        catGridLine: { style: "none" },
        valAxisLabelFontFace: FONTS.body,
        valAxisLabelFontSize: 7.5,
        valAxisLabelColor: hex(COLORS.slateMuted),
        valAxisLineShow: false,
        valAxisMajorTickMark: "none",
        valAxisMinVal: 0,
        valGridLine: {
          color: hex(COLORS.line),
          size: 0.75,
          style: "solid",
        },
        catAxisTitle: chart.xLabel,
        catAxisTitleFontFace: FONTS.body,
        catAxisTitleFontSize: 8,
        catAxisTitleColor: hex(COLORS.slateMuted),
        valAxisTitle: chart.yLabel,
        valAxisTitleFontFace: FONTS.body,
        valAxisTitleFontSize: 8,
        valAxisTitleColor: hex(COLORS.slateMuted),
      },
    );
  });
}

// One milestone per slide, matching the reference deck's Key Accomplishments.
function addMilestoneSlide(pptx, meta, item, index, total) {
  const slide = pptx.addSlide();
  slide.background = { color: hex(COLORS.white) };
  addLetterhead(pptx, slide, meta);

  if (!item) {
    addSlideHeading(pptx, slide, "Key Accomplishments", null);
    return;
  }

  slide.addText((item.category || "Key Accomplishment").toUpperCase(), {
    x: METRICS.marginX,
    y: 0.98,
    w: CONTENT_W - 1.2,
    h: 0.3,
    fontFace: FONTS.body,
    fontSize: 9,
    bold: true,
    color: hex(COLORS.gold),
    charSpacing: 1.5,
  });
  slide.addText(`${index + 1} / ${total}`, {
    x: LAYOUT.width - 2,
    y: 0.98,
    w: 1.5,
    h: 0.3,
    fontFace: FONTS.body,
    fontSize: 8.5,
    color: hex(COLORS.slateMuted),
    align: "right",
  });

  slide.addText(item.title || "", {
    x: METRICS.marginX,
    y: 1.32,
    w: CONTENT_W,
    h: 0.95,
    fontFace: FONTS.display,
    fontSize: 22,
    bold: true,
    color: hex(COLORS.burgundy),
    valign: "top",
  });

  addRule(pptx, slide, {
    x: METRICS.marginX,
    y: 2.3,
    w: 1.1,
    h: 0.035,
    color: COLORS.gold,
  });

  const body = (item.body || item.subtitle || "").replace(/\s+/g, " ").trim();

  slide.addText(body.slice(0, 720), {
    x: METRICS.marginX,
    y: 2.55,
    w: CONTENT_W,
    h: 2.3,
    fontFace: FONTS.body,
    fontSize: 11.5,
    color: hex(COLORS.slate),
    valign: "top",
    lineSpacingMultiple: 1.15,
  });
}

async function buildPresidentPptx(payload) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({
    name: LAYOUT.name,
    width: LAYOUT.width,
    height: LAYOUT.height,
  });
  pptx.layout = LAYOUT.name;
  pptx.author = "MarSU Executive Dashboard";
  pptx.company = payload.meta.institution;
  pptx.title = `${payload.meta.title} ${payload.meta.year}`;

  const { meta } = payload;

  addCoverSlide(pptx, meta);
  addAgendaSlide(pptx, meta, payload.agenda);
  payload.sections.forEach((section, sectionIndex) => {
    addDividerSlide(pptx, section, sectionIndex);

    section.slides.forEach((slideData) => {
      if (slideData.type === "indicatorTable") {
        addIndicatorSlide(pptx, meta, section, slideData);
      } else if (slideData.type === "programTable") {
        addProgramSlide(pptx, meta, slideData);
      } else if (slideData.type === "chart") {
        addChartSlide(pptx, meta, slideData);
      } else if (slideData.type === "accomplishmentCards") {
        const items = slideData.items || [];
        if (items.length === 0) {
          addMilestoneSlide(pptx, meta, null, 0, 1);
        } else {
          items.forEach((item, itemIndex) =>
            addMilestoneSlide(pptx, meta, item, itemIndex, items.length),
          );
        }
      }
    });
  });

  addThankYouSlide(pptx, meta);

  return pptx.write({ outputType: "nodebuffer" });
}

module.exports = { buildPresidentPptx };
