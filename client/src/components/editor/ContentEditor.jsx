import { useState } from "react";
import { PLATFORM_LIMITS, getCharWarning } from "../../utils/platformLimits";

export default function ContentEditor({ content, streamText, platform, generating, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState("");

  const displayText = content?.generatedText || streamText;
  const charCount   = displayText?.length || 0;
  const limit       = PLATFORM_LIMITS[platform]?.maxChars || 9999;
  const warning     = getCharWarning(platform, charCount);
  const charColor   = warning === "over" ? "#ef4444" : warning === "warning" ? "#f59e0b" : "#6b6880";

  const startEdit = () => { setDraft(displayText); setEditing(true); };
  const saveEdit  = () => { onEdit(draft); setEditing(false); };

  const copy = () => navigator.clipboard.writeText(displayText);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="label" style={{ margin: 0 }}>Preview</span>
        {displayText && (
          <span style={{ fontSize: 11, color: charColor }}>
            {charCount.toLocaleString()} / {limit.toLocaleString()} chars
          </span>
        )}
      </div>

      {/* Platform badges */}
      {content && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { label: PLATFORM_LIMITS[content.platform]?.label || content.platform, color: "#6366f1" },
            { label: content.tone,         color: "#8b5cf6" },
            { label: content.contentType,  color: "#06b6d4" },
          ].map((b) => (
            <span key={b.label} className="badge" style={{
              background: b.color + "18", color: b.color, border: `1px solid ${b.color}30`,
            }}>{b.label}</span>
          ))}
        </div>
      )}

      {/* Text area */}
      <div className="card" style={{ minHeight: 280, padding: 18, position: "relative" }}>
        {!displayText && !generating && (
          <div style={{ height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ fontSize: 32, opacity: 0.2 }}>✦</div>
            <p style={{ color: "#4a4760", fontSize: 13, textAlign: "center" }}>
              Your AI-generated content will stream here
            </p>
          </div>
        )}

        {generating && !displayText && (
          <div style={{ height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 15 }}>
            <div className="pulse" style={{ fontSize: 40 }}>✦</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="bounce" style={{ 
                  width: 6, height: 6, background: "#6366f1", borderRadius: "50%",
                  animationDelay: `${i * 0.1}s` 
                }} />
              ))}
            </div>
            <p style={{ color: "#a5b4fc", fontSize: 13, fontWeight: 500 }}>AI is thinking...</p>
          </div>
        )}

        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{
              background: "transparent", border: "none", padding: 0, resize: "vertical",
              fontSize: 13, fontFamily: "Fira Code, monospace", lineHeight: 1.7,
              color: "#d4d0e8", minHeight: 240, width: "100%",
            }}
            autoFocus
          />
        ) : (
          displayText && (
            <p style={{
              fontFamily: "Fira Code, monospace", fontSize: 13, lineHeight: 1.75,
              color: "#d4d0e8", whiteSpace: "pre-wrap", wordBreak: "break-word",
            }} className={generating ? "stream-cursor" : ""}>
              {displayText}
            </p>
          )
        )}
      </div>

      {/* Char warning bar */}
      {displayText && (
        <div style={{ height: 3, background: "#1e1c2e", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2, transition: "width 0.3s",
            width: `${Math.min((charCount / limit) * 100, 100)}%`,
            background: warning === "over" ? "#ef4444" : warning === "warning" ? "#f59e0b" : "#6366f1",
          }} />
        </div>
      )}

      {/* Action buttons */}
      {content && !generating && (
        <div style={{ display: "flex", gap: 8 }}>
          {editing ? (
            <>
              <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save Changes</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={startEdit}>✎ Edit</button>
              <button className="btn btn-ghost btn-sm" onClick={copy}>⎘ Copy</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
