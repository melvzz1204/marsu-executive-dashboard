require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const app = require("./src/app");

const PORT = Number(process.env.PORT) || 5000;
let server;
let isShuttingDown = false;

const validateEnvironment = () => {
  const required = ["MONGO_URI", "JWT_SECRET"];

  if (process.env.NODE_ENV === "production") {
    required.push("CORS_ORIGINS");
  }
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received. Shutting down gracefully.`);

  const forceExitTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.connection.close();
  process.exit(0);
};

const start = async () => {
  validateEnvironment();
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  shutdown("unhandledRejection");
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});

start().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});
