const mongoose = require("mongoose");

const uploadLogSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: ["ENROLLMENT", "HIGHER_EDUCATION", "RESEARCH_EXTENSION", "SYSTEM"],
      default: "ENROLLMENT",
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: String,
      default: "0 KB",
    },
    uploadedBy: {
      type: String,
      default: "System Admin",
    },
    status: {
      type: String,
      enum: [
        "SUCCESS",
        "FAILED",
        "DUPLICATE_BLOCK",
        "PARTIAL_SUCCESS",
        "OVERWRITE",
      ],
      required: true,
    },
    groupsProcessed: {
      type: Number,
      default: 0,
    },
    recordsProcessed: {
      type: Number,
      default: 0,
    },
    targetYear: {
      type: String,
      default: null,
    },
    semester: {
      type: String,
      default: null,
    },
    isOverwrite: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("UploadLog", uploadLogSchema);
