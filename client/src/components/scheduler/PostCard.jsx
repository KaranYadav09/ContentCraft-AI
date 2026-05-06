import { useState } from "react";
import { STATUS_META, PLATFORM_LIMITS } from "../../utils/platformLimits";

const fmtDate = (iso) => new Date(iso).toLocaleString("en-IN", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});

export default function PostCard({ post, onPublishNow, onDelete, onReschedule }) {
  const [expanded, setExpanded] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");

  const { content, platform, status, scheduledAt, platformPostUrl, errorMessage } = post;
  const meta    = STATUS_META[status] || STATUS_META.draft;
  const plMeta  = PLATFORM_LIMITS[platform];

  const handleReschedule = () => {
    if (!newDate) return;
    onReschedule(post._id, new Date(newDate).toISOString());
    setRescheduling(false);
  };

  return (
    <div className="card slide-in" style={{ padding: 18, transition: "border-color 0.2s" }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#2d2b3d"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "#1e1c2e"}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Left: content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <div className="status-dot" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
            <span style={{ fontSize: 11, color: meta.color, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>
              {meta.label}
            </span>
            <span className="tag">{plMeta?.emoji} {plMeta?.label}</span>
            {content?.contentType && <span className="tag">{content.contentType}</span>}
            {content?.tone && <span className="tag">{content.tone}</span>}
            <span style={{ fontSize: 11, color: "#4a4760", marginLeft: "auto" }}>
              {content?.charCount?.toLocaleString()} chars
            </span>
          </div>

          {/* Content preview */}
          <p style={{
            fontFamily: "Fira Code, monospace", fontSize: 12, lineHeight: 1.7,
            color: "#b0adc4", whiteSpace: "pre-wrap",
            display: expanded ? "block" : "-webkit-box",
            WebkitLineClamp: expanded ? "unset" : 3,
            WebkitBoxOrient: "vertical",
            overflow: expanded ? "visible" : "hidden",
          }}>
            {content?.generatedText}
          </p>
          {content?.generatedText?.length > 200 && (
            <button onClick={() => setExpanded(!expanded)} style={{
              background: "none", border: "none", color: "#6366f1", fontSize: 11,
              padding: "4px 0", marginTop: 4,
            }}>{expanded ? "Show less" : "Show more"}</button>
          )}

          {/* Meta row */}
          <div style={{ marginTop: 10, fontSize: 11, color: "#4a4760", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>📅 {fmtDate(scheduledAt)}</span>
            {platformPostUrl && <a href={platformPostUrl} target="_blank" rel="noreferrer" style={{ color: "#6366f1" }}>View post ↗</a>}
            {errorMessage && <span style={{ color: "#ef4444" }}>⚠ {errorMessage}</span>}
          </div>

          {/* Reschedule form */}
          {rescheduling && (
            <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
              <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                style={{ flex: 1, padding: "6px 10px", fontSize: 12 }} />
              <button className="btn btn-primary btn-sm" onClick={handleReschedule}>Set</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setRescheduling(false)}>Cancel</button>
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          {(status === "pending" || status === "draft") && (
            <button className="btn btn-primary btn-sm" onClick={() => onPublishNow(post._id)}>
              Publish Now
            </button>
          )}
          {status === "failed" && (
            <button className="btn btn-primary btn-sm" onClick={() => onPublishNow(post._id)}>
              Retry
            </button>
          )}
          {(status === "pending") && (
            <button className="btn btn-ghost btn-sm" onClick={() => setRescheduling(!rescheduling)}>
              Reschedule
            </button>
          )}
          {status !== "published" && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(post._id)}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
