import { useState, useEffect } from "react";
import Dashboard     from "../components/analytics/Dashboard";
import PlatformChart from "../components/analytics/PlatformChart";
import api from "../utils/api";
import { STATUS_META } from "../utils/platformLimits";

export default function Analytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays]     = useState(30);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data: res } = await api.get("/analytics", { params: { days } });
      setData(res);
    } catch (e) { console.error(e); }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 30000); // Poll every 30s
    return () => clearInterval(timer);
  }, [days]);

  return (
    <div className="page slide-in">
      <div className="page-header" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 className="page-title">◈ Analytics</h1>
          <p className="page-subtitle">Content performance overview</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems: "center" }}>
          {refreshing && <span className="pulse" style={{ fontSize: 11, color: "#6366f1", fontWeight: 600 }}>Real-time Updating...</span>}
          <div style={{ display:"flex", background: "#13121e", borderRadius: 10, padding: 4 }}>
            {[7,30,90].map((d) => (
              <button key={d} onClick={() => setDays(d)} style={{
                background: days===d ? "#1a1830" : "transparent",
                border: "none",
                color: days===d ? "#a5b4fc" : "#6b6880",
                borderRadius:8, padding:"6px 14px", fontSize:12,
                fontWeight: 600, cursor:"pointer", transition:"all 0.2s",
              }}>Last {d}d</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? "..." : "↻"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:80, color:"#4a4760" }}>
          <div className="pulse" style={{ fontSize:32 }}>◈</div>
          <p style={{ marginTop:12, fontSize: 13 }}>Analyzing content data…</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
          <Dashboard stats={data?.stats} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div className="card" style={{ padding:24 }}>
               <h3 className="label" style={{ marginBottom: 20 }}>Platform Distribution</h3>
               <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                 {data?.platformBreakdown?.map((p, i) => {
                   const total = data.platformBreakdown.reduce((acc, curr) => acc + curr.count, 0);
                   const pct = Math.round((p.count / total) * 100);
                   return (
                     <div key={p._id}>
                       <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                         <span style={{ color: "#d4d0e8", fontWeight: 500 }}>{p._id.charAt(0).toUpperCase() + p._id.slice(1)}</span>
                         <span style={{ color: "#6b6880" }}>{p.count} · {pct}%</span>
                       </div>
                       <div style={{ height: 6, background: "#1a1830", borderRadius: 3, overflow: "hidden" }}>
                         <div style={{ height: "100%", width: `${pct}%`, background: ["#6366f1", "#8b5cf6", "#06b6d4"][i % 3], borderRadius: 3 }} />
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>

            <div className="card" style={{ padding:24 }}>
               <h3 className="label" style={{ marginBottom: 20 }}>Status Breakdown</h3>
               <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                 {["draft", "scheduled", "published", "failed"].map((s, i) => {
                   const count = data?.stats?.[`total${s.charAt(0).toUpperCase() + s.slice(1)}s`] || 0;
                   const total = data?.stats?.totalContent || 1;
                   const pct = Math.round((count / total) * 100);
                   const colors = { draft: "#f59e0b", scheduled: "#6366f1", published: "#10b981", failed: "#ef4444" };
                   return (
                     <div key={s}>
                       <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                         <span style={{ color: "#d4d0e8", fontWeight: 500 }}>
                           <span className="status-dot" style={{ background: colors[s], marginRight: 6 }} />
                           {s.charAt(0).toUpperCase() + s.slice(1)}
                         </span>
                         <span style={{ color: "#6b6880" }}>{count} · {pct}%</span>
                       </div>
                       <div style={{ height: 6, background: "#1a1830", borderRadius: 3, overflow: "hidden" }}>
                         <div style={{ height: "100%", width: `${pct}%`, background: colors[s], borderRadius: 3 }} />
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>

          <div className="card" style={{ padding:24 }}>
            <PlatformChart
              platformBreakdown={data?.platformBreakdown}
              toneBreakdown={data?.toneBreakdown}
              dailyActivity={data?.dailyActivity}
            />
          </div>

          {/* Recent activity */}
          {data?.recentContent?.length > 0 && (
            <div className="card" style={{ padding:24 }}>
              <h3 className="label" style={{ marginBottom: 20 }}>Recent Activity</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {data.recentContent.map((c, i) => (
                  <div key={c._id} style={{ 
                    display:"flex", alignItems:"center", gap:16, padding:"12px 0", 
                    borderBottom: i === data.recentContent.length - 1 ? "none" : "1px solid #1e1c2e" 
                  }}>
                    <span className="status-dot" style={{ background: STATUS_META[c.status]?.color || "#6b6880" }} />
                    <span style={{ fontSize:13, color:"#d4d0e8", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {c.prompt}
                    </span>
                    <span className="tag" style={{ textTransform: "capitalize" }}>{c.platform}</span>
                    <span style={{ fontSize:11, color:"#4a4760", minWidth: 100, textAlign: "right" }}>
                      {new Date(c.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
