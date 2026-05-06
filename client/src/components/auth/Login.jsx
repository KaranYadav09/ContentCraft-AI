import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 0%, #1a1830 0%, #0a0a0f 60%)",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, margin: "0 auto 12px",
          }}>✦</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>ContentAI</h1>
          <p style={{ color: "#6b6880", fontSize: 13, marginTop: 4 }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handle} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "13px", fontSize: 15 }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: "center", fontSize: 13, color: "#6b6880" }}>
            No account? <Link to="/register" style={{ color: "#a5b4fc" }}>Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
