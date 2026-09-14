const mongoose = require("mongoose");

const researchPaperSchema = new mongoose.Schema(
  {
    // 1. College_Unit
    collegeUnit: {
      type: String,
      trim: true,
      default: "N/A",
    },
    collegeCode: {
      type: String, // Derived short code (e.g., CICS, CBMA, CA)
      trim: true,
      uppercase: true,
      default: "N/A",
    },

    // 2. Academic_Program
    academicProgram: {
      type: String,
      trim: true,
      default: "N/A",
    },

    // 3. Research_Title
    title: {
      type: String,
      required: [true, "Research title is required"],
      trim: true,
    },

    // 4. Lead Researcher / Authors
    authors: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    // 5. Year
    year: {
      type: Number,
      required: [true, "Publication/Presentation year is required"],
      index: true,
    },

    // 6. Completion_Status
    completionStatus: {
      type: String,
      trim: true,
      default: "N/A",
    },

    // 7. Publication_Status
    publicationStatus: {
      type: String,
      trim: true,
      default: "N/A",
    },

    // 8. Title of Journal
    titleOfJournal: {
      type: String,
      trim: true,
      default: "N/A",
    },

    // 9. Intelectual_Property_Type_Acquired
    intellectualPropertyTypeAcquired: {
      type: String,
      trim: true,
      default: "None",
    },

    // --- Dynamic Metric Calculation Flags ---
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasIntellectualProperty: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-validation Middleware: Automatically computes boolean indicator flags prior to save.
 */
researchPaperSchema.pre("validate", function () {
  const compStatus = (this.completionStatus || "").toLowerCase();
  this.isCompleted = compStatus === "completed";

  const pubStatus = (this.publicationStatus || "").toLowerCase();
  this.isPublished = pubStatus === "published";

  const ipType = (this.intellectualPropertyTypeAcquired || "").toLowerCase();
  this.hasIntellectualProperty = Boolean(
    ipType && !["none", "n/a", ""].includes(ipType)
  );
});

// Text index for search functionality
researchPaperSchema.index({
  title: "text",
  authors: "text",
  collegeUnit: "text",
  academicProgram: "text",
  titleOfJournal: "text",
});

module.exports = mongoose.model("ResearchPaper", researchPaperSchema);