import { PLATFORMS, TONES, CONTENT_TYPES, PLATFORM_LIMITS } from "../../utils/platformLimits";

export default function PromptForm({ values, onChange, onSubmit, loading }) {
  const { topic, platform, tone, contentType, keywords, scheduledAt } = values;

  const set = (key) => (e) => onChange({ ...values, [key]: e.target.value });

  const defaultSchedule = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset() + 60);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Topic */}
      <div className="form-group">
        <label className="label">Topic *</label>
        <input
          value={topic}
          onChange={set("topic")}
          placeholder="e.g. How AI is transforming content marketing in 2025"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSubmit()}
        />
      </div>

      {/* Platform + Content Type */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="form-group">
          <label className="label">Platform</label>
          <select value={platform} onChange={set("platform")}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LIMITS[p].emoji} {PLATFORM_LIMITS[p].label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Content Type</label>
          <select value={contentType} onChange={set("contentType")}>
            {CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Tone selector */}
      <div className="form-group">
        <label className="label">Tone</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TONES.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ ...values, tone: t })}
              style={{
                background: tone === t ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#0d0c16",
                border: `1px solid ${tone === t ? "transparent" : "#1e1c2e"}`,
                color: tone === t ? "#fff" : "#9d9ab0",
                borderRadius: 20, padding: "6px 16px", fontSize: 12,
                fontFamily: "Sora,sans-serif", transition: "all 0.2s",
              }}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="form-group">
        <label className="label">Keywords <span style={{ color: "#4a4760", fontWeight: 400 }}>(optional, comma-separated)</span></label>
        <input value={keywords} onChange={set("keywords")} placeholder="AI, automation, productivity" />
      </div>

      {/* Schedule time */}
      <div className="form-group">
        <label className="label">Schedule For</label>
        <input
          type="datetime-local"
          value={scheduledAt || defaultSchedule()}
          onChange={set("scheduledAt")}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={onSubmit}
        disabled={loading || !topic.trim()}
        style={{ padding: "14px", fontSize: 15, marginTop: 4 }}
      >
        {loading ? <><span className="pulse">⚡</span> Generating…</> : "✦ Generate Content"}
      </button>
    </div>
  );
}
