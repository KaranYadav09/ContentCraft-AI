const express = require("express");
const { protect } = require("../middleware/auth");
const Content = require("../models/Content");
const ScheduledPost = require("../models/ScheduledPost");
const User = require("../models/User");

const router = express.Router();

// GET /api/analytics  — full dashboard stats
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalContent,
      totalScheduled,
      totalPublished,
      totalFailed,
      totalDrafts,
      recentContent,
      platformBreakdown,
      toneBreakdown,
      dailyActivity,
      user,
    ] = await Promise.all([
      Content.countDocuments({ user: userId }),
      ScheduledPost.countDocuments({ user: userId, status: "pending" }),
      ScheduledPost.countDocuments({ user: userId, status: "published" }),
      ScheduledPost.countDocuments({ user: userId, status: "failed" }),
      Content.countDocuments({ user: userId, status: "draft" }),
      Content.find({ user: userId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(5),
      Content.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$platform", count: { $sum: 1 }, tokensUsed: { $sum: "$tokensUsed" } } },
        { $sort: { count: -1 } },
      ]),
      Content.aggregate([
        { $match: { user: userId } },
        { $group: { _id: "$tone", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ScheduledPost.aggregate([
        { $match: { user: userId, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.findById(userId).select("aiCallsThisMonth plan"),
    ]);

    const successRate = totalPublished + totalFailed > 0
      ? Math.round((totalPublished / (totalPublished + totalFailed)) * 100)
      : 100;

    res.json({
      success: true,
      stats: {
        totalContent,
        totalScheduled,
        totalPublished,
        totalFailed,
        totalDrafts,
        successRate,
        aiCallsThisMonth: user.aiCallsThisMonth,
        plan: user.plan,
      },
      platformBreakdown,
      toneBreakdown,
      dailyActivity,
      recentContent,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/upcoming  — next 7 days
router.get("/upcoming", protect, async (req, res) => {
  try {
    const now = new Date();
    const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const posts = await ScheduledPost.find({
      user: req.user._id,
      status: "pending",
      scheduledAt: { $gte: now, $lte: next7 },
    }).populate("content").sort({ scheduledAt: 1 });

    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
