const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    // Verify token payload
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key",
    );

    // 💡 CRITICAL: This attaches the payload to req.user so authController can read req.user.id
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Token verification failed" });
  }
};

module.exports = { protect };
