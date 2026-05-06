import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]     = useState({ name:"", email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"radial-gradient(ellipse at 50% 0%, #1a1830 0%, #0a0a0f 60%)", padding:20,
    }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{
            width:48, height:48, borderRadius:12,
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, margin:"0 auto 12px",
          }}>✦</div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>ContentAI</h1>
          <p style={{ color:"#6b6880", fontSize:13, marginTop:4 }}>Create your account</p>
        </div>
        <div className="card" style={{ padding:28 }}>
          <form onSubmit={handle} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div className="form-group">
              <label className="label">Name</label>
              <input value={form.name} onChange={set("name")} placeholder="Your Name" required />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" required minLength={6} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding:"13px", fontSize:15 }}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign:"center", fontSize:13, color:"#6b6880" }}>
            Already have an account? <Link to="/login" style={{ color:"#a5b4fc" }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
