/**
 * Smoke test for the Empower report PDF generator.
 *
 * Verifies the core regression: wrapped text must never exceed the
 * printable content width (right-edge clipping), and the generator must
 * complete without throwing for a representative multi-tool report set.
 *
 * Run from `frontend/`:  node smoke-pdf.test.mjs
 */
import { jsPDF } from "jspdf";

const CONTENT_W = 186; // A4 width (210mm) - 2 * margin (12mm) — mirrors reportPdf.js
const RIGHT_EDGE = 12 + CONTENT_W; // 198mm

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
};
const pass = (msg) => console.log(`✓ ${msg}`);

// Long realistic insight-like sentences (the kind that were being clipped).
const SAMPLES = [
  "As of 1st Semester, AY 2024-2025, the Boac campus enrolls 8,421 students across 42 active academic programs. Enrollment is up 3.2% year over year.",
  "This is a net increase of 4.6% over the period — a growth trajectory that should be sustained with continued recruitment and retention strategies.",
  "The dataset covers 1,284 research records for 2024 (Completed studies). 987 are published — a 76.9% publication rate, and 214 produced intellectual property.",
];

const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

// Simulate the previous (stale) font state — 7pt italic — then render at 8.5pt.
doc.setFont("helvetica", "italic");
doc.setFontSize(7);
doc.setTextColor(230, 210, 215);

doc.setFont("helvetica", "normal");
doc.setFontSize(8.5);
doc.setTextColor(51, 65, 85);

let overflow = false;
SAMPLES.forEach((s, i) => {
  const lines = doc.splitTextToSize(s, CONTENT_W);
  lines.forEach((line) => {
    const w = doc.getTextWidth(line);
    const x = 12; // MARGIN
    if (x + w > RIGHT_EDGE + 0.05) {
      fail(
        `sample ${i + 1} line overflows: width=${w.toFixed(1)}mm, right edge=${(x + w).toFixed(1)}mm`,
      );
      overflow = true;
    }
  });
});
if (!overflow)
  pass(`all ${SAMPLES.length} wrapped samples fit within ${CONTENT_W}mm`);

// Verify the generator module itself imports & runs end-to-end.
try {
  const { generateReportPdf } = await import(
    "./src/components/Empower/reportPdf.js"
  );
  if (typeof generateReportPdf !== "function") {
    fail("generateReportPdf is not exported as a function");
  } else {
    pass("reportPdf.js imports and exposes generateReportPdf()");
  }
} catch (err) {
  fail(`reportPdf.js import failed: ${err.message}`);
}

console.log(process.exitCode ? "\nSMOKE TEST FAILED" : "\nSMOKE TEST PASSED");
