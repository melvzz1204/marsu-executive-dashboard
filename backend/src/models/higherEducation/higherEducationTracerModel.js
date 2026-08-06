const mongoose = require("mongoose");

const higherEducationTracerSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: [true, "Reporting year is required"],
      unique: true,
      index: true,
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

module.exports = mongoose.model("HigherEducationTracer", higherEducationTracerSchema);