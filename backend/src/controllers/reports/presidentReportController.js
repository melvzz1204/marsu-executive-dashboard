const { buildPresidentReport } = require("../../services/reports/presidentReportService");
const { buildPresidentPptx } = require("../../services/reports/presidentPptxService");

function resolveYear(req) {
  const requested = Number(req.query.year);
  if (Number.isFinite(requested) && requested >= 2000 && requested <= 2100) {
    return requested;
  }
  return new Date().getFullYear();
}

// @desc    Build the President's Report payload (JSON) for a reporting year
// @route   GET /api/v1/reports/presidents?year=YYYY
// @access  Executive / Admin
exports.getPresidentReport = async (req, res) => {
  try {
    const year = resolveYear(req);
    const report = await buildPresidentReport({ year });
    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to build the President's Report",
      error: error.message,
    });
  }
};

// @desc    Download the President's Report as an editable .pptx
// @route   GET /api/v1/reports/presidents/pptx?year=YYYY
// @access  Executive / Admin
exports.downloadPresidentPptx = async (req, res) => {
  try {
    const year = resolveYear(req);
    const report = await buildPresidentReport({ year });
    const buffer = await buildPresidentPptx(report);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Presidents-Report-${year}.pptx`,
    );
    return res.send(buffer);
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate the President's Report presentation",
        error: error.message,
      });
    }
    return undefined;
  }
};
