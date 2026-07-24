// controllers/globalRecognitionController.js
const GlobalRecognition = require("../../models/achievements/globalRecognitionModel");

// @desc    Get all global recognition matrix cards for a college
// @route   GET /api/v1/global-recognition
// @access  Private (Executive, Dean, Admin)
exports.getCollegeMetrics = async (req, res) => {
  try {
    // Admins and Executives can pass a collegeId via query parameters to view specific campus metrics.
    // Deans will automatically default to their assigned collegeId from their JWT.
    let collegeId = req.query.collegeId || req.user.collegeId;
    let query = {};

    // 💡 FLEXIBLE QUERY BUILDER: 
    // If a collegeId exists, scope the search to that campus.
    if (collegeId) {
      query.collegeId = collegeId;
    } else if (req.user.role === "dean") {
      // Deans MUST have a collegeId constraint to maintain system integrity.
      return res.status(400).json({ success: false, error: "Dean account missing assigned College ID" });
    }
    // If user is Admin/Executive and no collegeId is provided, 'query' remains {} to pull everything!

    // Security check: Deans should not look at other colleges' dashboards
    if (req.user.role === "dean" && collegeId && collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized to access this college's data" });
    }

    const cards = await GlobalRecognition.find(query).sort({ rankingYear: -1 });

    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create/Input a new matrix card entry
// @route   POST /api/v1/global-recognition
// @access  Private (Admin Only)
exports.createMetricCard = async (req, res) => {
  try {
    const card = await GlobalRecognition.create(req.body);

    res.status(201).json({
      success: true,
      data: card,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update an existing matrix card or append a single sub-metric item
// @route   PUT /api/v1/global-recognition/:id
// @access  Private (Admin Only)
exports.updateMetricCard = async (req, res) => {
  try {
    let card = await GlobalRecognition.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        error: "Card not found",
      });
    }

    // If you just want to append a single new metric row dynamically
    if (req.body.newMetric) {
      card = await GlobalRecognition.findByIdAndUpdate(
        req.params.id,
        { $push: { metrics: req.body.newMetric } }, // Uses MongoDB atomic $push matrix array extension
        { new: true, runValidators: true }
      );
    } else {
      // comprehensive structure update (Full configuration overwrite fallback)
      card = await GlobalRecognition.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete a metric card entry
// @route   DELETE /api/v1/global-recognition/:id
// @access  Private (Admin Only)
exports.deleteMetricCard = async (req, res) => {
  try {
    const card = await GlobalRecognition.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ success: false, error: "Card not found" });
    }

    await card.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};