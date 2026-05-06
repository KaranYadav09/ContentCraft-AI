const { TwitterApi } = require("twitter-api-v2");

const getClient = (token, tokenSecret) => {
  return new TwitterApi({
    appKey: process.env.TWITTER_CLIENT_ID,
    appSecret: process.env.TWITTER_CLIENT_SECRET,
    accessToken: token,
    accessSecret: tokenSecret,
  });
};

const postTweet = async (user, text) => {
  const { token, tokenSecret } = user.connectedAccounts.twitter;
  if (!token || !tokenSecret) throw new Error("Twitter account not connected");

  const client = getClient(token, tokenSecret);

  // Handle threads (split by \n\n---\n\n or numbered tweets)
  const tweets = splitIntoTweets(text);

  if (tweets.length === 1) {
    const tweet = await client.v2.tweet(tweets[0]);
    return {
      id: tweet.data.id,
      url: `https://twitter.com/i/web/status/${tweet.data.id}`,
    };
  }

  // Post as thread
  let previousId = null;
  let firstId = null;

  for (const tweetText of tweets) {
    const params = { text: tweetText };
    if (previousId) params.reply = { in_reply_to_tweet_id: previousId };

    const tweet = await client.v2.tweet(params);
    if (!firstId) firstId = tweet.data.id;
    previousId = tweet.data.id;
  }

  return {
    id: firstId,
    url: `https://twitter.com/i/web/status/${firstId}`,
  };
};

const splitIntoTweets = (text) => {
  const MAX_LENGTH = 280;
  if (text.length <= MAX_LENGTH) return [text];

  // Split on numbered tweet markers like "1/" or "1."
  const threadPattern = /\d+\/\s/g;
  if (threadPattern.test(text)) {
    return text.split(/(?=\d+\/\s)/).filter(Boolean);
  }

  // Split by paragraphs
  const paragraphs = text.split(/\n\n+/);
  const tweets = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length <= MAX_LENGTH) {
      current = current ? current + "\n\n" + para : para;
    } else {
      if (current) tweets.push(current);
      current = para;
    }
  }
  if (current) tweets.push(current);

  return tweets;
};

module.exports = { postTweet };
