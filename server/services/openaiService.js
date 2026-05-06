// Now using Gemini instead of Anthropic
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// Initialize genAI only if key exists
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey.includes("your_")) {
  console.warn("⚠️  GEMINI_API_KEY is missing or invalid in .env");
}
const genAI = new GoogleGenerativeAI(apiKey || "");

const PLATFORM_RULES = {
  twitter: "Twitter/X: Max 280 chars per tweet. For threads, number each tweet (1/, 2/...). Use 2-3 relevant hashtags. Be punchy and direct.",
  linkedin: "LinkedIn: 150-300 words. Professional tone. Use line breaks. Include a clear call to action. 3-5 hashtags at end.",
  instagram: "Instagram: Engaging caption under 2200 chars. Start with a hook. Use emojis tastefully. 10-15 hashtags.",
  facebook: "Facebook: Conversational, 100-200 words. No hashtags needed. Ask a question to drive comments.",
  blog: "Blog Intro: Compelling 150-250 word opening paragraph. Hook the reader, state the problem, hint at the solution.",
};

const generateContent = async ({ topic, platform, tone, contentType, keywords }) => {
  try {
    if (!apiKey) throw new Error("Gemini API key is not configured");

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });

    const platformRule = PLATFORM_RULES[platform] || PLATFORM_RULES.twitter;
    const keywordStr = keywords?.length
      ? `Naturally include these keywords: ${keywords.join(", ")}.`
      : "";

    const prompt = `You are an expert social media content writer.

Generate a ${contentType} for ${platform} with a ${tone} tone.
Topic: "${topic}"
${keywordStr}

Platform guidelines: ${platformRule}

Return ONLY the final content. No labels, no preamble, no explanations.`;

    console.log(`🤖 Generating content for ${platform}...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Handle potential blocked responses
    let generatedText = "";
    try {
      generatedText = response.text();
    } catch (e) {
      console.error("Gemini Response Error:", e.message);
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${response.promptFeedback.blockReason}`);
      }
      throw new Error("AI failed to generate content. Please try a different topic.");
    }

    console.log(`✅ Generation successful (${generatedText.length} chars)`);

    const tokensUsed = 0;
    const hashtags = (generatedText.match(/#\w+/g) || []).map((h) =>
      h.toLowerCase()
    );

    return { generatedText, tokensUsed, hashtags };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

const generateContentStream = async (
  { topic, platform, tone, contentType, keywords },
  onChunk
) => {
  try {
    if (!apiKey) throw new Error("Gemini API key is not configured");

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });

    const platformRule = PLATFORM_RULES[platform] || PLATFORM_RULES.twitter;
    const keywordStr = keywords?.length
      ? `Naturally include these keywords: ${keywords.join(", ")}.`
      : "";

    const prompt = `You are an expert social media content writer.

Generate a ${contentType} for ${platform} with a ${tone} tone.
Topic: "${topic}"
${keywordStr}

Platform guidelines: ${platformRule}

Return ONLY the final content. No labels, no preamble, no explanations.`;

    console.log(`🤖 Streaming content for ${platform}...`);
    
    // Use real streaming
    const result = await model.generateContentStream(prompt);
    
    let fullText = "";
    try {
      for await (const chunk of result.stream) {
        let chunkText = "";
        try {
          chunkText = chunk.text();
        } catch (e) {
          // If a chunk is blocked, it might throw or be empty
          console.warn("⚠️  Gemini chunk blocked or empty:", e.message);
          continue;
        }
        
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText);
        }
      }
    } catch (e) {
      console.error("❌ Streaming loop error:", e.message);
      if (fullText.length === 0) throw e; // Only rethrow if we got nothing
    }

    if (fullText.length === 0) {
      throw new Error("AI failed to generate content. The prompt might have been blocked or the response was empty.");
    }

    console.log(`✅ Streaming complete (${fullText.length} chars)`);

    const tokensUsed = 0;
    const hashtags = (fullText.match(/#\w+/g) || []).map((h) =>
      h.toLowerCase()
    );

    return { generatedText: fullText, tokensUsed, hashtags };
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    throw error;
  }
};

module.exports = { generateContent, generateContentStream };