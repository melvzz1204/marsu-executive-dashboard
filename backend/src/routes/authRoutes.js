const { protect, authorize } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const {
  login,
  register,
  getUserName,
} = require("../controllers/authController");

router.post("/login", login);
router.post("/register", protect, authorize("admin"), register);
router.get("/name", protect, getUserName);

module.exports = router;
