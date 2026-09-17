const mongoose = require("mongoose");

// Default markers used when a tracer row represents institution-wide totals
// rather than a single degree program / campus.
const ALL_PROGRAMS_LABEL = "All Programs";
const ALL_CAMPUSES_LABEL = "All Campuses";

const higherEducationTracerSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: [true, "Reporting year is required"],
    },
    programName: {
      type: String,
      trim: true,
      default: ALL_PROGRAMS_LABEL,
      index: true,
    },
    campusBranch: {
      type: String,
      trim: true,
      default: ALL_CAMPUSES_LABEL,
      index: true,
    },
    // Grouping label from the source workbook (e.g. "COLLEGE OF EDUCATION").
    // Optional because not every template carries a college column.
    collegeName: {
      type: String,
      trim: true,
      default: null,
    },
    graduateCount: {
      type: Number,
      default: 0,
      min: [0, "Graduate count cannot be negative"],
    },
    employabilityRate: {
      type: Number, // Decimal ratio (0.0 to 1.0)
      default: 0,
      min: 0,
      max: 1,
    },
    employedCount: {
      type: Number,
      default: 0,
      min: [0, "Employed count cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// A single employability tracer record per year, program, and campus. This
// replaces the previous one-record-per-year constraint so each academic
// program can carry its own outcome series.
higherEducationTracerSchema.index(
  { year: 1, programName: 1, campusBranch: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "HigherEducationTracer",
  higherEducationTracerSchema
);
