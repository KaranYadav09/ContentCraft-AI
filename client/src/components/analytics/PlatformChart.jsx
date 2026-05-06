import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, Cell,
} from "recharts";
import { PLATFORM_LIMITS } from "../../utils/platformLimits";

const COLORS = ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1830", border: "1px solid #2d2b3d", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ fontSize: 12, color: "#9d9ab0", marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function PlatformChart({ platformBreakdown = [], toneBreakdown = [], dailyActivity = [] }) {
  const platData = platformBreakdown.map((p, i) => ({
    name: PLATFORM_LIMITS[p._id]?.label || p._id,
    count: p.count,
    tokens: p.tokensUsed,
    fill: COLORS[i % COLORS.length],
  }));

  const toneData = toneBreakdown.map((t, i) => ({
    name: t._id,
    count: t.count,
    fill: COLORS[i % COLORS.length],
  }));

  const actData = dailyActivity.map((d) => ({
    date: d._id.slice(5), // MM-DD
    total: d.count,
    published: d.published,
  }));

  const sectionStyle = { marginBottom: 32 };
  const titleStyle   = { fontSize: 12, color: "#9d9ab0", fontWeight: 600, letterSpacing: 0.5, marginBottom: 16, textTransform: "uppercase" };

  return (
    <div>
      {/* Platform bar chart */}
      <div style={sectionStyle}>
        <p style={titleStyle}>Content by Platform</p>
        {platData.length === 0 ? (
          <div style={{ color: "#4a4760", fontSize: 13 }}>No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: "#6b6880", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b6880", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {platData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tone breakdown */}
      <div style={sectionStyle}>
        <p style={titleStyle}>Content by Tone</p>
        {toneData.length === 0 ? (
          <div style={{ color: "#4a4760", fontSize: 13 }}>No data yet</div>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {toneData.map((t, i) => (
              <div key={t.name} className="card" style={{ padding: "12px 20px", textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLORS[i % COLORS.length] }}>{t.count}</div>
                <div style={{ fontSize: 11, color: "#6b6880", marginTop: 2 }}>{t.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily activity line chart */}
      <div style={sectionStyle}>
        <p style={titleStyle}>Daily Activity (Last 30 Days)</p>
        {actData.length === 0 ? (
          <div style={{ color: "#4a4760", fontSize: 13 }}>No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={actData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1c2e" />
              <XAxis dataKey="date" tick={{ fill: "#6b6880", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b6880", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9d9ab0" }} />
              <Line type="monotone" dataKey="total"     stroke="#6366f1" strokeWidth={2} dot={false} name="Created" />
              <Line type="monotone" dataKey="published" stroke="#10b981" strokeWidth={2} dot={false} name="Published" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
