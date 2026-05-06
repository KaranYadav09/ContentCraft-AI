const cron = require("node-cron");
const ScheduledPost = require("../models/ScheduledPost");
const Content = require("../models/Content");

// In-memory map of active cron jobs
const activeJobs = new Map();

const schedulePost = (scheduledPost) => {
  const { _id, scheduledAt } = scheduledPost;
  const date = new Date(scheduledAt);
  const now = new Date();

  if (date <= now) {
    console.log(`⚠️  Scheduled time has passed for post ${_id}`);
    return null;
  }

  // Build cron expression: second minute hour day month weekday
  const cronExpr = `${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;

  if (!cron.validate(cronExpr)) {
    console.error(`Invalid cron expression for post ${_id}: ${cronExpr}`);
    return null;
  }

  const job = cron.schedule(cronExpr, async () => {
    await publishPost(_id);
    job.destroy();
    activeJobs.delete(_id.toString());
  });

  activeJobs.set(_id.toString(), job);
  console.log(`⏰ Scheduled post ${_id} for ${date.toISOString()}`);
  return cronExpr;
};

const cancelPost = (postId) => {
  const job = activeJobs.get(postId.toString());
  if (job) {
    job.destroy();
    activeJobs.delete(postId.toString());
    console.log(`🚫 Cancelled job for post ${postId}`);
    return true;
  }
  return false;
};

const publishPost = async (scheduledPostId) => {
  const { publishScheduledPost } = require("../jobs/postPublisher");
  await publishScheduledPost(scheduledPostId);
};

const getActiveJobCount = () => activeJobs.size;

module.exports = { schedulePost, cancelPost, getActiveJobCount };
