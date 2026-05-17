import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { FormattedAIText, TypingDots } from "@/components/storeiq/AISummary";
import { api } from "@/services/api";
import { API_BASE_URL } from "@/config";

export const Route = createFileRoute("/associate")({
  component: AssociateDashboard,
});

const GREEN = "#2d6a4f", RED = "#d62828", AMBER = "#f4a261", BLUE = "#4361ee", GOLD = "#e9c46a", DARK = "#1a1a2e";
const statusColors: Record<string, string> = { Ready: GREEN, Pulling: BLUE, Pending: "#888", Overdue: RED };
const taskTypeColors: Record<string, string> = { event: BLUE, orders: AMBER, inventory: RED, clienteling: GOLD, routine: "#888" };

const headlines = [
  { bg: "#fffbf0", border: GOLD, text: "Leather Goods is #1 dept in store today — $22.1K, 8% above goal", badge: "#1", badgeColor: GOLD },
  { bg: "#fff0f0", border: RED,  text: "2 items below reorder point — Neverfull MM (3 units), Speedy 25 (4 units)", badge: "Action", badgeColor: RED },
  { bg: "#f0f4ff", border: BLUE, text: "VIP Preview prep — tasks assigned, due today by 6pm", badge: "Today", badgeColor: BLUE },
];

const deptRanking = [
  { name: "Leather Goods", delta: 8.0,  isMe: true  },
  { name: "Jewelry",       delta: 5.1,  isMe: false },
  { name: "Ready-to-Wear", delta: 3.2,  isMe: false },
  { name: "Fragrances",    delta: 2.2,  isMe: false },
  { name: "Shoes",         delta: 1.4,  isMe: false },
  { name: "Accessories",   delta: -0.8, isMe: false },
];

function ST({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, letterSpacing: 2, color: "#666", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 12 }}>{children}</div>;
}

function KpiCard({ label, value, delta, dir }: { label: string; value: string; delta: string; dir: "up" | "down" | "flat" }) {
  return (
    <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
      <div style={{ color: "#888", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: DARK, marginBottom: 4 }}>{value}</div>
      <span style={{ color: dir === "up" ? GREEN : dir === "down" ? RED : "#888", fontWeight: 600, fontSize: 11 }}>{delta}</span>
    </div>
  );
}

function TaskRow({ t, done, isOverdue, onToggle }: any) {
  return (
    <div className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50"
      onClick={onToggle}
      style={{ borderLeft: isOverdue ? `3px solid ${RED}` : done ? `3px solid ${GREEN}` : "3px solid #e0e0e0", background: isOverdue ? "#fff8f8" : "white" }}>
      <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${done ? GREEN : isOverdue ? RED : "#ccc"}`, background: done ? GREEN : "white", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {done && <span style={{ color: "white", fontSize: 10 }}>✓</span>}
      </div>
      {t.employee_name && <span style={{ width: 110, fontSize: 11, color: "#888", flexShrink: 0 }}>{t.employee_name}</span>}
      <span style={{ flex: 1, fontSize: 12, color: done ? "#888" : "#333", textDecoration: done ? "line-through" : "none" }}>{t.task_name}</span>
      {t.task_type !== "routine" && (
        <span style={{ background: taskTypeColors[t.task_type] + "22", color: taskTypeColors[t.task_type], fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700, textTransform: "uppercase" as const, flexShrink: 0 }}>{t.task_type}</span>
      )}
      <span style={{ fontSize: 10, color: isOverdue ? RED : "#888", fontWeight: isOverdue ? 700 : 400, minWidth: 70, textAlign: "right" as const, flexShrink: 0 }}>
        {isOverdue ? "⚠ OVERDUE" : t.due_time}
      </span>
    </div>
  );
}

function MyDashboardTab({ tasks, orders, onToggle, completed }: any) {
  const myTasks = tasks.filter((t: any) => t.employee_name === "Amy Zhang").slice(0, 6);
  const myOrders = orders?.orders?.slice(0, 4) || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Dept Sales Today" value="$22.1K" delta="+8% vs goal" dir="up" />
        <KpiCard label="Pickups Due" value={String(myOrders.length)} delta={`${myOrders.filter((o: any) => o.status === "Overdue").length} overdue`} dir={myOrders.filter((o: any) => o.status === "Overdue").length > 0 ? "down" : "up"} />
        <KpiCard label="Low Stock Items" value="2" delta="Need restock" dir="down" />
        <KpiCard label="Dept NPS" value="76" delta="Store avg 76.5" dir="flat" />
      </div>
      <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <ST>Your Department Headlines</ST>
        <div className="space-y-2">
          {headlines.map((h, i) => (
            <div key={i} className="flex items-center gap-3 p-3" style={{ background: h.bg, borderLeft: `4px solid ${h.border}`, borderRadius: 6 }}>
              <div className="flex-1" style={{ fontSize: 12, color: "#333", lineHeight: 1.5 }}>{h.text}</div>
              <span style={{ background: h.badgeColor, color: h.badgeColor === GOLD ? DARK : "white", fontSize: 10, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" as const, fontWeight: 700 }}>{h.badge}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <ST>My Tasks Today</ST>
          <div className="space-y-1.5">
            {myTasks.map((t: any) => {
              const done = completed.includes(t.task_id) || t.status === "Done";
              return <TaskRow key={t.task_id} t={t} done={done} isOverdue={t.status === "Overdue" && !done} onToggle={() => onToggle(t.task_id)} />;
            })}
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f0f0f0", fontSize: 11, color: "#888" }}>
            {tasks.filter((t: any) => t.status === "Done").length} of {tasks.length} store tasks completed
          </div>
        </div>
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <ST>Pickup Orders</ST>
          <div className="space-y-2">
            {myOrders.map((o: any) => (
              <div key={o.order_id} className="flex items-center justify-between p-3" style={{ background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#888", fontFamily: "monospace" }}>{o.order_id}</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{o.customer_name}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>${o.order_value?.toLocaleString()}</div>
                </div>
                <span style={{ background: statusColors[o.status] || "#888", color: "white", fontSize: 10, padding: "3px 10px", borderRadius: 4, fontWeight: 600 }}>{o.status}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 16, paddingTop: 16 }}>
            <ST>Dept Ranking — Sales vs Goal</ST>
            <div className="space-y-1.5">
              {deptRanking.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span style={{ width: 20, fontSize: 11, color: d.isMe ? BLUE : "#888", fontWeight: d.isMe ? 700 : 400 }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 12, color: d.isMe ? BLUE : "#555", fontWeight: d.isMe ? 700 : 400 }}>{d.name}{d.isMe && " ← you"}</span>
                  <span style={{ fontSize: 12, color: d.delta >= 0 ? GREEN : RED, fontWeight: 600 }}>{d.delta >= 0 ? "+" : ""}{d.delta}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksTab({ tasks, onToggle, completed }: any) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Overdue", "Pending", "Done", "event", "orders", "inventory"];
  const filtered = tasks.filter((t: any) => {
    if (filter === "All") return true;
    if (["Overdue","Pending","Done"].includes(filter)) return t.status === filter;
    return t.task_type === filter;
  });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Tasks" value={String(tasks.length)} delta="All staff" dir="flat" />
        <KpiCard label="Overdue" value={String(tasks.filter((t: any) => t.status === "Overdue").length)} delta="Need action" dir={tasks.filter((t: any) => t.status === "Overdue").length > 0 ? "down" : "up"} />
        <KpiCard label="Pending" value={String(tasks.filter((t: any) => t.status === "Pending").length)} delta="In progress" dir="flat" />
        <KpiCard label="Done" value={String(tasks.filter((t: any) => t.status === "Done").length)} delta="Completed" dir="up" />
      </div>
      <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <div className="flex items-center justify-between mb-3">
          <ST>All Tasks — Store View</ST>
          <div className="flex gap-1.5 flex-wrap">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? BLUE : "#f5f5f5", color: filter === f ? "white" : "#555", border: "none", borderRadius: 4, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>{f}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          {filtered.map((t: any) => {
            const done = completed.includes(t.task_id) || t.status === "Done";
            return <TaskRow key={t.task_id} t={t} done={done} isOverdue={t.status === "Overdue" && !done} onToggle={() => onToggle(t.task_id)} />;
          })}
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ data }: { data: any }) {
  if (!data) return <div style={{ color: "#888", padding: 40, textAlign: "center" }}>Loading orders...</div>;
  const { orders, summary } = data;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Orders" value={String(summary.total || 0)} delta="Leather Goods" dir="flat" />
        <KpiCard label="Ready" value={String(summary.ready || 0)} delta="Awaiting pickup" dir="up" />
        <KpiCard label="Overdue" value={String(summary.overdue || 0)} delta="Action needed" dir={summary.overdue > 0 ? "down" : "up"} />
        <KpiCard label="Pending" value={String(summary.pending || 0)} delta="Processing" dir="flat" />
      </div>
      <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <ST>Pickup Order Queue — Leather Goods</ST>
        {orders.length === 0
          ? <div style={{ color: "#888", fontSize: 12 }}>No orders today.</div>
          : <div className="space-y-3">
              {orders.map((o: any) => (
                <div key={o.order_id} className="flex items-center justify-between p-4"
                  style={{ background: o.status === "Overdue" ? "#fff8f8" : "#fafafa", borderLeft: `4px solid ${statusColors[o.status] || "#888"}`, borderRadius: 6, border: "1px solid #f0f0f0" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#888", fontFamily: "monospace" }}>{o.order_id}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{o.customer_name}</div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{o.order_channel} · {o.pickup_time} · ${o.order_value?.toLocaleString()}</div>
                  </div>
                  <span style={{ background: statusColors[o.status] || "#888", color: "white", fontSize: 11, padding: "4px 14px", borderRadius: 4, fontWeight: 700 }}>{o.status}</span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

function InventoryTab({ data }: { data: any }) {
  if (!data) return <div style={{ color: "#888", padding: 40, textAlign: "center" }}>Loading inventory...</div>;
  const { items, summary } = data;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total SKUs" value={String(summary.total_skus)} delta="Leather Goods" dir="flat" />
        <KpiCard label="Low Stock" value={String(summary.low_stock)} delta="Below reorder" dir={summary.low_stock > 0 ? "down" : "up"} />
        <KpiCard label="VIP Selections" value={String(summary.vip_selections)} delta="For VIP Preview" dir="up" />
        <KpiCard label="Total Units" value={String(summary.total_units)} delta="In stock" dir="flat" />
      </div>
      {summary.low_stock > 0 && (
        <div className="bg-white p-4" style={{ border: `1px solid ${RED}`, borderRadius: 8, background: "#fff8f8" }}>
          <ST>⚠ Low Stock Alerts</ST>
          <div className="grid grid-cols-2 gap-3">
            {items.filter((i: any) => i.units_in_stock < i.reorder_point).map((s: any) => (
              <div key={s.sku_id} className="flex items-center justify-between p-3" style={{ background: "white", borderLeft: `3px solid ${RED}`, borderRadius: 6 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#888", fontFamily: "monospace" }}>{s.sku_id}</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{s.product_name}</div>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: 22, fontWeight: 700, color: RED }}>{s.units_in_stock}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>min {s.reorder_point}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white" style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0f0f0", fontSize: 11, letterSpacing: 2, fontWeight: 700, color: "#666", textTransform: "uppercase" as const }}>Full Inventory — Leather Goods</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ background: "#fafafa", color: "#888", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" as const }}>
              <th className="text-left py-3 px-4">SKU</th>
              <th className="text-left">Product</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Sold MTD</th>
              <th className="text-right">vs LY</th>
              <th className="text-left px-4">Flags</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, i: number) => {
              const low = item.units_in_stock < item.reorder_point;
              const vsLy = item.units_sold_ly > 0 ? Math.round((item.units_sold_mtd / item.units_sold_ly - 1) * 100) : 0;
              return (
                <tr key={item.sku_id} style={{ background: i % 2 ? "#fafafa" : "white", borderTop: "1px solid #f0f0f0" }}>
                  <td className="py-3 px-4" style={{ fontFamily: "monospace", color: "#666", fontSize: 11 }}>{item.sku_id}</td>
                  <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                  <td className="text-right" style={{ fontWeight: 700, color: low ? RED : DARK }}>{item.units_in_stock}</td>
                  <td className="text-right">{item.units_sold_mtd}</td>
                  <td className="text-right" style={{ color: vsLy >= 0 ? GREEN : RED, fontWeight: 600 }}>{vsLy >= 0 ? "+" : ""}{vsLy}%</td>
                  <td className="px-4">
                    <div className="flex gap-1">
                      {low && <span style={{ background: RED, color: "white", fontSize: 9, padding: "2px 5px", borderRadius: 3, fontWeight: 700 }}>LOW</span>}
                      {item.is_vip_selection === 1 && <span style={{ background: GOLD, color: DARK, fontSize: 9, padding: "2px 5px", borderRadius: 3, fontWeight: 700 }}>VIP</span>}
                      {item.is_hero_product === 1 && <span style={{ background: BLUE, color: "white", fontSize: 9, padding: "2px 5px", borderRadius: 3, fontWeight: 700 }}>HERO</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NpsTab({ data }: { data: any }) {
  if (!data || !data.dept) return <div style={{ color: "#888", padding: 40, textAlign: "center" }}>Loading NPS data...</div>;
  const { dept, store_avg, all_depts } = data;
  const myRank = all_depts.find((d: any) => d.dept_name === "Leather Goods")?.dept_rank || 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Your Dept NPS" value={String(dept.nps_score)} delta={dept.nps_score >= store_avg ? "Above store avg" : "Below store avg"} dir={dept.nps_score >= store_avg ? "up" : "down"} />
        <KpiCard label="Store Average" value={String(store_avg)} delta="All departments" dir="flat" />
        <KpiCard label="Your Rank" value={`#${myRank} of ${all_depts.length}`} delta="In this store" dir={myRank <= 3 ? "up" : "down"} />
        <KpiCard label="Responses" value={String(dept.response_count)} delta="Customer surveys" dir="flat" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <ST>Leather Goods NPS Breakdown</ST>
          <div className="flex rounded overflow-hidden mb-3" style={{ height: 32 }}>
            <div style={{ width: `${dept.promoters_pct}%`, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, color: "white", fontWeight: 700 }}>Promoters {dept.promoters_pct}%</span>
            </div>
            <div style={{ width: `${dept.passives_pct}%`, background: AMBER, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: "white", fontWeight: 700 }}>{dept.passives_pct}%</span>
            </div>
            <div style={{ width: `${dept.detractors_pct}%`, background: RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: "white", fontWeight: 700 }}>{dept.detractors_pct}%</span>
            </div>
          </div>
          <div style={{ background: dept.nps_score >= store_avg ? "#f0faf4" : "#fff8f8", borderLeft: `4px solid ${dept.nps_score >= store_avg ? GREEN : RED}`, borderRadius: 6, padding: "10px 14px", fontSize: 12 }}>
            {dept.nps_score >= store_avg ? `✓ Your NPS (${dept.nps_score}) is above store average (${store_avg})` : `⚠ Your NPS (${dept.nps_score}) is below store average (${store_avg}) — focus on customer experience.`}
          </div>
        </div>
        <div className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <ST>NPS Ranking — This Store</ST>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={all_depts} layout="vertical">
                <CartesianGrid horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" domain={[60, 85]} tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis dataKey="dept_name" type="category" tick={{ fontSize: 11, fill: "#555" }} width={120} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="nps_score" barSize={18} name="NPS">
                  {all_depts.map((d: any, i: number) => <Cell key={i} fill={d.dept_name === "Leather Goods" ? BLUE : d.nps_score >= store_avg ? GREEN : AMBER} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssociateDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("My Dashboard");
  const [completed, setCompleted] = useState<string[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [npsData, setNpsData] = useState<any>(null);
  const [msgs, setMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/get_associate_tasks`).then(r => r.json()).then(setTasks).catch(console.error);
    fetch(`${API_BASE_URL}/get_associate_orders`).then(r => r.json()).then(setOrders).catch(console.error);
    fetch(`${API_BASE_URL}/get_associate_inventory`).then(r => r.json()).then(setInventory).catch(console.error);
    fetch(`${API_BASE_URL}/get_associate_nps`).then(r => r.json()).then(setNpsData).catch(console.error);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const toggleTask = (id: string) => setCompleted(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id]);

  const send = async (q: string) => {
    if (!q.trim() || loading) return;
    setMsgs(m => [...m, { role: "user", text: q }]);
    setInput(""); setLoading(true);
    try {
      const { job_id } = await api.chat(q, "associate");
      const start = Date.now();
      while (Date.now() - start < 60000) {
        await new Promise(r => setTimeout(r, 1500));
        const result = await api.getChatResult(job_id);
        if (result.status === "done") { setMsgs(m => [...m, { role: "ai", text: result.answer ?? result.result ?? "" }]); break; }
        if (result.status === "error") { setMsgs(m => [...m, { role: "ai", text: result.answer ?? "Error." }]); break; }
      }
    } catch { setMsgs(m => [...m, { role: "ai", text: "Connection error." }]); }
    finally { setLoading(false); }
  };

  const tabs = ["My Dashboard", "Tasks", "Orders", "Inventory", "NPS"];
  const suggested = ["What are my priorities today?", "Which orders are overdue?", "What inventory needs restocking?", "How is my dept NPS?"];
  const tabContent: Record<string, React.ReactNode> = {
    "My Dashboard": <MyDashboardTab tasks={tasks} orders={orders} onToggle={toggleTask} completed={completed} />,
    "Tasks":        <TasksTab tasks={tasks} onToggle={toggleTask} completed={completed} />,
    "Orders":       <OrdersTab data={orders} />,
    "Inventory":    <InventoryTab data={inventory} />,
    "NPS":          <NpsTab data={npsData} />,
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#f5f5f5", fontFamily: "system-ui,sans-serif", fontSize: 13 }}>
      <header className="flex items-center justify-between px-6 py-3" style={{ background: DARK }}>
        <div style={{ color: GOLD, letterSpacing: 3, fontSize: 16, fontWeight: 700 }}>RetailIQ</div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#8892b0", fontSize: 12 }}>Leather Goods · Fifth Avenue Flagship · Shift: 9am–5pm</span>
          <span className="px-3 py-1 text-[11px] ml-2" style={{ background: AMBER, color: DARK, borderRadius: 4, fontWeight: 700 }}>AS</span>
          <button onClick={() => { sessionStorage.removeItem("persona_selected"); navigate({ to: "/persona" }); }}
            className="ml-3 text-[11px]" style={{ color: "#8892b0", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>Switch Role</button>
        </div>
      </header>
      <div className="flex items-center gap-2 px-6 py-1.5" style={{ background: "#16213e" }}>
        {["Experience Layer","Orchestration Layer","Knowledge Layer","Observability Layer"].map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <span style={{ background: "rgba(67,97,238,0.2)", border: "1px solid rgba(67,97,238,0.4)", color: "#a8b2d8", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{l}</span>
            {i < 3 && <span style={{ color: BLUE, fontSize: 11 }}>→</span>}
          </div>
        ))}
        <div className="ml-auto" style={{ color: "#8892b0", fontSize: 11 }}>Leather Goods · Fifth Avenue · May 20, 2025</div>
      </div>
      <nav className="flex px-6" style={{ background: "#1a1a3e", borderBottom: "1px solid #2a2a5e" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ color: activeTab === t ? "white" : "#8892b0", borderBottom: `2px solid ${activeTab === t ? AMBER : "transparent"}`, background: "none", border: "none", padding: "10px 20px", fontSize: 12, cursor: "pointer", fontWeight: activeTab === t ? 600 : 400, letterSpacing: 0.5 }}>{t}</button>
        ))}
      </nav>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">{tabContent[activeTab]}</div>
        <div className="flex flex-col" style={{ width: 340, borderLeft: "1px solid #e0e0e0", background: "white" }}>
          <div className="px-4 py-3" style={{ background: DARK, color: AMBER, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>ASK AI — ASSOCIATE VIEW</div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "#fafafa" }}>
            {msgs.length === 0 && <div style={{ color: "#888", textAlign: "center", marginTop: 40, fontSize: 12, lineHeight: 1.8 }}>Ask about your tasks, orders, inventory alerts, or how to prioritize your day.</div>}
            {msgs.map((m, i) => m.role === "user"
              ? <div key={i} className="flex justify-end"><div className="px-3 py-2" style={{ background: DARK, color: "white", borderRadius: "12px 12px 2px 12px", maxWidth: "85%", fontSize: 12 }}>{m.text}</div></div>
              : <div key={i}><div style={{ color: AMBER, fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>RETAILIQ AGENTS</div><div className="px-3 py-3" style={{ background: "white", borderLeft: `3px solid ${AMBER}`, borderRadius: 6, border: "1px solid #eee", fontSize: 12 }}><FormattedAIText text={m.text} /></div></div>
            )}
            {loading && <div><div style={{ color: AMBER, fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>RETAILIQ AGENTS</div><div className="px-3 py-3" style={{ background: "white", borderLeft: `3px solid ${AMBER}`, borderRadius: 6, border: "1px solid #eee" }}><TypingDots /></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="px-3 py-2 flex gap-2 overflow-x-auto" style={{ borderTop: "1px solid #eee" }}>
            {suggested.map(q => (
              <button key={q} onClick={() => send(q)} className="whitespace-nowrap px-3 py-1.5 text-[10px] hover:opacity-80"
                style={{ background: "#fff8f0", color: "#b07d1a", border: `1px solid ${GOLD}88`, borderRadius: 16, flexShrink: 0 }}>{q}</button>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="p-3 flex gap-2" style={{ borderTop: "1px solid #eee" }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about tasks, orders, inventory..."
              className="flex-1 px-3 py-2 text-[12px]" style={{ border: "1px solid #e0e0e0", borderRadius: 4, outline: "none" }} />
            <button type="submit" className="px-3 py-2 text-[11px] font-semibold" style={{ background: AMBER, color: DARK, border: "none", borderRadius: 4, fontWeight: 700 }}>Ask →</button>
          </form>
        </div>
      </div>
    </div>
  );
}