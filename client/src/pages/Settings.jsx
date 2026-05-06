import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import OAuthConnect from "../components/auth/OAuthConnect";
import { useAuth }  from "../context/AuthContext";
import api from "../utils/api";
import { PLATFORMS, TONES, PLATFORM_LIMITS } from "../utils/platformLimits";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [params]  = useSearchParams();
  const [form, setForm]       = useState({ name: user?.name || "", preferences: { ...user?.preferences } });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [toast, setToast]     = useState("");

  useEffect(() => {
    const connected = params.get("connected");
    const error     = params.get("error");
    if (connected) setToast(`✓ ${connected} connected successfully!`);
    if (error)     setToast(`✕ Failed to connect ${error}`);
    if (connected || error) setTimeout(() => setToast(""), 4000);
  }, [params]);

  const setP = (k) => (e) => setForm((f) => ({ ...f, preferences: { ...f.preferences, [k]: e.target.value } }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/me", { name: form.name, preferences: form.preferences });
      updateUser(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="page slide-in">
      {toast && (
        <div style={{
          position:"fixed", bottom:24, right:24, zIndex:999,
          padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:500,
          background: toast.startsWith("✓") ? "#0a1a10" : "#1a0a0a",
          border: `1px solid ${toast.startsWith("✓") ? "#10b98140" : "#ef444440"}`,
          color: toast.startsWith("✓") ? "#6ee7b7" : "#fca5a5",
          boxShadow:"0 8px 32px #00000060",
        }}>{toast}</div>
      )}

      <div className="page-header">
        <h1 className="page-title">⚙ Settings</h1>
        <p className="page-subtitle">Manage your account and connected platforms</p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:640 }}>
        {/* Profile */}
        <div className="card" style={{ padding:24 }}>
          <h2 style={{ fontSize:14, fontWeight:600, marginBottom:18 }}>Profile</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div className="form-group">
              <label className="label">Display Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input value={user?.email || ""} disabled style={{ opacity:0.5 }} />
            </div>
            <div className="form-group">
              <label className="label">Plan</label>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span className="badge" style={{
                  background: user?.plan==="pro" ? "#6366f118" : "#1a1830",
                  color:      user?.plan==="pro" ? "#a5b4fc"  : "#6b6880",
                  border:     `1px solid ${user?.plan==="pro" ? "#6366f130" : "#2d2b3d"}`,
                  padding:"4px 12px",
                }}>{(user?.plan || "free").toUpperCase()}</span>
                {user?.plan !== "pro" && (
                  <button className="btn btn-ghost btn-sm" style={{ color:"#f59e0b", borderColor:"#2d1f00" }}>
                    Upgrade to Pro ✦
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card" style={{ padding:24 }}>
          <h2 style={{ fontSize:14, fontWeight:600, marginBottom:18 }}>Defaults</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div className="form-group">
              <label className="label">Default Platform</label>
              <select value={form.preferences?.defaultPlatform || "twitter"} onChange={setP("defaultPlatform")}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LIMITS[p].emoji} {PLATFORM_LIMITS[p].label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Default Tone</label>
              <select value={form.preferences?.defaultTone || "Professional"} onChange={setP("defaultTone")}>
                {TONES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn:"span 2" }}>
              <label className="label">Timezone</label>
              <input value={form.preferences?.timezone || "UTC"} onChange={setP("timezone")} placeholder="e.g. Asia/Kolkata" />
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ alignSelf:"flex-start", padding:"12px 28px" }}>
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
        </button>

        {/* Connected accounts */}
        <div className="card" style={{ padding:24 }}>
          <h2 style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Connected Accounts</h2>
          <p style={{ fontSize:12, color:"#6b6880", marginBottom:18 }}>Connect platforms to enable direct publishing</p>
          <OAuthConnect />
        </div>

        {/* Danger zone */}
        <div className="card" style={{ padding:24, borderColor:"#2d1515" }}>
          <h2 style={{ fontSize:14, fontWeight:600, color:"#ef4444", marginBottom:14 }}>Danger Zone</h2>
          <button className="btn btn-danger btn-sm">Delete Account</button>
        </div>
      </div>
    </div>
  );
}
