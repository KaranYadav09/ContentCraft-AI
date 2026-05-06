export const PLATFORM_LIMITS = {
  twitter:   { maxChars: 280,  label: "Twitter/X",  color: "#1d9bf0", emoji: "🐦" },
  linkedin:  { maxChars: 3000, label: "LinkedIn",   color: "#0077b5", emoji: "💼" },
  instagram: { maxChars: 2200, label: "Instagram",  color: "#e1306c", emoji: "📸" },
  facebook:  { maxChars: 63206,label: "Facebook",   color: "#1877f2", emoji: "👤" },
  blog:      { maxChars: 10000,label: "Blog",       color: "#f59e0b", emoji: "📝" },
};

export const PLATFORMS   = Object.keys(PLATFORM_LIMITS);
export const TONES       = ["Professional","Casual","Witty","Inspirational","Educational"];
export const CONTENT_TYPES = ["Post","Thread","Caption","Article Intro","Newsletter"];

export const STATUS_META = {
  draft:      { color: "#f59e0b", bg: "#1a1400", label: "Draft" },
  scheduled:  { color: "#6366f1", bg: "#0d0c1a", label: "Scheduled" },
  published:  { color: "#10b981", bg: "#001a0e", label: "Published" },
  failed:     { color: "#ef4444", bg: "#1a0000", label: "Failed" },
  pending:    { color: "#6366f1", bg: "#0d0c1a", label: "Pending" },
  cancelled:  { color: "#6b6880", bg: "#13121e", label: "Cancelled" },
};

export const getCharWarning = (platform, count) => {
  const limit = PLATFORM_LIMITS[platform]?.maxChars || 9999;
  const pct = count / limit;
  if (pct >= 1) return "over";
  if (pct >= 0.9) return "warning";
  return "ok";
};
