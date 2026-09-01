const mongoose = require("mongoose");

const SDG_VALUES = Array.from({ length: 17 }, (_, index) => index + 1);
const POST_STATUSES = ["pending", "approved", "rejected"];

const AchievementImageSchema = new mongoose.Schema(
  {
    data: {
      type: Buffer,
      required: true,
      select: false,
    },
    contentType: {
      type: String,
      required: true,
      enum: ["image/jpeg", "image/png", "image/webp"],
    },
    filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "Achievement post image",
    },
  },
  { _id: true },
);

const AchievementAttachmentSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true, select: false },
    contentType: { type: String, required: true },
    filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    size: { type: Number, required: true },
  },
  { _id: true },
);

const ReviewSchema = new mongoose.Schema(
  {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { _id: false },
);

const AchievementPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A title is required."],
      trim: true,
      minlength: 5,
      maxlength: 160,
    },
    subtitle: {
      type: String,
      required: [true, "A subtitle is required."],
      trim: true,
      minlength: 5,
      maxlength: 240,
    },
    body: {
      type: String,
      required: [true, "Post content is required."],
      trim: true,
      minlength: 30,
      maxlength: 10000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Academic Excellence",
        "Research and Innovation",
        "Awards and Recognition",
        "Community Engagement",
        "Student Achievement",
        "Faculty Achievement",
        "Partnerships",
        "Sustainability",
        "Other",
      ],
      default: "Awards and Recognition",
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 10,
        message: "A post can contain no more than 10 tags.",
      },
    },
    sdgs: {
      type: [Number],
      default: [],
      validate: [
        {
          validator: (sdgs) => sdgs.length <= 17,
          message: "Too many SDG selections.",
        },
        {
          validator: (sdgs) => sdgs.every((sdg) => SDG_VALUES.includes(sdg)),
          message: "SDG selections must be between 1 and 17.",
        },
      ],
    },
    eventDate: {
      type: Date,
      required: [true, "The achievement date is required."],
    },
    location: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },
    sourceUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    images: {
      type: [AchievementImageSchema],
      validate: {
        validator: (images) => images.length >= 1 && images.length <= 10,
        message: "Upload between 1 and 10 images.",
      },
    },
    attachment: {
      type: AchievementAttachmentSchema,
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: POST_STATUSES,
      default: "pending",
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    review: {
      type: ReviewSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

AchievementPostSchema.index({ status: 1, publishedAt: -1 });
AchievementPostSchema.index({
  title: "text",
  subtitle: "text",
  body: "text",
  tags: "text",
});

module.exports = mongoose.model("AchievementPost", AchievementPostSchema);
module.exports.POST_STATUSES = POST_STATUSES;
