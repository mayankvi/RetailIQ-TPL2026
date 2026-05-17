import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell
} from "recharts";
import { FormattedAIText, TypingDots } from "@/components/storeiq/AISummary";
import { api } from "@/services/api";
import { API_BASE_URL } from "@/config";

export const Route = createFileRoute("/executive")({
  component: ExecutiveDashboard,
});

const BLUE = "#4361ee", GREEN = "#2d6a4f", RED = "#d62828", AMBER = "#f4a261", GOLD = "#e9c46a", DARK = "#1a1a2e";

function fmt(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function StatusBadge({ status, color }: { status: string; color: string }) {
  const bg = color === "green" ? GREEN : color === "red" ? RED : AMBER;
  return <span style={{ background: bg, color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{status}</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, letterSpacing: 2, color: "#666", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
}

function KpiCard({ label, value, delta, dir }: { label: string; value: string; delta: string; dir: "up" | "down" | "flat" }) {
  return (
    <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
      <div style={{ color: "#888", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: DARK, marginBottom: 4 }}>{value}</div>
      <span style={{ color: dir === "up" ? GREEN : dir === "down" ? RED : "#888", fontWeight: 600, fontSize: 11 }}>
        {dir === "up" ? "▲" : dir === "down" ? "▼" : "—"} {delta}
      </span>
    </div>
  );
}

function OverviewTab({ data }: { data: any }) {
  if (!data) return <div style={{ color: "#888", padding: 40, textAlign: "center" }}>Loading executive data...</div>;
  const { kpis, regions } = data;
  const headlines = [
    { bg: "#f0faf4", border: GREEN, text: `${regions[0]?.region_name} leading — ${fmt(regions[0]?.sales_ty)}, ${regions[0]?.vs_ly_pct >= 0 ? "+" : ""}${regions[0]?.vs_ly_pct}% vs LY`, badge: "Top", badgeColor: GREEN },
    { bg: "#fff8f0", border: AMBER, text: `Midwest stock level at ${regions.find((r: any) => r.region_name === "Midwest")?.stock_level?.toFixed(0)}% — monitor closely`, badge: "Watch", badgeColor: AMBER },
    { bg: "#fff0f0", border: RED, text: `${regions.find((r: any) => r.status_color === "red")?.region_name || "Midwest"} at risk — below performance threshold`, badge: "Action", badgeColor: RED },
    { bg: "#f0f4ff", border: BLUE, text: "VIP Preview event in 7 days — 35 high-value clients expected across flagship stores", badge: "Info", badgeColor: BLUE },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Sales MTD" value={fmt(kpis.total_sales_ty)} delta={`${Math.abs(kpis.vs_ly_pct)}% vs LY`} dir={kpis.vs_ly_pct >= 0 ? "up" : "down"} />
        <KpiCard label="Transactions" value={kpis.transactions?.toLocaleString()} delta="MTD May 2025" dir="flat" />
        <KpiCard label="Active Clients" value={kpis.clients?.toLocaleString()} delta="Unique MTD" dir="flat" />
        <KpiCard label="Regions Active" value="5" delta="All regions live" dir="up" />
      </div>
      <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <SectionTitle>Executive Headlines</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {headlines.map((h, i) => (
            <div key={i} className="flex items-start gap-3 p-3" style={{ background: h.bg, borderLeft: `4px solid ${h.border}`, borderRadius: 6 }}>
              <div className="flex-1" style={{ fontSize: 12, color: "#333", lineHeight: 1.5 }}>{h.text}</div>
              <span style={{ background: h.badgeColor, color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap", fontWeight: 600 }}>{h.badge}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white" style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0f0f0", fontSize: 11, letterSpacing: 2, fontWeight: 700, color: "#666", textTransform: "uppercase" }}>Performance by Region</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ background: "#fafafa", color: "#888", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
              <th className="text-left py-3 px-4">Region</th>
              <th className="text-right">Sales TY</th>
              <th className="text-right">Sales LY</th>
              <th className="text-right">vs LY</th>
              <th className="text-right">NPS</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Orders</th>
              <th className="text-right px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((r: any, i: number) => (
              <tr key={r.region_name} style={{ background: i % 2 ? "#fafafa" : "white", borderTop: "1px solid #f0f0f0" }}>
                <td className="py-3 px-4" style={{ fontWeight: 600 }}>{r.region_name}</td>
                <td className="text-right">{fmt(r.sales_ty)}</td>
                <td className="text-right" style={{ color: "#888" }}>{fmt(r.sales_ly)}</td>
                <td className="text-right" style={{ color: r.vs_ly_pct >= 0 ? GREEN : RED, fontWeight: 600 }}>{r.vs_ly_pct >= 0 ? "+" : ""}{r.vs_ly_pct}%</td>
                <td className="text-right" style={{ color: r.nps >= 74 ? GREEN : r.nps >= 70 ? AMBER : RED, fontWeight: 600 }}>{r.nps?.toFixed(1)}</td>
                <td className="text-right" style={{ color: r.stock_level >= 80 ? GREEN : r.stock_level >= 70 ? AMBER : RED, fontWeight: 600 }}>{r.stock_level?.toFixed(0)}%</td>
                <td className="text-right">{r.orders?.toLocaleString()}</td>
                <td className="text-right px-4"><StatusBadge status={r.status} color={r.status_color} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <SectionTitle>NPS by Region</SectionTitle>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={regions} layout="vertical">
                <CartesianGrid horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" domain={[60, 82]} tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis dataKey="region_name" type="category" tick={{ fontSize: 11, fill: "#555" }} width={80} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="nps" barSize={18} name="NPS">
                  {regions.map((r: any, i: number) => <Cell key={i} fill={r.nps >= 74 ? GREEN : r.nps >= 70 ? AMBER : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <SectionTitle>Sales Share by Region</SectionTitle>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={regions}>
                <CartesianGrid stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="region_name" tick={{ fontSize: 10, fill: "#666" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="sales_ty" barSize={32} name="Sales TY">
                  {regions.map((r: any, i: number) => <Cell key={i} fill={r.status_color === "green" ? GREEN : r.status_color === "red" ? RED : AMBER} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch(`${API_BASE_URL}/get_executive_sales`).then(r => r.json()).then(setData).catch(console.error); }, []);
  if (!data) return <div style={{ color: "#888", padding: 40, textAlign: "center" }}>Loading sales data...</div>;
  const trendData = data.trend.map((r: any) => ({ day: `May ${parseInt(r.date.split("-")[2])}`, ty: Math.round(r.sales_ty), ly: Math.round(r.sales_ly) }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Total Sales TY" value={fmt(data.trend.reduce((s: number, r: any) => s + r.sales_ty, 0))} delta="MTD May 2025" dir="flat" />
        <KpiCard label="Total Sales LY" value={fmt(data.trend.reduce((s: number, r: any) => s + r.sales_ly, 0))} delta="MTD May 2024" dir="flat" />
        <KpiCard label="Best Category" value={data.categories[0]?.category} delta={`${data.categories[0]?.vs_ly_pct >= 0 ? "+" : ""}${data.categories[0]?.vs_ly_pct}% vs LY`} dir={data.categories[0]?.vs_ly_pct >= 0 ? "up" : "down"} />
      </div>
      <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <SectionTitle>Daily Sales Trend — All Stores Combined</SectionTitle>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={trendData}>
              <CartesianGrid stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#888" }} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="ly" stroke="#bdbdbd" strokeDasharray="4 4" strokeWidth={2} dot={false} name="LY" />
              <Line type="monotone" dataKey="ty" stroke={BLUE} strokeWidth={2.5} dot={false} name="TY" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <SectionTitle>Category Performance</SectionTitle>
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={data.categories} layout="vertical" margin={{ left: 10, right: 60 }}>
              <CartesianGrid horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "#555" }} width={130} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Bar dataKey="sales_ly" fill="#e0e0e0" barSize={8} name="LY" />
              <Bar dataKey="sales_ty" barSize={8} name="TY">
                {data.categories.map((c: any, i: number) => <Cell key={i} fill={c.vs_ly_pct >= 0 ? GREEN : RED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-1">
          {data.categories.map((c: any) => (
            <div key={c.category} className="flex justify-between text-[11px]">
              <span style={{ color: "#666" }}>{c.category}</span>
              <span style={{ color: c.vs_ly_pct >= 0 ? GREEN : RED, fontWeight: 600 }}>{c.vs_ly_pct >= 0 ? "+" : ""}{c.vs_ly_pct}% vs LY</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InventoryTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch(`${API_BASE_URL}/get_executive_inventory`).then(r => r.json()).then(setData).catch(console.error); }, []);
  if (!data) return <div style={{ color: "#888", padding: 40, textAlign: "center" }}>Loading inventory data...</div>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Total SKUs" value={data.summary.total_skus.toString()} delta="Across all categories" dir="flat" />
        <KpiCard label="Low Stock Alerts" value={data.summary.low_stock_count.toString()} delta="Below reorder point" dir={data.summary.low_stock_count > 0 ? "down" : "up"} />
        <KpiCard label="VIP Selections" value={data.summary.vip_selections.toString()} delta="For upcoming VIP event" dir="up" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <SectionTitle>Stock Health by Category</SectionTitle>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.by_category} layout="vertical">
                <CartesianGrid horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "#555" }} width={120} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="stock_health_pct" barSize={16} name="Stock Health %">
                  {data.by_category.map((c: any, i: number) => <Cell key={i} fill={c.stock_health_pct >= 150 ? GREEN : c.stock_health_pct >= 100 ? AMBER : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <SectionTitle>Low Stock Alerts</SectionTitle>
          {data.low_stock.length === 0
            ? <div style={{ color: GREEN, fontSize: 12 }}>✓ No low stock alerts</div>
            : <div className="space-y-2">
                {data.low_stock.map((s: any) => (
                  <div key={s.sku_id} className="flex items-center justify-between p-3" style={{ background: "#fff0f0", borderLeft: `3px solid ${RED}`, borderRadius: 6 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#888", fontFamily: "monospace" }}>{s.sku_id}</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{s.product_name}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{s.category}</div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontSize: 20, fontWeight: 700, color: RED }}>{s.units_in_stock}</div>
                      <div style={{ fontSize: 10, color: "#888" }}>min {s.reorder_point}</div>
                    </div>
                  </div>
                ))}
              </div>
          }
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
            <SectionTitle>VIP Event Selections</SectionTitle>
            {data.vip_items.slice(0, 5).map((v: any, i: number) => (
              <div key={i} className="flex justify-between text-[11px] py-1.5" style={{ borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ fontWeight: 500 }}>{v.product_name}</span>
                <div className="flex gap-3">
                  <span style={{ color: "#888" }}>{v.units_in_stock} units</span>
                  <span style={{ color: GOLD, fontWeight: 600 }}>${v.retail_price?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch(`${API_BASE_URL}/get_executive_orders`).then(r => r.json()).then(setData).catch(console.error); }, []);
  if (!data) return <div style={{ color: "#888", padding: 40, textAlign: "center" }}>Loading orders data...</div>;
  const statusColors: Record<string, string> = { Ready: GREEN, Pulling: BLUE, Pending: "#888", Overdue: RED };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Orders" value={data.summary.total.toString()} delta="All stores today" dir="flat" />
        <KpiCard label="Ready for Pickup" value={data.summary.ready.toString()} delta="Awaiting customers" dir="up" />
        <KpiCard label="Overdue Orders" value={data.summary.overdue.toString()} delta="Need action now" dir="down" />
        <KpiCard label="Overdue Rate" value={`${((data.summary.overdue / data.summary.total) * 100).toFixed(1)}%`} delta="vs 10% target" dir={data.summary.overdue / data.summary.total < 0.1 ? "up" : "down"} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <SectionTitle>Orders by Status</SectionTitle>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={data.by_status}>
                <CartesianGrid stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#666" }} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip />
                <Bar dataKey="count" barSize={50} name="Orders">
                  {data.by_status.map((s: any, i: number) => <Cell key={i} fill={statusColors[s.status] || "#888"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <SectionTitle>Stores with Overdue Orders</SectionTitle>
          <div className="space-y-2">
            {data.by_store.filter((s: any) => s.overdue > 0).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2" style={{ background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.store_name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{s.region_name} · {s.total_orders} total</div>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.overdue >= 5 ? RED : AMBER }}>{s.overdue}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>overdue</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NpsTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch(`${API_BASE_URL}/get_executive_nps`).then(r => r.json()).then(setData).catch(console.error); }, []);
  if (!data) return <div style={{ color: "#888", padding: 40, textAlign: "center" }}>Loading NPS data...</div>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Overall NPS" value={data.overall_nps.toString()} delta="All regions average" dir={data.overall_nps >= 70 ? "up" : "down"} />
        <KpiCard label="Top Region" value={data.by_region[0]?.region_name} delta={`NPS ${data.by_region[0]?.avg_nps}`} dir="up" />
        <KpiCard label="Top Department" value={data.by_dept[0]?.dept_name} delta={`NPS ${data.by_dept[0]?.avg_nps}`} dir="up" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <SectionTitle>NPS by Region</SectionTitle>
          <div className="space-y-3 mt-2">
            {data.by_region.map((r: any) => (
              <div key={r.region_name}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{r.region_name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.avg_nps >= 74 ? GREEN : r.avg_nps >= 70 ? AMBER : RED }}>{r.avg_nps}</span>
                </div>
                <div className="flex rounded overflow-hidden" style={{ height: 20 }}>
                  <div style={{ width: `${r.promoters}%`, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, color: "white", fontWeight: 700 }}>{r.promoters?.toFixed(0)}%</span>
                  </div>
                  <div style={{ width: `${r.passives}%`, background: AMBER, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, color: "white", fontWeight: 700 }}>{r.passives?.toFixed(0)}%</span>
                  </div>
                  <div style={{ width: `${r.detractors}%`, background: RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, color: "white", fontWeight: 700 }}>{r.detractors?.toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{r.responses} responses</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #f0f0f0" }}>
            {[{ label: "Promoters", color: GREEN }, { label: "Passives", color: AMBER }, { label: "Detractors", color: RED }].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 10, color: "#666" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <SectionTitle>NPS by Department</SectionTitle>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.by_dept} layout="vertical">
                <CartesianGrid horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" domain={[60, 85]} tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis dataKey="dept_name" type="category" tick={{ fontSize: 11, fill: "#555" }} width={120} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="avg_nps" barSize={18} name="NPS Score">
                  {data.by_dept.map((d: any, i: number) => <Cell key={i} fill={d.avg_nps >= 74 ? GREEN : d.avg_nps >= 70 ? AMBER : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExecutiveDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [execData, setExecData] = useState<any>(null);
  const [msgs, setMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/get_executive_summary`).then(r => r.json()).then(setExecData).catch(console.error);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const send = async (q: string) => {
    if (!q.trim() || loading) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const { job_id } = await api.chat(q, "executive");
      const start = Date.now();
      while (Date.now() - start < 60000) {
        await new Promise((r) => setTimeout(r, 1500));
        const result = await api.getChatResult(job_id);
        if (result.status === "done") { setMsgs((m) => [...m, { role: "ai", text: result.answer ?? result.result ?? "" }]); break; }
        if (result.status === "error") { setMsgs((m) => [...m, { role: "ai", text: result.answer ?? "Something went wrong." }]); break; }
      }
    } catch { setMsgs((m) => [...m, { role: "ai", text: "Connection error. Check backend is running." }]); }
    finally { setLoading(false); }
  };

  const tabs = ["Overview", "Sales", "Inventory", "Orders", "NPS"];
  const suggested = ["Which region needs attention?", "What is our biggest inventory risk?", "How is NPS trending?", "Which stores have overdue orders?"];
  const tabContent: Record<string, React.ReactNode> = {
    Overview: <OverviewTab data={execData} />,
    Sales: <SalesTab />,
    Inventory: <InventoryTab />,
    Orders: <OrdersTab />,
    NPS: <NpsTab />,
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#f5f5f5", fontFamily: "system-ui,sans-serif", fontSize: 13 }}>
      <header className="flex items-center justify-between px-6 py-3" style={{ background: DARK }}>
        <div style={{ color: GOLD, letterSpacing: 3, fontSize: 16, fontWeight: 700 }}>RetailIQ</div>
        <div className="flex items-center gap-2">
          {["● Live Data", "⬡ 5 Agents Active", "✦ Claude AI"].map((b) => (
            <span key={b} className="px-2 py-1 text-[11px]" style={{ border: `1px solid ${GOLD}44`, color: GOLD, borderRadius: 4, letterSpacing: 1 }}>{b}</span>
          ))}
          <span className="px-3 py-1 text-[11px] ml-2" style={{ background: BLUE, color: "white", borderRadius: 4, fontWeight: 700 }}>EX</span>
          <button onClick={() => { sessionStorage.removeItem("persona_selected"); navigate({ to: "/persona" }); }}
            className="ml-3 text-[11px]" style={{ color: "#8892b0", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
            Switch Role
          </button>
        </div>
      </header>
      <div className="flex items-center gap-2 px-6 py-1.5" style={{ background: "#16213e" }}>
        {["Experience Layer", "Orchestration Layer", "Knowledge Layer", "Observability Layer"].map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <span style={{ background: "rgba(67,97,238,0.2)", border: "1px solid rgba(67,97,238,0.4)", color: "#a8b2d8", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{l}</span>
            {i < 3 && <span style={{ color: BLUE, fontSize: 11 }}>→</span>}
          </div>
        ))}
        <div className="ml-auto" style={{ color: "#8892b0", fontSize: 11 }}>All Regions · 17 Stores · May 2025</div>
      </div>
      <nav className="flex px-6" style={{ background: "#1a1a3e", borderBottom: "1px solid #2a2a5e" }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            color: activeTab === t ? "white" : "#8892b0",
            borderBottom: `2px solid ${activeTab === t ? BLUE : "transparent"}`,
            background: "none", border: "none",
            padding: "10px 20px", fontSize: 12, cursor: "pointer",
            fontWeight: activeTab === t ? 600 : 400, letterSpacing: 0.5,
          }}>{t}</button>
        ))}
      </nav>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">{tabContent[activeTab]}</div>
        <div className="flex flex-col" style={{ width: 360, borderLeft: "1px solid #e0e0e0", background: "white" }}>
          <div className="px-4 py-3" style={{ background: DARK, color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>ASK AI — EXECUTIVE VIEW</div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "#fafafa" }}>
            {msgs.length === 0 && <div style={{ color: "#888", textAlign: "center", marginTop: 40, fontSize: 12, lineHeight: 1.8 }}>Ask about regional performance, inventory risks, NPS trends, or store rankings.</div>}
            {msgs.map((m, i) => m.role === "user"
              ? <div key={i} className="flex justify-end"><div className="px-3 py-2" style={{ background: DARK, color: "white", borderRadius: "12px 12px 2px 12px", maxWidth: "85%", fontSize: 12 }}>{m.text}</div></div>
              : <div key={i}><div style={{ color: BLUE, fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>RETAILIQ AGENTS</div><div className="px-3 py-3" style={{ background: "white", borderLeft: `3px solid ${BLUE}`, borderRadius: 6, border: "1px solid #eee", fontSize: 12 }}><FormattedAIText text={m.text} /></div></div>
            )}
            {loading && <div><div style={{ color: BLUE, fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>RETAILIQ AGENTS</div><div className="px-3 py-3" style={{ background: "white", borderLeft: `3px solid ${BLUE}`, borderRadius: 6, border: "1px solid #eee" }}><TypingDots /></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="px-3 py-2 flex gap-2 overflow-x-auto" style={{ borderTop: "1px solid #eee" }}>
            {suggested.map((q) => (
              <button key={q} onClick={() => send(q)} className="whitespace-nowrap px-3 py-1.5 text-[10px] hover:opacity-80"
                style={{ background: "#f0f4ff", color: BLUE, border: `1px solid #c7d2fe`, borderRadius: 16, flexShrink: 0 }}>{q}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 flex gap-2" style={{ borderTop: "1px solid #eee" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about regions, NPS, orders..."
              className="flex-1 px-3 py-2 text-[12px]" style={{ border: "1px solid #e0e0e0", borderRadius: 4, outline: "none" }} />
            <button type="submit" className="px-3 py-2 text-[11px] font-semibold" style={{ background: BLUE, color: "white", border: "none", borderRadius: 4 }}>Ask →</button>
          </form>
        </div>
      </div>
    </div>
  );
}