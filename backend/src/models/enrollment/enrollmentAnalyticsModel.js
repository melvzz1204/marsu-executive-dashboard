const mongoose = require("mongoose");

// 1. Sub-document tracking student headcount metrics per individual degree program
const ProgramEnrollmentSchema = new mongoose.Schema({
  programName: {
    type: String, // e.g., "Bachelor of Science in Civil Engineering"
    required: true,
    trim: true,
  },
  programCode: {
    type: String, // e.g., "BSCE", "BSIT"
    required: true,
    trim: true,
  },
  department: {
    type: String, // e.g., "Technology", "Business", "Engineering"
    required: true,
    trim: true,
  },
  semester: {
    type: String, // e.g., "1st Semester", "2nd Semester"
    default: "1st Semester",
    trim: true,
  },
  studentCount: {
    type: Number, // Total combined enrollment headcount for this course
    required: true,
    min: [0, "Student count cannot be negative"],
    default: 0,
  },
  isPriorityProgram: {
    type: Boolean, // True if listed under CHED/RDC priority columns, false if "NEITHER"
    required: true,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// 2. Main schema capturing a campus snapshot for a specific Academic Year & Semester
const EnrollmentAnalyticsSchema = new mongoose.Schema({
  academicYear: {
    type: Number, // e.g., 2021 (Represents AY 2021-2022)
    required: [true, "Academic Year tracker is required"],
  },
  campus: {
    type: String, // e.g., "Boac", "Gasan", "Santa Cruz", "Torrijos"
    required: [true, "Campus location filter is required"],
    trim: true,
  },
  semester: {
    type: String, // e.g., "1st Semester", "2nd Semester"
    required: [true, "Semester is required"],
    default: "1st Semester",
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
      type: Number, // Pre-computes the key institutional report mandate percentage
      default: 0.0,
    },
  },
  programs: [ProgramEnrollmentSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index ensuring only one document governs a campus-year-semester combo
EnrollmentAnalyticsSchema.index(
  { academicYear: 1, campus: 1, semester: 1 },
  { unique: true }
);

// Pre-save lifecycle automation engine to calculate summary blocks dynamically
EnrollmentAnalyticsSchema.pre("save", async function () {
  if (this.programs && this.programs.length > 0) {
    // 1. Calculate Active Program Count & Total Headcount
    this.summaryKpis.activeProgramsCount = this.programs.filter(p => p.isActive).length;
    this.summaryKpis.totalStudents = this.programs.reduce((sum, p) => sum + p.studentCount, 0);

    // 2. Automatically locate and map the largest program details
    const peakProgram = [...this.programs].sort((a, b) => b.studentCount - a.studentCount)[0];
    this.summaryKpis.largestProgramName = peakProgram ? peakProgram.programName : "N/A";

    // 3. Compute percentage of students in CHED/RDC priority tracks
    const priorityStudentCount = this.programs
      .filter(p => p.isPriorityProgram)
      .reduce((sum, p) => sum + p.studentCount, 0);

    if (this.summaryKpis.totalStudents > 0) {
      const priorityRatio = (priorityStudentCount / this.summaryKpis.totalStudents) * 100;
      this.summaryKpis.priorityEnrollmentPercentage = Math.round(priorityRatio * 10) / 10; // e.g., 72.9
    } else {
      this.summaryKpis.priorityEnrollmentPercentage = 0.0;
    }
  }

  // 4. Automated YoY Growth Percentage tracking lookup logic
  try {
    const previousYearRecord = await this.constructor.findOne({
      academicYear: this.academicYear - 1,
      campus: this.campus,
      semester: this.semester,
    }).lean();

    if (previousYearRecord && previousYearRecord.summaryKpis && previousYearRecord.summaryKpis.totalStudents > 0) {
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

module.exports = mongoose.model("EnrollmentAnalytics", EnrollmentAnalyticsSchema);