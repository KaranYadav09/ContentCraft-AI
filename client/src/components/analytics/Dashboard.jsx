const STAT_CARDS = [
  { key: "totalContent",     label: "Total Generated", icon: "✦", color: "#6366f1" },
  { key: "totalPublished",   label: "Published",       icon: "✓", color: "#10b981" },
  { key: "totalScheduled",   label: "Scheduled",       icon: "⏰", color: "#8b5cf6" },
  { key: "totalDrafts",      label: "Drafts",          icon: "✎", color: "#f59e0b" },
];

export default function Dashboard({ stats }) {
  if (!stats) return <div style={{ color: "#6b6880", padding: 40, textAlign: "center" }}>Loading stats…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat cards */}
      <div className="grid-4">
        {STAT_CARDS.map(({ key, label, icon, color }) => (
          <div key={key} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 20, color, filter: `drop-shadow(0 0 6px ${color})` }}>{icon}</span>
              <span style={{ fontSize: 30, fontWeight: 800, color }}>{stats[key] ?? 0}</span>
            </div>
            <p style={{ fontSize: 11, color: "#6b6880", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Success rate + AI calls */}
      <div className="grid-2">
        <div className="card" style={{ padding: 20 }}>
          <p className="label">Publish Success Rate</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: "#10b981" }}>{stats.successRate ?? 100}%</span>
            <span style={{ fontSize: 13, color: "#6b6880" }}>of scheduled posts published</span>
          </div>
          <div style={{ height: 6, background: "#1e1c2e", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3, transition: "width 0.6s ease",
              width: `${stats.successRate ?? 100}%`,
              background: "linear-gradient(90deg, #10b981, #6ee7b7)",
            }} />
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <p className="label">AI Calls This Month</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: "#6366f1" }}>{stats.aiCallsThisMonth ?? 0}</span>
            <span style={{ fontSize: 13, color: "#6b6880" }}>generations · {stats.plan || "free"} plan</span>
          </div>
          <div style={{ height: 6, background: "#1e1c2e", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${Math.min(((stats.aiCallsThisMonth ?? 0) / 20) * 100, 100)}%`,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            }} />
          </div>
          <p style={{ fontSize: 11, color: "#4a4760", marginTop: 6 }}>
            Free plan: 20 generations/month
          </p>
        </div>
      </div>
    </div>
  );
}
