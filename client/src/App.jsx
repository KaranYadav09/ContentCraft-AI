import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Generate  from "./pages/Generate";
import Calendar  from "./pages/Calendar";
import History   from "./pages/History";
import Analytics from "./pages/Analytics";
import Settings  from "./pages/Settings";
import Login     from "./components/auth/Login";
import Register  from "./pages/Register";

const NAV_LINKS = [
  { to: "/",          label: "✦ Generate",  exact: true },
  { to: "/calendar",  label: "⏰ Calendar" },
  { to: "/history",   label: "◈ History" },
  { to: "/analytics", label: "↗ Analytics" },
  { to: "/settings",  label: "⚙ Settings" },
];

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="pulse" style={{ fontSize:32, color:"#6366f1" }}>✦</div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      {/* Navbar */}
      <header style={{ borderBottom:"1px solid #1e1c2e", position:"sticky", top:0, zIndex:50, background:"#0a0a0f" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 32px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:30, height:30, borderRadius:8,
              background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
            }}>✦</div>
            <span style={{ fontWeight:800, fontSize:15, letterSpacing:-0.3 }}>ContentCraft AI</span>
          </div>

          {/* Nav */}
          <nav style={{ display:"flex", gap:2 }}>
            {NAV_LINKS.map(({ to, label, exact }) => (
              <NavLink key={to} to={to} end={exact}
                style={({ isActive }) => ({
                  padding:"8px 14px", borderRadius:8, fontSize:12, fontWeight:500,
                  color: isActive ? "#a5b4fc" : "#6b6880",
                  background: isActive ? "#1a1830" : "transparent",
                  border: isActive ? "1px solid #2d2b3d" : "1px solid transparent",
                  textDecoration:"none", transition:"all 0.2s",
                })}
              >{label}</NavLink>
            ))}
          </nav>

          {/* User */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:30, height:30, borderRadius:"50%",
              background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:700, color:"#fff",
            }}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
            <span style={{ fontSize:12, color:"#9d9ab0" }}>{user?.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={logout} style={{ padding:"5px 10px" }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex:1 }}>{children}</main>

      <footer style={{ borderTop:"1px solid #1e1c2e", padding:"12px 32px", textAlign:"center" }}>
        <p style={{ fontSize:11, color:"#3a3850" }}>ContentAI © {new Date().getFullYear()} · MERN Stack · Powered by Claude</p>
      </footer>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/"          element={<Generate />} />
              <Route path="/calendar"  element={<Calendar />} />
              <Route path="/history"   element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings"  element={<Settings />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
