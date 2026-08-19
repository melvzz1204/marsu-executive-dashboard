const mongoose = require("mongoose");

const licensureExamSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: [true, "Exam year is required"],
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category/Discipline is required"],
      trim: true,
    },
    programName: {
      type: String,
      required: [true, "Program or Examination name is required"],
      trim: true,
    },
    takers: {
      type: Number,
      default: 0,
      min: 0,
    },
    passed: {
      type: Number,
      default: 0,
      min: 0,
    },
    passingRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1, // e.g. 0.9130 for 91.30%
    },
    isNda: {
      type: Boolean,
      default: false, // True for pending/NDA results
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per program per year
licensureExamSchema.index({ year: 1, programName: 1 }, { unique: true });

module.exports = mongoose.model("LicensureExam", licensureExamSchema);