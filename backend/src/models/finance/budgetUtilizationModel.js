const mongoose = require("mongoose");

const budgetUtilizationSchema = new mongoose.Schema(
  {
    fiscalYear: {
      type: Number,
      required: [true, "Fiscal year is required"],
      unique: true,
      index: true,
    },
    // Personnel Services (PS)
    psApproved: {
      type: Number,
      default: 0,
      min: [0, "PS Approved Allocation cannot be negative"],
    },
    psObligated: {
      type: Number,
      default: 0,
      min: [0, "PS Actual Obligations cannot be negative"],
    },
    // Maintenance and Other Operating Expenses (MOOE)
    mooeApproved: {
      type: Number,
      default: 0,
      min: [0, "MOOE Approved Allocation cannot be negative"],
    },
    mooeObligated: {
      type: Number,
      default: 0,
      min: [0, "MOOE Actual Obligations cannot be negative"],
    },
    // Capital Outlay (CO)
    coApproved: {
      type: Number,
      default: 0,
      min: [0, "CO Approved Allocation cannot be negative"],
    },
    coObligated: {
      type: Number,
      default: 0,
      min: [0, "CO Actual Obligations cannot be negative"],
    },
    // Target BUR Pace percentage threshold (e.g. 0.90 for 90.0%)
    targetPace: {
      type: Number,
      default: 0.90,
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for Total Allotment (Approved)
budgetUtilizationSchema.virtual("totalAllotment").get(function () {
  return (this.psApproved || 0) + (this.mooeApproved || 0) + (this.coApproved || 0);
});

// Virtual for Total Obligated
budgetUtilizationSchema.virtual("totalObligated").get(function () {
  return (this.psObligated || 0) + (this.mooeObligated || 0) + (this.coObligated || 0);
});

// Virtual for BUR Efficiency (Total Obligated / Total Allotment)
budgetUtilizationSchema.virtual("burEfficiency").get(function () {
  const totalAllotment = this.totalAllotment;
  if (!totalAllotment || totalAllotment === 0) return 0;
  return Math.round((this.totalObligated / totalAllotment) * 10000) / 10000;
});

module.exports = mongoose.model("BudgetUtilization", budgetUtilizationSchema);