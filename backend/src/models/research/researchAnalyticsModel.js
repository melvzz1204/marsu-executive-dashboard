const mongoose = require("mongoose");

const researchPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Research title is required"],
      trim: true,
    },
    authors: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    year: {
      type: Number,
      required: [true, "Publication/Presentation year is required"],
      index: true,
    },
    scope: {
      type: String,
      required: true,
      enum: [
        "International",
        "National",
        "Regional",
        "Local",
        "International Scope",
        "National Scope",
        "Regional Scope",
      ],
      default: "Regional Scope",
    },
    conferenceOrJournal: {
      type: String,
      trim: true,
      default: "N/A",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Social Perception",
        "Qualitative Study",
        "Impact Analysis",
        "Model Development",
        "Other",
      ],
      default: "Other",
    },
    venue: {
      type: String,
      trim: true,
      default: "N/A",
    },
    durationDays: {
      type: Number,
      default: 0,
      min: [0, "Duration cannot be negative"],
    },
    status: {
      type: String,
      enum: ["COMPLETED", "ONGOING", "PUBLISHED", "UNDER_REVIEW"],
      default: "COMPLETED",
    },

    // --- Research Lifecycle & IP Fields ---
    proposalStatus: {
      type: String,
      trim: true,
      enum: ["Approved", "Pending", "Disapproved", "Under Review", "N/A"],
      default: "N/A",
    },
    completionStatus: {
      type: String,
      trim: true,
      enum: ["Completed", "Ongoing", "Terminated", "N/A"],
      default: "N/A",
    },
    presentationStage: {
      type: String,
      trim: true,
      default: "N/A", // Matches Presentation_Stage in Excel (e.g., International, National, Regional, Institutional)
    },
    presentationForumVenue: {
      type: String,
      trim: true,
      default: "N/A", // Matches "Presentation Forum / Venue" header in Excel
    },
    publicationStatus: {
      type: String,
      trim: true,
      enum: ["Published", "Unpublished", "Under Review", "Accepted", "N/A"],
      default: "N/A",
    },
    intellectualPropertyTypeAcquired: {
      type: String,
      trim: true,
      enum: [
        "Patents",
        "Copyrighted",
        "Patented",
        "Utility Model",
        "Trademark",
        "None",
        "N/A",
      ],
      default: "None",
    },

    // --- Dynamic Metric Calculation Flags (Auto-calculated during save/upload) ---
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPresenting: {
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

    // --- Institutional & Financial Fields ---
    collegeCode: {
      type: String, // e.g., "CICS", "CE", "CED", "CIT", "CBMA"
      required: [true, "College code is required"],
      trim: true,
      uppercase: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: false,
    },
    fundingGrantMillions: {
      type: Number, // Stored as decimal (e.g., 2.5 for ₱2.5M)
      default: 0.0,
      min: [0, "Funding allocation cannot be negative"],
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save Middleware: Automatically compute summary flags based on input data.
 * This ensures that counting operations during analytics queries can run fast indexes.
 */
researchPaperSchema.pre("save", async function () {
  this.isCompleted =
    this.completionStatus === "Completed" || this.status === "COMPLETED";

  this.isPresenting = Boolean(
    (this.presentationStage && this.presentationStage !== "N/A") ||
    (this.presentationForumVenue && this.presentationForumVenue !== "N/A")
  );

  this.isPublished =
    this.publicationStatus === "Published" || this.status === "PUBLISHED";

  this.hasIntellectualProperty = Boolean(
    this.intellectualPropertyTypeAcquired &&
    !["None", "N/A", ""].includes(this.intellectualPropertyTypeAcquired)
  );
});

// Search Index for fast keyword querying
researchPaperSchema.index({
  title: "text",
  authors: "text",
  presentationForumVenue: "text",
});

module.exports = mongoose.model("ResearchPaper", researchPaperSchema);