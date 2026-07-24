// models/licensurePerformanceModel.js
const mongoose = require("mongoose");

const ProgramBreakdownSchema = new mongoose.Schema({
  programName: {
    type: String,
    required: [true, "Please add the program/course name (e.g., LET ELEMENTARY)"],
    trim: true,
  },
  passedCandidates: {
    type: Number,
    required: [true, "Please add the number of candidates who passed"],
    min: [0, "Passed candidates cannot be negative"],
  },
  totalCandidates: {
    type: Number,
    required: [true, "Please add the total number of exam-takers"],
    min: [0, "Total candidates cannot be negative"],
  },
  percentage: {
    type: Number,
    required: [true, "Please add the passing percentage"],
    min: [0, "Percentage cannot be less than 0%"],
    max: [100, "Percentage cannot exceed 100%"],
  }
});

const LicensurePerformanceSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: [true, "Please link this performance matrix to a specific college"],
  },
  rankingYear: {
    type: Number,
    required: [true, "Please specify the year of this data (e.g., 2026)"],
  },
  summaryKpis: {
    target: {
      type: Number,
      required: [true, "Please specify the institutional target threshold (e.g., 64.00)"],
    },
    actual: {
      type: Number,
      required: [true, "Please specify the actual overall institutional passing rate (e.g., 72.93)"],
    },
    variance: {
      type: Number,
    }
  },
  institutionalContext: {
    totalPassedVerified: {
      type: Number,
      required: [true, "Total across all courses verified passed"],
    },
    totalCandidatesVerified: {
      type: Number,
      required: [true, "Total across all courses verified tested"],
    }
  },
  programs: [ProgramBreakdownSchema], // Array of live grid breakdowns
  isCertifiedOfficial: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Pre-save middleware to automatically calculate the variance if it's not sent explicitly
LicensurePerformanceSchema.pre("save", async function () {
  // Only calculate if actual and target are present, and variance wasn't manually provided
  if (
    this.summaryKpis && 
    this.summaryKpis.actual !== undefined && 
    this.summaryKpis.target !== undefined &&
    this.summaryKpis.variance === undefined
  ) {
    const calculatedVariance = this.summaryKpis.actual - this.summaryKpis.target;
    this.summaryKpis.variance = parseFloat(calculatedVariance.toFixed(2));
  }
});

module.exports = mongoose.model("LicensurePerformance", LicensurePerformanceSchema);