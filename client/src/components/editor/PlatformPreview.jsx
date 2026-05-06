import { PLATFORM_LIMITS } from "../../utils/platformLimits";

const TwitterPreview = ({ text, username }) => (
  <div style={{ background: "#000", borderRadius: 12, padding: 16, maxWidth: 480 }}>
    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", flexShrink: 0 }} />
      <div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{username || "Your Name"}</div>
        <div style={{ color: "#555", fontSize: 12 }}>@{(username || "yourhandle").toLowerCase().replace(/ /g, "")}</div>
      </div>
    </div>
    <p style={{ color: "#e7e9ea", fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{text}</p>
    <div style={{ color: "#555", fontSize: 12, marginTop: 12, borderTop: "1px solid #1e1e1e", paddingTop: 10 }}>
      {new Date().toLocaleTimeString()} · {new Date().toLocaleDateString()} · <span style={{ color: "#1d9bf0" }}>Twitter Web App</span>
    </div>
  </div>
);

const LinkedInPreview = ({ text, username }) => (
  <div style={{ background: "#1b1f23", borderRadius: 8, padding: 16, maxWidth: 520, border: "1px solid #2d3035" }}>
    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#0077b5,#00a0dc)", flexShrink: 0 }} />
      <div>
        <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{username || "Your Name"}</div>
        <div style={{ color: "#8f9499", fontSize: 12 }}>Content Creator · 500+ connections</div>
        <div style={{ color: "#8f9499", fontSize: 11 }}>Just now · 🌐</div>
      </div>
    </div>
    <p style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{text}</p>
    <div style={{ borderTop: "1px solid #2d3035", marginTop: 12, paddingTop: 10, display: "flex", gap: 20 }}>
      {["👍 Like", "💬 Comment", "🔁 Repost", "📤 Send"].map((a) => (
        <span key={a} style={{ color: "#8f9499", fontSize: 12, cursor: "pointer" }}>{a}</span>
      ))}
    </div>
  </div>
);

const InstagramPreview = ({ text }) => (
  <div style={{ background: "#000", borderRadius: 8, maxWidth: 380, border: "1px solid #1a1a1a" }}>
    <div style={{ height: 300, background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 48 }}>🖼</span>
    </div>
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 12 }}>
          {["❤️", "💬", "✈️"].map((i) => <span key={i} style={{ fontSize: 20, cursor: "pointer" }}>{i}</span>)}
        </div>
        <span style={{ fontSize: 20, cursor: "pointer" }}>🔖</span>
      </div>
      <p style={{ color: "#fff", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
        <strong>yourhandle</strong> {text}
      </p>
    </div>
  </div>
);

const GenericPreview = ({ text, platform }) => {
  const meta = PLATFORM_LIMITS[platform];
  return (
    <div className="card" style={{ padding: 20, maxWidth: 500 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{meta?.emoji}</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{meta?.label} Post</span>
      </div>
      <p style={{ color: "#b0adc4", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{text}</p>
    </div>
  );
};

export default function PlatformPreview({ platform, text, username }) {
  if (!text) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#4a4760", fontSize: 13 }}>
      Generate content to see platform preview
    </div>
  );

  switch (platform) {
    case "twitter":   return <TwitterPreview  text={text} username={username} />;
    case "linkedin":  return <LinkedInPreview text={text} username={username} />;
    case "instagram": return <InstagramPreview text={text} />;
    default:          return <GenericPreview text={text} platform={platform} />;
  }
}
