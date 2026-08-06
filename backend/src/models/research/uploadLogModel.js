const mongoose = require("mongoose");

const uploadLogSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: String,
    default: "0 KB",
  },
  uploadedBy: {
    type: String,
    default: "System Admin",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  targetYear: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    required: true,
  },
  recordsProcessed: {
    type: Number,
    default: 0,
  },
  isOverwrite: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("ResearchUploadLog", uploadLogSchema);