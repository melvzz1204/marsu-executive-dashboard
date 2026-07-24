const mongoose = require("mongoose");

// Sub-document schema for category/breakdown metrics (handles both SDGs and WURI Categories)
const MetricBreakdownSchema = new mongoose.Schema({
  label: {
    type: String, // e.g., "SDG 1: No Poverty" or "ETHICS AND ACCOUNTABILITY"
    required: true,
    trim: true,
  },
  rank: {
    type: String, // Supports "32", "1001+", "1001-1500"
    required: true,
  },
  contextLabel: {
    type: String, // e.g., "OUT OF 1267" or "TOP 100" to match different card styles
    default: null,
  },
});

// Main schema for a Global Recognition Matrix Entry
const GlobalRecognitionSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College", // Links this record to a specific college
    required: [true, "Please link this matrix card to a college"],
  },
  rankingBody: {
    type: String,
    required: [true, "Please specify the ranking body (e.g., THE, WURI)"],
    enum: ["Times Higher Education", "WURI", "QS", "Shanghai"], // Added future-proofing options
  },
  ratingName: {
    type: String, // e.g., "Sustainability Impact Ratings" or "World University Rankings for Innovation"
    required: true,
    trim: true,
  },
  rankingYear: {
    type: Number,
    required: true,
  },
  overallStatus: {
    rank: {
      type: String, // e.g., "1501+" or "330"
      required: true,
    },
    subText: {
      type: String, // e.g., "2318 institutions" or "Global Top 400 Innovative Universi..."
      default: null,
    },
  },
  metrics: [MetricBreakdownSchema], // Handles the individual inner cards dynamically
  sourceRef: {
    type: String, // "THE IMPACT DATA DESK" or "WURI INNOVATION REGISTRY"
    required: true,
    trim: true,
  },
  isCertifiedOfficial: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("GlobalRecognition", GlobalRecognitionSchema);