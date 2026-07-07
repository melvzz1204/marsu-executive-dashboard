const mongoose = require("mongoose");

// Sub-document schema tracking individual department/college allocations
const CollegeMetricSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College", // Links to your master College collection
    required: true,
  },
  collegeCode: {
    type: String, // e.g., "CICS", "CE", "CED", "CIT", "CBMA" to cleanly plot axis labels
    required: true,
    trim: true,
    uppercase: true,
  },
  papersPublished: {
    type: Number,
    required: true,
    min: [0, "Publications cannot be negative"],
    default: 0,
  },
  grantsSecuredMillions: {
    type: Number, // Stored as a float decimal (e.g., 12.5 for ₱12.5M) to maximize processing scalability
    required: true,
    min: [0, "Funding allocations cannot be negative"],
    default: 0.0,
  },
});

// Main schema for Research Capital Performance Records
const ResearchAnalyticsSchema = new mongoose.Schema({
  fiscalYear: {
    type: Number,
    required: [true, "Please specify the reporting fiscal/academic year"],
    unique: true, // Ensures only one master record ledger handles a specific tracking year window
  },
  summaryKpis: {
    totalPapers: {
      type: Number, // Unified snapshot aggregate (e.g., 172)
      required: true,
      default: 0,
    },
    totalFundingMillions: {
      type: Number, // Combined fiscal aggregate (e.g., 32.8 for ₱32.8M)
      required: true,
      default: 0.0,
    },
  },
  departmentalBreakdown: [CollegeMetricSchema], // Array populating the clustered bar chart rows
  isConfidential: {
    type: Boolean,
    default: true, // Matches your visual dashboard baseline disclaimer watermark
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook middleware to auto-calculate the high-level KPI blocks from the array input array
ResearchAnalyticsSchema.pre("save", function () {
  if (this.departmentalBreakdown && this.departmentalBreakdown.length > 0) {
    this.summaryKpis.totalPapers = this.departmentalBreakdown.reduce(
      (sum, item) => sum + item.papersPublished, 
      0
    );
    
    const totalFunding = this.departmentalBreakdown.reduce(
      (sum, item) => sum + item.grantsSecuredMillions, 
      0
    );
    // Rounds out the floating point decimal safely to two places
    this.summaryKpis.totalFundingMillions = Math.round(totalFunding * 100) / 100;
  }
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("ResearchAnalytics", ResearchAnalyticsSchema);