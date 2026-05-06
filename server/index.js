require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const passport = require("passport");
const connectDB = require("./config/db");
require("./config/passport");

const authRoutes = require("./routes/auth");
const generateRoutes = require("./routes/generate");
const postsRoutes = require("./routes/posts");
const analyticsRoutes = require("./routes/analytics");
const { globalLimiter } = require("./middleware/rateLimiter");

// Init scheduler
const { initScheduler } = require("./jobs/postPublisher");

const app = express();

// Connect DB (Disabled for local storage mode)
// connectDB();


// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(globalLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  initScheduler();
});
 
