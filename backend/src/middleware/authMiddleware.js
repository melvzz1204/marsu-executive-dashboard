const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    let token;

    if (authorization) {
      const [scheme, credentials, extra] = authorization.trim().split(/\s+/);
      if (scheme === "Bearer" && credentials && !extra) {
        token = credentials;
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    if (!process.env.JWT_SECRET) {
      const error = new Error("JWT configuration is unavailable.");
      error.statusCode = 500;
      return next(error);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: "Token payload is invalid",
      });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Token verification failed" });
  }
};

// ADDED: Role authorization middleware
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
