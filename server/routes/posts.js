const express = require("express");
const { body, validationResult } = require("express-validator");
const { protect } = require("../middleware/auth");
const ScheduledPost = require("../models/ScheduledPost");
const Content = require("../models/Content");
const { schedulePost, cancelPost } = require("../services/schedulerService");
const { publishScheduledPost } = require("../jobs/postPublisher");

const router = express.Router();

// POST /api/posts/schedule  — schedule a content piece
router.post(
  "/schedule",
  protect,
  [
    body("contentId").notEmpty().withMessage("contentId required"),
    body("platform").isIn(["twitter", "linkedin", "instagram", "facebook", "blog"]),
    body("scheduledAt").isISO8601().withMessage("Valid ISO8601 date required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { contentId, platform, scheduledAt, note, timezone } = req.body;

      const content = await Content.findOne({ _id: contentId, user: req.user._id });
      if (!content) return res.status(404).json({ success: false, message: "Content not found" });

      const schedDate = new Date(scheduledAt);
      if (schedDate <= new Date())
        return res.status(400).json({ success: false, message: "Scheduled time must be in the future" });

      const scheduledPost = await ScheduledPost.create({
        user: req.user._id,
        content: contentId,
        platform,
        scheduledAt: schedDate,
        metadata: { timezone, note },
      });

      const cronExpr = schedulePost(scheduledPost);
      if (cronExpr) {
        await ScheduledPost.findByIdAndUpdate(scheduledPost._id, { cronJobId: cronExpr });
      }

      await Content.findByIdAndUpdate(contentId, { status: "scheduled" });

      const populated = await ScheduledPost.findById(scheduledPost._id).populate("content");
      res.status(201).json({ success: true, scheduledPost: populated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// GET /api/posts  — list scheduled/published posts
router.get("/", protect, async (req, res) => {
  try {
    const { status, platform, from, to, page = 1, limit = 50 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (platform) filter.platform = platform;
    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(from);
      if (to) filter.scheduledAt.$lte = new Date(to);
    }

    const total = await ScheduledPost.countDocuments(filter);
    const posts = await ScheduledPost.find(filter)
      .populate("content")
      .sort({ scheduledAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: +page, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/posts/calendar?month=2024-03  — for calendar view
router.get("/calendar", protect, async (req, res) => {
  try {
    const { month } = req.query; // e.g. "2024-03"
    const start = month ? new Date(`${month}-01`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

    const posts = await ScheduledPost.find({
      user: req.user._id,
      scheduledAt: { $gte: start, $lte: end },
    }).populate("content").sort({ scheduledAt: 1 });

    // Group by day
    const byDay = {};
    for (const post of posts) {
      const day = post.scheduledAt.toISOString().split("T")[0];
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(post);
    }

    res.json({ success: true, byDay, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/posts/:id/reschedule
router.patch("/:id/reschedule", protect, async (req, res) => {
  try {
    const post = await ScheduledPost.findOne({ _id: req.params.id, user: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.status === "published") return res.status(400).json({ success: false, message: "Cannot reschedule published post" });

    const newDate = new Date(req.body.scheduledAt);
    if (newDate <= new Date()) return res.status(400).json({ success: false, message: "New time must be in the future" });

    cancelPost(post._id);
    post.scheduledAt = newDate;
    post.status = "pending";
    await post.save();

    const cronExpr = schedulePost(post);
    if (cronExpr) await ScheduledPost.findByIdAndUpdate(post._id, { cronJobId: cronExpr });

    const updated = await ScheduledPost.findById(post._id).populate("content");
    res.json({ success: true, scheduledPost: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/posts/:id/publish-now
router.post("/:id/publish-now", protect, async (req, res) => {
  try {
    const post = await ScheduledPost.findOne({ _id: req.params.id, user: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.status === "published") return res.status(400).json({ success: false, message: "Already published" });

    cancelPost(post._id);
    post.scheduledAt = new Date();
    post.status = "pending";
    await post.save();

    await publishScheduledPost(post._id);
    const updated = await ScheduledPost.findById(post._id).populate("content");
    res.json({ success: true, scheduledPost: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/posts/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await ScheduledPost.findOne({ _id: req.params.id, user: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.status === "published") return res.status(400).json({ success: false, message: "Cannot delete published post" });

    cancelPost(post._id);
    await post.deleteOne();
    await Content.findByIdAndUpdate(post.content, { status: "draft" });

    res.json({ success: true, message: "Post cancelled and deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
