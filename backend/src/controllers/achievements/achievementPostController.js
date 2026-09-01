const mongoose = require("mongoose");
const AchievementPost = require("../../models/achievements/achievementPostModel");

const VALID_CATEGORIES = new Set([
  "Academic Excellence",
  "Research and Innovation",
  "Awards and Recognition",
  "Community Engagement",
  "Student Achievement",
  "Faculty Achievement",
  "Partnerships",
  "Sustainability",
  "Other",
]);

const cleanText = (value, maxLength = 10000) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const parseList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value.split(",");
  } catch {
    return value.split(",");
  }
};

const parseTags = (value) =>
  [
    ...new Set(
      parseList(value)
        .map((tag) => cleanText(String(tag), 40).toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 10);

const parseSdgs = (value) => [
  ...new Set(
    parseList(value)
      .map(Number)
      .filter((sdg) => Number.isInteger(sdg) && sdg >= 1 && sdg <= 17),
  ),
];

const imageMetadata = (post) =>
  (post.images || []).map((image) => ({
    id: image._id,
    filename: image.filename,
    contentType: image.contentType,
    altText: image.altText,
    url: `/achievement-posts/${post._id}/images/${image._id}`,
  }));

const attachmentMetadata = (post) =>
  post.attachment
    ? {
        id: post.attachment._id,
        filename: post.attachment.filename,
        contentType: post.attachment.contentType,
        size: post.attachment.size,
        url: `/achievement-posts/${post._id}/attachment`,
      }
    : null;

const serializePost = (post) => {
  const source = post.toObject ? post.toObject() : post;
  const { attachment: _attachment, ...safeSource } = source;
  return {
    ...safeSource,
    images: imageMetadata(source),
    attachment: attachmentMetadata(source),
  };
};

const validatePayload = (req, requireImages = true) => {
  const title = cleanText(req.body.title, 160);
  const subtitle = cleanText(req.body.subtitle, 240);
  const body = cleanText(req.body.body, 10000);
  const category = cleanText(req.body.category, 80) || "Awards and Recognition";
  const eventDate = new Date(req.body.eventDate);
  const location = cleanText(req.body.location, 180);
  const sourceUrl = cleanText(req.body.sourceUrl, 500);
  const tags = parseTags(req.body.tags);
  const sdgs = parseSdgs(req.body.sdgs);

  if (title.length < 5 || subtitle.length < 5 || body.length < 30) {
    return {
      error:
        "Title and subtitle need at least 5 characters, and the body needs at least 30 characters.",
    };
  }
  if (!VALID_CATEGORIES.has(category))
    return { error: "Select a valid achievement category." };
  if (Number.isNaN(eventDate.getTime()))
    return { error: "Provide a valid achievement date." };
  if (eventDate.getTime() > Date.now() + 24 * 60 * 60 * 1000)
    return { error: "Achievement date cannot be in the future." };
  const imageFiles = req.files?.images || [];
  if (requireImages && imageFiles.length === 0)
    return { error: "Upload at least one image." };
  if (imageFiles.length > 10)
    return { error: "Upload no more than 10 images." };
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      if (!["http:", "https:"].includes(url.protocol))
        throw new Error("Invalid protocol");
    } catch {
      return { error: "Source URL must be a valid HTTP or HTTPS address." };
    }
  }

  return {
    title,
    subtitle,
    body,
    category,
    eventDate,
    location,
    sourceUrl,
    tags,
    sdgs,
  };
};

const canManagePost = (req, post) =>
  req.user.role === "information_unit" ||
  post.author?._id?.toString() === req.user.id ||
  post.author?.toString() === req.user.id;

exports.createPost = async (req, res, next) => {
  try {
    const payload = validatePayload(req);
    if (payload.error)
      return res.status(400).json({ success: false, message: payload.error });

    const uploadedFiles = [
      ...(req.files.images || []),
      ...(req.files.attachment || []),
    ];
    const totalUploadSize = uploadedFiles.reduce(
      (total, file) => total + file.size,
      0,
    );
    if (totalUploadSize > 15 * 1024 * 1024)
      return res.status(400).json({
        success: false,
        message: "Images and attachment must not exceed 15 MB in total.",
      });

    const images = req.files.images.map((file, index) => ({
      data: file.buffer,
      contentType: file.mimetype,
      filename: cleanText(file.originalname, 150),
      altText: `${payload.title} image ${index + 1}`,
    }));
    const attachmentFile = req.files.attachment?.[0];
    const attachment = attachmentFile
      ? {
          data: attachmentFile.buffer,
          contentType: attachmentFile.mimetype,
          filename: cleanText(attachmentFile.originalname, 180),
          size: attachmentFile.size,
        }
      : null;

    const post = await AchievementPost.create({
      ...payload,
      images,
      attachment,
      author: req.user.id,
      collegeId: req.user.collegeId || null,
      status: "pending",
      submittedAt: new Date(),
    });
    await post.populate("author", "name role collegeId");

    return res.status(201).json({
      success: true,
      message: "Achievement submitted to the Information Unit for review.",
      post: serializePost(post),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMyPosts = async (req, res, next) => {
  try {
    const posts = await AchievementPost.find({ author: req.user.id })
      .select("-images.data -attachment.data")
      .populate("author", "name role collegeId")
      .populate("review.reviewedBy", "name role")
      .sort({ createdAt: -1 });
    return res.json({ success: true, posts: posts.map(serializePost) });
  } catch (error) {
    return next(error);
  }
};

exports.getReviewQueue = async (req, res, next) => {
  try {
    const requestedStatus = cleanText(req.query.status, 20);
    const query =
      requestedStatus &&
      ["pending", "approved", "rejected"].includes(requestedStatus)
        ? { status: requestedStatus }
        : {};
    const posts = await AchievementPost.find(query)
      .select("-images.data -attachment.data")
      .populate("author", "name email role collegeId")
      .populate("review.reviewedBy", "name role")
      .sort({ status: 1, submittedAt: -1 });
    return res.json({ success: true, posts: posts.map(serializePost) });
  } catch (error) {
    return next(error);
  }
};

exports.reviewPost = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid post ID." });
    const decision = cleanText(req.body.decision, 20).toLowerCase();
    const feedback = cleanText(req.body.feedback, 1000);
    if (!["approved", "rejected"].includes(decision))
      return res.status(400).json({
        success: false,
        message: "Decision must be approved or rejected.",
      });
    if (decision === "rejected" && feedback.length < 10)
      return res.status(400).json({
        success: false,
        message:
          "Provide at least 10 characters of feedback when rejecting a post.",
      });

    const post = await AchievementPost.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Achievement post not found." });

    post.status = decision;
    post.publishedAt = decision === "approved" ? new Date() : null;
    post.review = { reviewedBy: req.user.id, reviewedAt: new Date(), feedback };
    await post.save();
    await post.populate("author", "name email role collegeId");
    await post.populate("review.reviewedBy", "name role");

    return res.json({
      success: true,
      message:
        decision === "approved"
          ? "Achievement approved and published."
          : "Achievement returned to the dean with feedback.",
      post: serializePost(post),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPublishedPosts = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const posts = await AchievementPost.find({ status: "approved" })
      .select("-images.data -attachment.data -review")
      .populate("author", "name collegeId")
      .sort({ publishedAt: -1 })
      .limit(limit);
    return res.json({ success: true, posts: posts.map(serializePost) });
  } catch (error) {
    return next(error);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid post ID." });
    const post = await AchievementPost.findById(req.params.id)
      .select("-images.data -attachment.data")
      .populate("author", "name email role collegeId")
      .populate("review.reviewedBy", "name role");
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Achievement post not found." });
    if (post.status !== "approved" && !canManagePost(req, post))
      return res
        .status(403)
        .json({ success: false, message: "You cannot view this post." });
    return res.json({ success: true, post: serializePost(post) });
  } catch (error) {
    return next(error);
  }
};

exports.getImage = async (req, res, next) => {
  try {
    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !mongoose.isValidObjectId(req.params.imageId)
    )
      return res
        .status(400)
        .json({ success: false, message: "Invalid image ID." });
    const post = await AchievementPost.findById(req.params.id).select(
      "+images.data",
    );
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Achievement post not found." });
    if (post.status !== "approved" && !canManagePost(req, post))
      return res
        .status(403)
        .json({ success: false, message: "You cannot view this image." });
    const image = post.images.id(req.params.imageId);
    if (!image)
      return res
        .status(404)
        .json({ success: false, message: "Image not found." });
    res.set({
      "Content-Type": image.contentType,
      "Content-Length": image.data.length,
      "Cache-Control":
        post.status === "approved"
          ? "public, max-age=86400"
          : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    return res.send(image.data);
  } catch (error) {
    return next(error);
  }
};

exports.getAttachment = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid post ID." });
    const post = await AchievementPost.findById(req.params.id).select(
      "+attachment.data",
    );
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Achievement post not found." });
    if (post.status !== "approved" && !canManagePost(req, post))
      return res
        .status(403)
        .json({ success: false, message: "You cannot view this attachment." });
    if (!post.attachment?.data)
      return res
        .status(404)
        .json({ success: false, message: "Attachment not found." });

    res.set({
      "Content-Type": post.attachment.contentType,
      "Content-Length": post.attachment.data.length,
      "Content-Disposition": `attachment; filename="${post.attachment.filename.replace(/["\\]/g, "_")}"`,
      "Cache-Control":
        post.status === "approved"
          ? "public, max-age=86400"
          : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    return res.send(post.attachment.data);
  } catch (error) {
    return next(error);
  }
};
