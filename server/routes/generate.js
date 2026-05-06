const express = require("express");
const { body, validationResult } = require("express-validator");
const { protect } = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimiter");
const { generateContent, generateContentStream } = require("../services/openaiService");
const Content = require("../models/Content");
const User = require("../models/User");

const router = express.Router();

const validateGenerate = [
  body("topic").trim().notEmpty().isLength({ max: 500 }).withMessage("Topic required (max 500 chars)"),
  body("platform").isIn(["twitter", "linkedin", "instagram", "facebook", "blog"]).withMessage("Invalid platform"),
  body("tone").isIn(["Professional", "Casual", "Witty", "Inspirational", "Educational"]).withMessage("Invalid tone"),
  body("contentType").optional().isIn(["Post", "Thread", "Caption", "Article Intro", "Newsletter"]),
  body("keywords").optional().isArray({ max: 10 }),
];

// POST /api/generate  — standard response
router.post("/", protect, aiLimiter, validateGenerate, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { topic, platform, tone, contentType = "Post", keywords = [] } = req.body;

    const { generatedText, tokensUsed, hashtags } = await generateContent({
      topic, platform, tone, contentType, keywords, userId: req.user._id,
    });

    const content = await Content.create({
      user: req.user._id,
      prompt: topic,
      generatedText,
      platform,
      tone,
      contentType,
      keywords,
      hashtags,
      tokensUsed,
      status: "draft",
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { aiCallsThisMonth: 1 } });

    res.status(201).json({ success: true, content });
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/generate/stream  — SSE streaming response
router.post("/stream", protect, aiLimiter, validateGenerate, async (req, res) => {
  console.log(`📡 Incoming generation request: ${req.body.platform} - ${req.body.topic.slice(0, 30)}...`);
  const errors = validationResult(req);

  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { topic, platform, tone, contentType = "Post", keywords = [] } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const { generatedText, tokensUsed, hashtags } = await generateContentStream(
      { topic, platform, tone, contentType, keywords },
      (chunk) => {
        res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\n\n`);
      }
    );

    const content = await Content.create({
      user: req.user._id,
      prompt: topic,
      generatedText,
      platform,
      tone,
      contentType,
      keywords,
      hashtags,
      tokensUsed,
      status: "draft",
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { aiCallsThisMonth: 1 } });

    res.write(`data: ${JSON.stringify({ type: "done", content })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
    res.end();
  }
});

// PATCH /api/generate/:id  — edit generated content
router.patch("/:id", protect, async (req, res) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, user: req.user._id });
    if (!content) return res.status(404).json({ success: false, message: "Content not found" });

    if (req.body.generatedText) {
      content.editHistory.push({ previousText: content.generatedText });
      content.generatedText = req.body.generatedText;
    }
    if (req.body.status) content.status = req.body.status;
    await content.save();

    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/generate  — list user's generated content
router.get("/", protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, platform } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    const total = await Content.countDocuments(filter);
    const contents = await Content.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: +page, contents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/generate/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const content = await Content.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!content) return res.status(404).json({ success: false, message: "Content not found" });
    res.json({ success: true, message: "Content deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/generate/:id/publish — Publish now
router.post("/:id/publish", protect, async (req, res) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, user: req.user._id });
    if (!content) return res.status(404).json({ success: false, message: "Content not found" });

    content.status = "published";
    content.publishedAt = new Date().toISOString();
    await content.save();

    res.json({ success: true, message: "Published successfully", content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
