// Design tokens for the President's Report deck. Change visuals here without
// touching slide-building logic in presidentPptxService.js.

const COLORS = {
  burgundy: "600018",
  burgundyDark: "3A0010",
  burgundyDeep: "4A0012",
  gold: "D4AF37",
  goldSoft: "E7D5A0",
  ink: "1E293B",
  slate: "334155",
  slateMuted: "64748B",
  line: "E2E8F0",
  card: "F8FAFC",
  zebra: "F1F5F9",
  white: "FFFFFF",
  positive: "059669",
  negative: "BE123C",
};

const FONTS = {
  display: "Georgia",
  body: "Arial",
};

// Logo files live in backend/src/assets/logos. MarSU sits in the top
// letterhead; the three partner marks sit in the footer band.
const LOGOS = {
  marsu: "marsu-logo.png",
  bagongPilipinas: "bagongpilipinas.png",
  higherEducation: "highereducation.png",
  wuri: "wuri.png",
};

const LAYOUT = {
  name: "MARSU_PRESIDENT_REPORT",
  width: 10,
  height: 5.625,
};

// Letterhead band height and content start, in inches.
const METRICS = {
  headerBand: 0.62,
  footerBand: 0.56,
  marginX: 0.5,
  contentTop: 1.0,
  contentBottom: 5.05,
  headerLogoHeight: 0.46,
  footerLogoHeight: 0.28,
};

module.exports = {
  COLORS,
  FONTS,
  LOGOS,
  LAYOUT,
  METRICS,
};
