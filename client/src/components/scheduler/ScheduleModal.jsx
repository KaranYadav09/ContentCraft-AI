import { useState } from "react";
import { PLATFORMS, PLATFORM_LIMITS } from "../../utils/platformLimits";

export default function ScheduleModal({ content, onSchedule, onClose }) {
  const defaultDt = () => {
    const d = new Date(Date.now() + 3600000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [platform, setPlatform]   = useState(content?.platform || "twitter");
  const [scheduledAt, setAt]      = useState(defaultDt());
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handle = async () => {
    if (!scheduledAt) { setError("Pick a date/time"); return; }
    if (new Date(scheduledAt) <= new Date()) { setError("Must be in the future"); return; }
    setLoading(true);
    try {
      await onSchedule({ contentId: content._id, platform, scheduledAt: new Date(scheduledAt).toISOString(), note });
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000aa", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card slide-in" style={{ width: "100%", maxWidth: 440, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Schedule Post</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b6880", fontSize: 20 }}>✕</button>
        </div>

        {/* Content snippet */}
        <div style={{ background: "#0d0c16", borderRadius: 8, padding: 12, marginBottom: 20 }}>
          <p style={{ fontFamily: "Fira Code, monospace", fontSize: 12, color: "#9d9ab0", lineHeight: 1.6,
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{content?.generatedText}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="label">Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{PLATFORM_LIMITS[p].emoji} {PLATFORM_LIMITS[p].label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Schedule Date & Time</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setAt(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="label">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Campaign name, notes…" />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" onClick={handle} disabled={loading} style={{ flex: 1 }}>
              {loading ? "Scheduling…" : "⏰ Schedule Post"}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
