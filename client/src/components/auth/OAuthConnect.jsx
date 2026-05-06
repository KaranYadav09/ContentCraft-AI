import { useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const PLATFORMS = [
  { key: "twitter",  label: "Twitter / X",  emoji: "🐦", color: "#1d9bf0", desc: "Post tweets and threads" },
  { key: "linkedin", label: "LinkedIn",      emoji: "💼", color: "#0077b5", desc: "Share professional posts" },
];

export default function OAuthConnect() {
  const { user, fetchMe } = useAuth();
  const [loading, setLoading] = useState({});
  const [msg, setMsg]         = useState("");

  const connect = (platform) => {
    // Redirect to OAuth flow; token is in localStorage so server picks it up via query
    const token = localStorage.getItem("token");
    window.location.href = `/api/auth/${platform}?token=${token}`;
  };

  const disconnect = async (platform) => {
    setLoading((l) => ({ ...l, [platform]: true }));
    try {
      await api.delete(`/auth/disconnect/${platform}`);
      await fetchMe();
      setMsg(`${platform} disconnected`);
    } catch (e) {
      setMsg(e.response?.data?.message || "Error");
    } finally {
      setLoading((l) => ({ ...l, [platform]: false }));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {msg && <p style={{ fontSize: 12, color: "#10b981" }}>{msg}</p>}
      {PLATFORMS.map(({ key, label, emoji, color, desc }) => {
        const connected = !!user?.connectedAccounts?.[key]?.id;
        return (
          <div key={key} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>{emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 12, color: "#6b6880" }}>
                {connected
                  ? `Connected as @${user.connectedAccounts[key].username || user.connectedAccounts[key].name}`
                  : desc}
              </div>
            </div>
            {connected ? (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => disconnect(key)}
                disabled={loading[key]}
                style={{ color: "#ef4444", borderColor: "#2d1515" }}
              >{loading[key] ? "…" : "Disconnect"}</button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => connect(key)}
                disabled={loading[key]}
                style={{ background: color }}
              >{loading[key] ? "…" : "Connect"}</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
