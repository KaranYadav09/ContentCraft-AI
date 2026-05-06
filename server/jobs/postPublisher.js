const cron = require("node-cron");
const ScheduledPost = require("../models/ScheduledPost");
const Content = require("../models/Content");
const User = require("../models/User");
const { postTweet } = require("../services/twitterService");
const { postToLinkedIn } = require("../services/linkedinService");

const publishScheduledPost = async (scheduledPostId) => {
  const scheduledPost = await ScheduledPost.findById(scheduledPostId)
    .populate("content")
    .populate("user");

  if (!scheduledPost || scheduledPost.status !== "pending") return;

  await ScheduledPost.findByIdAndUpdate(scheduledPostId, { status: "processing" });

  try {
    const { content, user, platform } = scheduledPost;
    let result = null;

    switch (platform) {
      case "twitter":
        result = await postTweet(user, content.generatedText);
        break;
      case "linkedin":
        result = await postToLinkedIn(user, content.generatedText);
        break;
      case "instagram":
      case "facebook":
        // Placeholder — integrate Meta Graph API
        console.log(`📱 [Mock] Posted to ${platform}: ${content.generatedText.slice(0, 50)}...`);
        result = { id: `mock_${Date.now()}`, url: "#" };
        break;
      default:
        result = { id: `saved_${Date.now()}`, url: "#" };
    }

    await ScheduledPost.findByIdAndUpdate(scheduledPostId, {
      status: "published",
      publishedAt: new Date(),
      platformPostId: result.id,
      platformPostUrl: result.url,
    });

    await Content.findByIdAndUpdate(content._id, {
      status: "published",
      publishedAt: new Date(),
    });

    console.log(`✅ Published post ${scheduledPostId} to ${platform}`);
  } catch (error) {
    console.error(`❌ Failed to publish post ${scheduledPostId}:`, error.message);

    const sp = await ScheduledPost.findById(scheduledPostId);
    const retryCount = sp.retryCount + 1;

    if (retryCount >= sp.maxRetries) {
      await ScheduledPost.findByIdAndUpdate(scheduledPostId, {
        status: "failed",
        errorMessage: error.message,
        retryCount,
      });
      await Content.findByIdAndUpdate(sp.content, { status: "failed", publishError: error.message });
    } else {
      await ScheduledPost.findByIdAndUpdate(scheduledPostId, {
        status: "pending",
        retryCount,
        errorMessage: error.message,
        scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // retry in 5 min
      });
    }
  }
};

// Master cron: runs every minute to catch any missed jobs
const initScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const duePosts = await ScheduledPost.find({
        status: "pending",
        scheduledAt: { $lte: now },
      });

      for (const post of duePosts) {
        await publishScheduledPost(post._id);
      }
    } catch (err) {
      console.error("Scheduler error:", err.message);
    }
  });

  console.log("📅 Post publisher cron initialized (runs every minute)");
};

module.exports = { initScheduler, publishScheduledPost };
