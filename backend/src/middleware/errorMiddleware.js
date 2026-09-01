const multer = require("multer");

const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} was not found.`,
  });
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || error.status || 500;
  let message = "An unexpected server error occurred.";

  if (error instanceof multer.MulterError) {
    statusCode = 400;
    message =
      error.code === "LIMIT_FILE_SIZE"
        ? `The uploaded file exceeds the ${req.originalUrl.includes("achievement-posts") ? "15 MB" : "10 MB"} limit.`
        : error.message;
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = "The submitted data is invalid.";
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "A supplied identifier or value is invalid.";
  } else if (error.code === 11000) {
    statusCode = 409;
    message = "A record with the same unique values already exists.";
  } else if (statusCode < 500 && error.message) {
    message = error.message;
  }

  if (statusCode >= 500) {
    console.error("Unhandled request error", {
      method: req.method,
      path: req.originalUrl,
      message: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }

  return res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? "Internal Server Error" : "Request Failed",
    message,
  });
};

module.exports = { notFound, errorHandler };
