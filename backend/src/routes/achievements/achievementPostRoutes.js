const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const { achievementUpload } = require("../../middleware/uploadMiddleware");
const {
  createPost,
  getMyPosts,
  getReviewQueue,
  reviewPost,
  getPublishedPosts,
  getPost,
  getImage,
  getAttachment,
} = require("../../controllers/achievements/achievementPostController");

const router = express.Router();

router.use(protect);
router.get(
  "/published",
  authorize("executive", "dean", "admin", "information_unit"),
  getPublishedPosts,
);
router.get("/mine", authorize("dean"), getMyPosts);
router.get("/review", authorize("information_unit"), getReviewQueue);
router.post(
  "/",
  authorize("dean"),
  achievementUpload.fields([
    { name: "images", maxCount: 10 },
    { name: "attachment", maxCount: 1 },
  ]),
  createPost,
);
router.patch("/:id/review", authorize("information_unit"), reviewPost);
router.get(
  "/:id/attachment",
  authorize("executive", "dean", "admin", "information_unit"),
  getAttachment,
);
router.get(
  "/:id/images/:imageId",
  authorize("executive", "dean", "admin", "information_unit"),
  getImage,
);
router.get(
  "/:id",
  authorize("executive", "dean", "admin", "information_unit"),
  getPost,
);

module.exports = router;
