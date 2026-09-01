const User = require("../models/user");
const jwt = require("jsonwebtoken");

// @desc    Authenticate User & Get Token
// @route   POST /api/v1/auth/login
exports.login = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email and password",
      });
    }

    // 2. Check if user exists (explicitly requesting the excluded password field)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // 3. Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, collegeId: user.collegeId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h", algorithm: "HS256" },
    );

    // 5. Send successful response to React frontend
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to authenticate at this time.",
    });
  }
};

// @desc    Register New User
// @route   POST /api/v1/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, collegeId } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedName || !normalizedEmail || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (password.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 10 characters.",
      });
    }

    const requestedRole = role || "executive";
    if (
      !["executive", "dean", "admin", "information_unit"].includes(
        requestedRole,
      )
    ) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: requestedRole,
      collegeId: collegeId || null,
    });

    // 2. Remove password from the response object for security
    const userResponse = user.toObject();
    delete userResponse.password;

    // 3. Send successful response
    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      user: userResponse,
    });
  } catch (error) {
    console.error("❌ Registration Error:", error.message);

    // Handle MongoDB Duplicate Email Error (Code 11000) cleanly
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "The submitted registration data is invalid.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during registration. Please try again.",
    });
  }
};

exports.getUserName = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Access Denied",
      });
    }

    const user = await User.findById(req.user.id).select("name role collegeId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      name: user.name || "Dr. Diosdado P. Zulueta",
      role: user.role || "staff", // 💡 CRITICAL FIX: Sends the role to the frontend payload
      collegeId: user.collegeId || null,
    });
  } catch (error) {
    console.error("❌ Get User Name Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching profile data.",
    });
  }
};
