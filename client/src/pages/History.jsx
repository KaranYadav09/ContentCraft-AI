import { useState, useEffect } from "react";
import api from "../utils/api";
import { PLATFORM_LIMITS, STATUS_META } from "../utils/platformLimits";

const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

export default function History() {
  const [contents, setContents] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [filter, setFilter]     = useState({ status: "", platform: "" });
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/generate", {
        params: { page, limit: 15, ...filter },
      });
      setContents(data.contents);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, filter]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this content?")) return;
    try {
      await api.delete(`/generate/${id}`);
      load();
    } catch (e) { alert("Failed to delete"); }
  };

  const handlePublishNow = async (id) => {
    try {
      await api.post(`/generate/${id}/publish`);
      load();
    } catch (e) { alert("Failed to publish"); }
  };

  const handleEdit = async (content) => {
    const newText = prompt("Edit content:", content.generatedText);
    if (newText === null || newText === content.generatedText) return;
    try {
      await api.patch(`/generate/${content._id}`, { generatedText: newText });
      load();
    } catch (e) { alert("Failed to save"); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="page slide-in">
      <div className="page-header">
        <h1 className="page-title">◈ Content History</h1>
        <p className="page-subtitle">{total} total pieces generated</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          style={{ width: "auto", padding: "10px 16px", background: "#13121e", borderRadius: 8 }}>
          <option value="">All Statuses</option>
          {["draft","scheduled","published","failed"].map((s) => (
            <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s}</option>
          ))}
        </select>
        <select value={filter.platform} onChange={(e) => setFilter((f) => ({ ...f, platform: e.target.value }))}
          style={{ width: "auto", padding: "10px 16px", background: "#13121e", borderRadius: 8 }}>
          <option value="">All Platforms</option>
          {Object.entries(PLATFORM_LIMITS).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ status: "", platform: "" })} style={{ height: 38 }}>
          Clear
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:80, color:"#4a4760" }}>
          <div className="pulse" style={{ fontSize:32 }}>✦</div>
          <p style={{ marginTop: 12, fontSize: 13 }}>Fetching history...</p>
        </div>
      ) : contents.length === 0 ? (
        <div style={{ textAlign:"center", padding:80, color:"#4a4760" }}>
          <div style={{ fontSize:48, marginBottom:16, opacity: 0.3 }}>◈</div>
          <p style={{ fontSize: 14 }}>No content found matching filters</p>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {contents.map((c) => {
              const st  = STATUS_META[c.status] || STATUS_META.draft;
              const pl  = PLATFORM_LIMITS[c.platform];
              const exp = expanded === c._id;
              const chars = c.generatedText?.length || 0;
              return (
                <div key={c._id} className="card slide-in" style={{ padding:24, position: "relative", transition: "all 0.2s" }}>
                  <div style={{ display:"flex", gap:24 }}>
                    {/* Left: Content */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems: "center", gap:10, marginBottom:16 }}>
                        <span className="badge" style={{ background:st.color+"18", color:st.color, border: `1px solid ${st.color}30` }}>
                          <span className="status-dot" style={{ background: st.color, marginRight: 6 }} />
                          {st.label}
                        </span>
                        <span className="tag">{pl?.label}</span>
                        <span className="tag">{c.contentType}</span>
                        <span className="tag">{c.tone}</span>
                        <span style={{ fontSize:11, color:"#4a4760", marginLeft:"auto" }}>
                          {chars} chars
                        </span>
                      </div>

                      <p style={{
                        fontFamily:"Fira Code, monospace", fontSize:13, color:"#d4d0e8",
                        lineHeight:1.7, whiteSpace:"pre-wrap", marginBottom: 16,
                        display: exp ? "block" : "-webkit-box",
                        WebkitLineClamp: exp ? "unset" : 3,
                        WebkitBoxOrient:"vertical", overflow: exp ? "visible" : "hidden",
                      }}>{c.generatedText}</p>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #1e1c2e", paddingTop: 16 }}>
                        {c.generatedText?.length > 200 && (
                          <button onClick={() => setExpanded(exp ? null : c._id)}
                            style={{ background:"none", border:"none", color:"#6366f1", fontSize:12, fontWeight: 500, cursor: "pointer" }}>
                            {exp ? "Collapse" : "Read More"}
                          </button>
                        )}
                        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#4a4760", marginLeft: "auto" }}>
                          <span>📅 Created {new Date(c.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          {c.status === "scheduled" && c.scheduledAt && (
                            <span style={{ color: "#8b5cf6" }}>⏰ Scheduled for {new Date(c.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display:"flex", flexDirection: "column", gap:8, width: 110, flexShrink:0 }}>
                      {c.status === "scheduled" && (
                        <button className="btn btn-primary btn-sm" onClick={() => handlePublishNow(c._id)} style={{ width: "100%" }}>
                          Publish Now
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)} style={{ color: "#fca5a5" }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginTop:32 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => p-1)} disabled={page===1}>Previous</button>
              <div style={{ fontSize:13, color:"#6b6880", fontWeight: 500 }}>
                Page <span style={{ color: "#a5b4fc" }}>{page}</span> of {totalPages}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => p+1)} disabled={page===totalPages}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
