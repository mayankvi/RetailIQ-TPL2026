import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Card, GoldButton, Shell } from "@/components/storeiq/Shell";
import { AISummaryBox } from "@/components/storeiq/AISummary";
import { useKpis, useCategoryPerf, useClientSegments, useDailyTrend, useAppointments, useTopAdvisors } from "@/hooks/useLiveData";
import {
  kpis as mockKpis,
  categoryPerf as mockCategoryPerf,
  clientSegments as mockClientSegments,
  dailyTrend as mockDailyTrend,
  appointments as mockAppointments,
  topAdvisors as mockTopAdvisors
} from "@/lib/mockData";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "StoreIQ — Dashboard · MAISON 57th St" }, { name: "description", content: "Luxury retail intelligence dashboard for MAISON 57th Street." }] }),
  component: Dashboard,
});

const GOLD = "#c9a96e", GREEN = "#1a6b3c", RED = "#c62828", GRAY = "#bdbdbd";

function Pill({ delta, dir }: { delta: number; dir: "up" | "down" | "flat" }) {
  const c = dir === "up" ? GREEN : dir === "down" ? RED : "#888";
  const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "—";
  return (
    <span style={{ color: c, fontWeight: 600, fontSize: 11, letterSpacing: 0.5 }}>
      {arrow} {dir === "flat" ? "flat" : `${Math.abs(delta)}%`} vs LY
    </span>
  );
}

function Select({ label, value, options }: { label: string; value: string; options: string[] }) {
  const [v, setV] = useState(value);
  return (
    <label className="flex items-center gap-2 text-[12px]" style={{ color: "#555" }}>
      <span style={{ color: "#888" }}>{label}:</span>
      <select value={v} onChange={(e) => setV(e.target.value)} className="px-2 py-1 bg-white" style={{ border: "1px solid #e0e0e0", borderRadius: 4, fontSize: 12 }}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    const hasVisited = sessionStorage.getItem("persona_selected");
    if (!hasVisited) {
      navigate({ to: "/persona" });
    }
  }, []);
  const [ai, setAi] = useState<{ open: boolean; mode: "summary" | "priorities" | null }>({ open: false, mode: null });
  const { kpis: liveKpis } = useKpis();
  const { categoryPerf: liveCat } = useCategoryPerf();
  const { clientSegments: liveClients } = useClientSegments();
  const { dailyTrend: liveTrend } = useDailyTrend();
  const { appointments: liveAppt } = useAppointments();
  const { topAdvisors: liveAdvisors } = useTopAdvisors();

  const kpis = liveKpis ?? mockKpis;
  const categoryPerf = liveCat ?? mockCategoryPerf;
  const clientSegments = liveClients ?? mockClientSegments;
  const dailyTrend = liveTrend ?? mockDailyTrend;
  const appointments = liveAppt ?? mockAppointments;
  const topAdvisors = liveAdvisors ?? mockTopAdvisors;
  return (
    <Shell>
      {/* Filter bar */}
      <div className="bg-white px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-3" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <div className="flex items-center gap-4">
          <span style={{ color: "#666", fontWeight: 600, letterSpacing: 1, fontSize: 11, textTransform: "uppercase" }}>Filters</span>
          <Select label="Period" value="MTD" options={["MTD", "QTD", "YTD", "Last 7 days"]} />
          <Select label="Gender" value="All" options={["All", "Women", "Men"]} />
          <Select label="Sale Type" value="All" options={["All", "Appointment", "Walk-in"]} />
        </div>
        <div className="flex gap-2">
          <GoldButton onClick={() => setAi({ open: true, mode: "summary" })}>⚡ Get AI Summary</GoldButton>
          <GoldButton onClick={() => setAi({ open: true, mode: "priorities" })}>🎯 Top 3 Priorities</GoldButton>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <div style={{ color: "#888", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{k.value}</div>
            <Pill delta={k.delta} dir={k.dir} />
          </div>
        ))}
      </div>

      <AISummaryBox open={ai.open} mode={ai.mode} />

      {/* Main grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "340px 1fr" }}>
        {/* LEFT */}
        <div className="space-y-4">
          <Card title="WHAT — Category Performance">
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={categoryPerf} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <CartesianGrid horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#555" }} width={100} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Bar dataKey="ly" fill="#d0d0d0" barSize={8} />
                  <Bar dataKey="ty" barSize={8}>
                    {categoryPerf.map((c, i) => <Cell key={i} fill={c.delta >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              {categoryPerf.map((c) => (
                <div key={c.name} className="flex justify-between text-[11px]">
                  <span style={{ color: "#666" }}>{c.name}</span>
                  <span style={{ color: c.delta >= 0 ? GREEN : RED, fontWeight: 600 }}>{c.delta >= 0 ? "+" : ""}{c.delta}% vs LY</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="WHERE — Appointment vs Walk-in">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Appointments", ...appointments.appt },
                { label: "Walk-in", ...appointments.organic },
              ].map((b) => (
                <div key={b.label} className="p-3" style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>{b.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", marginTop: 2 }}>{b.pct}%</div>
                  <div style={{ fontSize: 11, color: "#666" }}>SPT ${b.spt.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="mt-3" style={{ position: "relative", height: 26, background: "#f3f3f3", borderRadius: 4 }}>
              <div style={{ width: `${appointments.appt.pct}%`, background: GOLD, height: "100%", borderRadius: 4 }} />
              <div style={{ position: "absolute", top: -4, bottom: -4, left: `${appointments.target}%`, width: 2, background: "#1a1a1a" }} />
              <div style={{ position: "absolute", top: -16, left: `${appointments.target}%`, transform: "translateX(-50%)", fontSize: 10, color: "#1a1a1a", whiteSpace: "nowrap" }}>SOP Target {appointments.target}%</div>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <Card title="TREND — Daily Sales TY vs LY">
            <div style={{ height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={dailyTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#888" }} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ly" stroke={GRAY} strokeDasharray="4 4" strokeWidth={2} dot={false} name="LY" />
                  <Line type="monotone" dataKey="ty" stroke={GOLD} strokeWidth={2.5} dot={false} name="TY" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="WHOM — Client Segments">
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={clientSegments} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#666" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ly" fill="#d0d0d0" name="LY" />
                  <Bar dataKey="ty" fill={GREEN} name="TY" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="WHO — Top Client Advisors">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ color: "#888", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-right">Sales</th>
                  <th className="text-right">Tx</th>
                  <th className="text-right">SPT</th>
                  <th className="text-right">vs LY</th>
                  <th className="text-right pr-2">Tier</th>
                </tr>
              </thead>
              <tbody>
                {topAdvisors.map((a, i) => {
                  const tierColor = a.tier === "Top" ? GOLD : a.tier === "Mid" ? "#1565c0" : "#888";
                  return (
                    <tr key={a.name} style={{ background: i % 2 ? "#fafafa" : "white" }}>
                      <td className="py-2 px-2" style={{ fontWeight: 600 }}>{a.name}</td>
                      <td className="text-right">${a.sales.toLocaleString()}</td>
                      <td className="text-right">{a.tx}</td>
                      <td className="text-right">${a.spt.toLocaleString()}</td>
                      <td className="text-right" style={{ color: a.vsLy >= 0 ? GREEN : RED, fontWeight: 600 }}>{a.vsLy >= 0 ? "+" : ""}{a.vsLy}%</td>
                      <td className="text-right pr-2">
                        <span style={{ background: tierColor, color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 4, letterSpacing: 1 }}>{a.tier}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      {/* VIP banner */}
      <div className="mt-4 flex items-center justify-between px-5 py-4" style={{ background: "#1a1a1a", borderRadius: 8 }}>
        <div style={{ color: "#c9a96e", letterSpacing: 1, fontSize: 13 }}>
          <span style={{ fontWeight: 700 }}>⚡ VIP EVENT IN 7 DAYS</span> — SS25 RTW & Accessories Preview · May 27, 2025 · 35 Clients Expected · 2 Senior CAs on Vacation
        </div>
        <GoldButton onClick={() => navigate({ to: "/ask-ai" })}>
          Prepare Event →
        </GoldButton>
      </div>
    </Shell>
  );
}
