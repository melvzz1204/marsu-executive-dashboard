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

// 🔑 ADDED: Role authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    // Ensure req.user exists and its role is included in the allowed roles array
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || "unknown"}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
