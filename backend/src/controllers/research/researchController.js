// controllers/research/researchController.js
const ResearchAnalytics = require("../../models/research/researchAnalyticsModel");

// @desc    Get Research Analytics Breakdown by Fiscal Year
// @route   GET /api/v1/research/research
// @access  Private
exports.getResearchAnalytics = async (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : 2026;
    
    const record = await ResearchAnalytics.findOne({ fiscalYear: year })
      .populate("departmentalBreakdown.collegeId", "name code"); // Optionally populates full college doc metadata

    if (!record) {
      return res.status(404).json({
        success: false,
        error: `No research analytics ledger records found for fiscal period ${year}.`
      });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Upsert/Create Year Ledger Record with Department Breakdowns
// @route   POST /api/v1/research/research
// @access  Private/Admin
exports.upsertResearchAnalytics = async (req, res) => {
  try {
    const { fiscalYear, departmentalBreakdown, isConfidential } = req.body;

    if (!fiscalYear) {
      return res.status(400).json({ success: false, error: "Please provide a valid fiscal year reference." });
    }

    // Finds existing year records to overwrite or initializes a clean document model instance
    let record = await ResearchAnalytics.findOne({ fiscalYear });

    if (record) {
      if (departmentalBreakdown) record.departmentalBreakdown = departmentalBreakdown;
      if (typeof isConfidential !== "undefined") record.isConfidential = isConfidential;
    } else {
      record = new ResearchAnalytics({
        fiscalYear,
        departmentalBreakdown,
        isConfidential
      });
    }

    // The pre-save hook in our model automatically runs here to compute summaryKpis aggregates!
    await record.save();

    return res.status(200).json({
      success: true,
      message: `Research metrics ledger for FY-${fiscalYear} successfully preserved.`,
      data: record
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Quick Inline Update for a single college metric entry inside an existing ledger year
// @route   PATCH /api/v1/research/research/college
// @access  Private/Dean/Admin
exports.updateCollegeMetric = async (req, res) => {
  try {
    const { fiscalYear, collegeCode, papersPublished, grantsSecuredMillions } = req.body;

    const record = await ResearchAnalytics.findOne({ fiscalYear });
    if (!record) {
      return res.status(404).json({ success: false, error: `Ledger document for year ${fiscalYear} not found.` });
    }

    // Locate the sub-document index inside the departmental matrix array
    const targetIndex = record.departmentalBreakdown.findIndex(
      (item) => item.collegeCode.toUpperCase() === collegeCode.toUpperCase()
    );

    if (targetIndex === -1) {
      return res.status(404).json({ success: false, error: `Department profile ${collegeCode} not initialized inside this ledger.` });
    }

    // Perform targeted element modification
    if (typeof papersPublished !== "undefined") record.departmentalBreakdown[targetIndex].papersPublished = Number(papersPublished);
    if (typeof grantsSecuredMillions !== "undefined") record.departmentalBreakdown[targetIndex].grantsSecuredMillions = Number(grantsSecuredMillions);

    // Save triggers the pre-save hooks to recalculate global aggregates cleanly
    await record.save();

    return res.status(200).json({
      success: true,
      message: `Updated telemetry markers for ${collegeCode.toUpperCase()}`,
      data: record
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};