const mongoose = require("mongoose");

// Sub-schema for program-level employability details
const programEmployabilitySchema = new mongoose.Schema(
  {
    college: {
      type: String,
      trim: true,
      // e.g. "COLLEGE OF EDUCATION", "COLLEGE OF ENGINEERING"
    },
    programName: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
      // e.g. "BACHELOR OF SECONDARY EDUCATION"
    },
    totalGraduates: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEmployed: {
      type: Number,
      default: 0,
      min: 0,
    },
    employmentRate: {
      type: Number, // Decimal ratio (0.0 to 1.0)
      default: 0,
      min: 0,
      max: 1,
    },
  },
  { _id: true }
);

const higherEducationTracerSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: [true, "Reporting year is required"],
      unique: true,
      index: true,
    },
    // Institutional Totals (Summary)
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
    // Granular Per-Program Breakdown
    programBreakdown: [programEmployabilitySchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to auto-calculate overall rate if not explicitly supplied
higherEducationTracerSchema.virtual("calculatedEmployabilityRate").get(function () {
  if (!this.graduateCount || this.graduateCount === 0) return 0;
  return Math.round((this.employedCount / this.graduateCount) * 10000) / 10000;
});

module.exports = mongoose.model(
  "HigherEducationTracer",
  higherEducationTracerSchema
);