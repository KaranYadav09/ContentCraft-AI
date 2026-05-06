const express = require("express");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const User = require("../models/User");
const { generateToken, protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// POST /api/auth/register
router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { name, email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ success: false, message: "Email already registered" });

      const user = await User.create({ name, email, password });
      const token = generateToken(user._id);
      res.status(201).json({ success: true, token, user });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
      const token = generateToken(user._id);
      res.json({ success: true, token, user });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// PATCH /api/auth/me
router.patch("/me", protect, async (req, res) => {
  try {
    const allowed = ["name", "avatar", "preferences"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Twitter OAuth
router.get("/twitter", protect, passport.authenticate("twitter"));
router.get(
  "/twitter/callback",
  passport.authenticate("twitter", { session: false, failureRedirect: `${process.env.CLIENT_URL}/settings?error=twitter` }),
  (req, res) => res.redirect(`${process.env.CLIENT_URL}/settings?connected=twitter`)
);

// LinkedIn OAuth
router.get("/linkedin", protect, passport.authenticate("linkedin"));
router.get(
  "/linkedin/callback",
  passport.authenticate("linkedin", { session: false, failureRedirect: `${process.env.CLIENT_URL}/settings?error=linkedin` }),
  (req, res) => res.redirect(`${process.env.CLIENT_URL}/settings?connected=linkedin`)
);

// DELETE /api/auth/disconnect/:platform
router.delete("/disconnect/:platform", protect, async (req, res) => {
  try {
    const { platform } = req.params;
    if (!["twitter", "linkedin"].includes(platform))
      return res.status(400).json({ success: false, message: "Invalid platform" });
    await User.findByIdAndUpdate(req.user._id, { $unset: { [`connectedAccounts.${platform}`]: "" } });
    res.json({ success: true, message: `${platform} disconnected` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
