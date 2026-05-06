import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         isSameMonth, isToday, getDay, addMonths, subMonths } from "date-fns";
import { PLATFORM_LIMITS, STATUS_META } from "../../utils/platformLimits";

export default function ContentCalendar({ byDay, onMonthChange }) {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const navigate = (dir) => {
    const next = dir === 1 ? addMonths(current, 1) : subMonths(current, 1);
    setCurrent(next);
    onMonthChange?.(format(next, "yyyy-MM"));
  };

  const days     = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const startPad = getDay(startOfMonth(current)); // 0=Sun

  const selectedKey   = selected ? format(selected, "yyyy-MM-dd") : null;
  const selectedPosts = selectedKey ? (byDay[selectedKey] || []) : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
      {/* Calendar grid */}
      <div className="card" style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>←</button>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>{format(current, "MMMM yyyy")}</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(1)}>→</button>
        </div>

        {/* Day labels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#6b6880", padding: "4px 0", fontWeight: 600 }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {/* Padding cells */}
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}

          {days.map((day) => {
            const key   = format(day, "yyyy-MM-dd");
            const posts = byDay[key] || [];
            const sel   = selectedKey === key;
            const today = isToday(day);

            return (
              <div key={key} onClick={() => setSelected(sel ? null : day)}
                style={{
                  minHeight: 64, padding: "6px 8px", borderRadius: 8, cursor: "pointer",
                  background: sel ? "#1a1830" : today ? "#13121e" : "transparent",
                  border: `1px solid ${sel ? "#6366f1" : today ? "#2d2b3d" : "transparent"}`,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = "#13121e"; }}
                onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  fontSize: 12, fontWeight: today ? 700 : 400,
                  color: today ? "#a5b4fc" : isSameMonth(day, current) ? "#b0adc4" : "#3a3850",
                  marginBottom: 4,
                }}>{format(day, "d")}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {posts.slice(0, 3).map((p) => (
                    <div key={p._id} style={{
                      height: 4, borderRadius: 2,
                      background: STATUS_META[p.status]?.color || "#6366f1",
                    }} title={p.content?.generatedText?.slice(0, 60)} />
                  ))}
                  {posts.length > 3 && (
                    <span style={{ fontSize: 9, color: "#6b6880" }}>+{posts.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel: selected day posts */}
      <div>
        <h3 style={{ fontSize: 13, color: "#9d9ab0", fontWeight: 600, marginBottom: 14, letterSpacing: 0.5 }}>
          {selected ? format(selected, "MMMM d, yyyy") : "Select a day"}
        </h3>
        {selectedPosts.length === 0 ? (
          <div style={{ color: "#4a4760", fontSize: 13 }}>
            {selected ? "No posts scheduled" : "Click a day to view posts"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedPosts.map((p) => {
              const st   = STATUS_META[p.status] || STATUS_META.draft;
              const plM  = PLATFORM_LIMITS[p.platform];
              return (
                <div key={p._id} className="card" style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    <span className="badge" style={{ background: st.color + "18", color: st.color }}>
                      {st.label}
                    </span>
                    <span className="tag">{plM?.emoji} {plM?.label}</span>
                  </div>
                  <p style={{
                    fontFamily: "Fira Code, monospace", fontSize: 11, color: "#9d9ab0",
                    lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>{p.content?.generatedText}</p>
                  <div style={{ fontSize: 10, color: "#4a4760", marginTop: 6 }}>
                    {new Date(p.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
