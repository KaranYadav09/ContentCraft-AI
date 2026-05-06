import { useState } from "react";
import { format } from "date-fns";
import ContentCalendar from "../components/scheduler/ContentCalendar";
import PostCard        from "../components/scheduler/PostCard";
import { useScheduler } from "../hooks/useScheduler";

export default function Calendar() {
  const [month, setMonth]   = useState(format(new Date(), "yyyy-MM"));
  const [view, setView]     = useState("calendar"); // calendar | list
  const { posts, byDay, loading, publishNow, deletePost, reschedule } = useScheduler({ month });

  return (
    <div className="page slide-in">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">⏰ Content Calendar</h1>
          <p className="page-subtitle">{posts.length} posts this month</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["calendar","list"].map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? "#1a1830" : "transparent",
              border: `1px solid ${view === v ? "#2d2b3d" : "transparent"}`,
              color: view === v ? "#a5b4fc" : "#6b6880",
              borderRadius: 8, padding: "7px 14px", fontSize: 12,
              fontFamily: "Sora,sans-serif", cursor: "pointer", transition: "all 0.2s",
              textTransform: "capitalize",
            }}>{v === "calendar" ? "📅 Calendar" : "☰ List"}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#4a4760" }}>
          <div className="pulse" style={{ fontSize: 24 }}>⏰</div>
          <p style={{ marginTop: 8 }}>Loading calendar…</p>
        </div>
      ) : view === "calendar" ? (
        <ContentCalendar byDay={byDay} onMonthChange={setMonth} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#4a4760" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
              <p>No posts scheduled this month</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPublishNow={publishNow}
                onDelete={deletePost}
                onReschedule={reschedule}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
