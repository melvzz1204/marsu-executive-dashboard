const mongoose = require("mongoose");

const higherEducationSchema = new mongoose.Schema(
  {
    campusBranch: {
      type: String,
      required: [true, "Campus/Branch is required"],
      trim: true,
    },
    programName: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
    },
    yearInitialOperation: {
      type: String,
      trim: true,
      default: "N/A",
    },
    accreditationStatus: {
      type: String,
      trim: true,
      default: "Not Accredited",
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isAccredited: {
      type: Boolean,
      default: false,
    },
    reviewStatus: {
      type: String,
      enum: ["Up To Date", "Review Overdue", "Pending Renewal", "N/A"],
      default: "N/A",
    },
  },
  {
    timestamps: true,
  }
);

// List of statuses that are NOT considered accredited
const NON_ACCREDITED_STATUSES = [
  "Not Accredited",
  "Candidate Status",
  "In Progress",
  "For Phase-out",
  "N/A",
  "",
];

// Helper calculation function
const computeStatusFields = (accreditationStatus, endDate) => {
  const isAccredited = Boolean(
    accreditationStatus && !NON_ACCREDITED_STATUSES.includes(accreditationStatus.trim())
  );

  const today = new Date();
  let reviewStatus = "N/A";

  if (endDate && isAccredited) {
    if (new Date(endDate) < today) {
      reviewStatus = "Review Overdue";
    } else {
      reviewStatus = "Up To Date";
    }
  }

  return { isAccredited, reviewStatus };
};

// Compound index for unique records per Campus and Program
higherEducationSchema.index({ campusBranch: 1, programName: 1 }, { unique: true });

// Pre-save hook for status tagging
higherEducationSchema.pre("save", function () {
  const { isAccredited, reviewStatus } = computeStatusFields(
    this.accreditationStatus,
    this.endDate
  );
  this.isAccredited = isAccredited;
  this.reviewStatus = reviewStatus;
});

// Pre-findOneAndUpdate hook
higherEducationSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (!update) return;

  const doc = update.$set ? update.$set : update;

  const accreditationStatus = doc.accreditationStatus;
  const endDate = doc.endDate;

  const { isAccredited, reviewStatus } = computeStatusFields(accreditationStatus, endDate);

  if (update.$set) {
    update.$set.isAccredited = isAccredited;
    update.$set.reviewStatus = reviewStatus;
  } else {
    doc.isAccredited = isAccredited;
    doc.reviewStatus = reviewStatus;
  }
});

module.exports = mongoose.model("HigherEducation", higherEducationSchema);