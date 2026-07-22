const mongoose = require("mongoose");

// 1. Sub-document tracking student headcount metrics per individual degree program
const ProgramEnrollmentSchema = new mongoose.Schema({
  programName: {
    type: String,
    required: true,
    trim: true,
  },
  programCode: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  studentCount: {
    type: Number,
    required: true,
    min: [0, "Student count cannot be negative"],
    default: 0,
  },
  isPriorityProgram: {
    type: Boolean,
    required: true,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// 2. Main schema capturing a campus snapshot for a specific Academic Year
const EnrollmentAnalyticsSchema = new mongoose.Schema({
  academicYear: {
    type: Number, // e.g., 2021
    required: [true, "Academic Year tracker is required"],
  },
  // 💡 ADDED: Semester field to resolve strict schema validation error
  semester: {
    type: String,
    default: "1st Sem",
    trim: true,
  },
  campus: {
    type: String,
    required: [true, "Campus location filter is required"],
    trim: true,
  },
  summaryKpis: {
    totalStudents: {
      type: Number,
      default: 0,
    },
    yoYGrowthPercentage: {
      type: Number,
      default: 0.0,
    },
    activeProgramsCount: {
      type: Number,
      default: 0,
    },
    largestProgramName: {
      type: String,
      default: "N/A",
    },
    priorityEnrollmentPercentage: {
      type: Number,
      default: 0.0,
    },
  },
  programs: [ProgramEnrollmentSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index ensuring only one record exists per campus-year-semester window
EnrollmentAnalyticsSchema.index(
  { academicYear: 1, campus: 1, semester: 1 },
  { unique: true },
);

// Pre-save lifecycle automation engine
EnrollmentAnalyticsSchema.pre("save", async function () {
  if (this.programs && this.programs.length > 0) {
    this.summaryKpis.activeProgramsCount = this.programs.filter(
      (p) => p.isActive,
    ).length;
    this.summaryKpis.totalStudents = this.programs.reduce(
      (sum, p) => sum + p.studentCount,
      0,
    );

    const peakProgram = [...this.programs].sort(
      (a, b) => b.studentCount - a.studentCount,
    )[0];
    this.summaryKpis.largestProgramName = peakProgram
      ? peakProgram.programName
      : "N/A";

    const priorityStudentCount = this.programs
      .filter((p) => p.isPriorityProgram)
      .reduce((sum, p) => sum + p.studentCount, 0);

    if (this.summaryKpis.totalStudents > 0) {
      const priorityRatio =
        (priorityStudentCount / this.summaryKpis.totalStudents) * 100;
      this.summaryKpis.priorityEnrollmentPercentage =
        Math.round(priorityRatio * 10) / 10;
    } else {
      this.summaryKpis.priorityEnrollmentPercentage = 0.0;
    }
  }

  try {
    const previousYearRecord = await this.constructor
      .findOne({
        academicYear: this.academicYear - 1,
        campus: this.campus,
        semester: this.semester,
      })
      .lean();

    if (
      previousYearRecord &&
      previousYearRecord.summaryKpis &&
      previousYearRecord.summaryKpis.totalStudents > 0
    ) {
      const pastTotal = previousYearRecord.summaryKpis.totalStudents;
      const currentTotal = this.summaryKpis.totalStudents;
      const growth = ((currentTotal - pastTotal) / pastTotal) * 100;
      this.summaryKpis.yoYGrowthPercentage = Math.round(growth * 10) / 10;
    } else {
      this.summaryKpis.yoYGrowthPercentage = 0.0;
    }
  } catch (err) {
    this.summaryKpis.yoYGrowthPercentage = 0.0;
  }

  this.updatedAt = Date.now();
});

module.exports = mongoose.model(
  "EnrollmentAnalytics",
  EnrollmentAnalyticsSchema,
);
