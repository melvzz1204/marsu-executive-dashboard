const User = require("../models/user");
const jwt = require("jsonwebtoken");

// @desc    Authenticate User & Get Token
// @route   POST /api/v1/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input fields
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

    // 4. Create JSON Web Token (JWT)
    const token = jwt.sign(
      { id: user._id, role: user.role, collegeId: user.collegeId }, // Explicitly naming the key "collegeId"
        process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "30d" },
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register New User
// @route   POST /api/v1/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Create the user in MongoDB Atlas
    const user = await User.create({ name, email, password, role, collegeId });

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

    // Handle general validation or server errors
    return res.status(500).json({
      success: false,
      message: "Server error during registration. Please try again.",
      error: error.message,
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

    // 💡 CRITICAL FIX: Make sure "role" is added here inside the select string!
    const user = await User.findById(req.user.id).select("name role");

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
