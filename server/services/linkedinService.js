const axios = require("axios");

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

const getHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
  "X-Restli-Protocol-Version": "2.0.0",
});

const getProfile = async (accessToken) => {
  const response = await axios.get(`${LINKEDIN_API_BASE}/me`, {
    headers: getHeaders(accessToken),
  });
  return response.data;
};

const postToLinkedIn = async (user, text) => {
  const { accessToken, id } = user.connectedAccounts.linkedin;
  if (!accessToken) throw new Error("LinkedIn account not connected");

  const profile = await getProfile(accessToken);
  const personUrn = `urn:li:person:${profile.id}`;

  const postBody = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const response = await axios.post(`${LINKEDIN_API_BASE}/ugcPosts`, postBody, {
    headers: getHeaders(accessToken),
  });

  const postId = response.headers["x-restli-id"];
  return {
    id: postId,
    url: `https://www.linkedin.com/feed/update/${postId}`,
  };
};

module.exports = { postToLinkedIn };
