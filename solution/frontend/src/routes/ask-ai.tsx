import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Shell } from "@/components/storeiq/Shell";
import { FormattedAIText, TypingDots } from "@/components/storeiq/AISummary";
import { categoryPerf, clientSegments, dailyTrend, inventory, kpis, staff, suggestedQuestions } from "@/lib/mockData";
import { api } from "@/services/api";

export const Route = createFileRoute("/ask-ai")({
  head: () => ({ meta: [{ title: "StoreIQ — Ask AI" }, { name: "description", content: "5-agent retail intelligence chat." }] }),
  component: AskAI,
});

const GOLD = "#c9a96e", GREEN = "#1a6b3c", RED = "#c62828", BLUE = "#1565c0";

type Msg = { role: "user" | "ai"; text: string };
type Visual = "default" | "categories" | "clients" | "staff" | "inventory" | "trend";

function classify(q: string): Visual {
  const s = q.toLowerCase();
  if (/categor|product|push|leather|rtw|ready-to-wear/.test(s)) return "categories";
  if (/client|segment|top tier|repeater|vip clien/.test(s)) return "clients";
  if (/staff|staffing|advisor|mandarin|language|vacation|team/.test(s)) return "staff";
  if (/inventory|sku|stock|reorder/.test(s)) return "inventory";
  if (/trend|daily|gap|ly|close the gap/.test(s)) return "trend";
  return "default";
}

function mockAnswer(q: string, v: Visual): string {
  const map: Record<Visual, string> = {
    categories: `INSIGHT\nLeather Goods +10% vs LY is your strongest pull; RTW -13% is dragging the comp.\n\nRECOMMENDATION\nLean into Leather: feature LG-1042 and the Crossbody Mini in the bay-1 plinth this week.\n\nNEXT STEPS\n• Reorder LG-1042 (2 units remaining)\n• Brief team on 3 leather hero stories\n• Move 1 RTW look to window B`,
    clients: `INSIGHT\nTop Tier visits down -10% YoY but their basket is stable. The gap is reactivation, not spend.\n\nRECOMMENDATION\nReactivate 47 Top Tier clients dormant >60 days with personal SS25 preview invitations.\n\nNEXT STEPS\n• Pull list at 10am\n• Assign 8 per senior CA\n• Track RSVPs by EOD May 22`,
    staff: `INSIGHT\nLucas Moreau and Aria Tanaka are both on vacation May 26–30, overlapping the SS25 preview.\n\nRECOMMENDATION\nRe-allocate their VIPs to Isabella Conti and Yuki Sato — both Top tier with overlapping language coverage.\n\nNEXT STEPS\n• Mei Chen and Yuki Sato cover Mandarin floor\n• Confirm Noor Haddad for Middle East VIPs\n• Brief Camille on RTW handover`,
    inventory: `INSIGHT\n3 hero SKUs are below reorder point while 2 RTW pieces are overstocked.\n\nRECOMMENDATION\nReorder LG-1042, LG-1188, RTW-2210 today. Markdown plan for SH-3340 next cycle.\n\nNEXT STEPS\n• Submit PO before 3pm\n• Pull VIP picks to consult room\n• Flag overstock to merchandising`,
    trend: `INSIGHT\nMTD gap is -9.0%, concentrated in days 8-14 where appointments dropped 22%.\n\nRECOMMENDATION\nDouble appointment booking targets through May 26; SPT and ASP are healthy so traffic recovery closes the gap.\n\nNEXT STEPS\n• 2 outbound calls per CA per day\n• Re-engage the 47-client reactivation list\n• Daily 9am huddle on booking pipeline`,
    default: `INSIGHT\nYou're tracking -9.0% vs LY MTD with strong SPT.\n\nRECOMMENDATION\nFocus today on traffic + leather goods push.\n\nNEXT STEPS\n• Reactivate Top Tier dormant clients\n• Reorder LG-1042\n• Confirm VIP event staffing`,
  };
  return map[v];
}

function StaffVisual() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {staff.filter((s) => s.group === "Selling Team").slice(0, 8).map((s) => (
        <div key={s.name} className="p-3" style={{ border: `1px solid ${s.onVacation ? RED : "#e0e0e0"}`, borderRadius: 6, background: "white" }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
          <div style={{ fontSize: 11, color: "#888" }}>{s.role}</div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {s.langs.map((l) => <span key={l} style={{ background: "#faf4e4", color: "#8a7240", border: "1px solid #e8dcb6", padding: "1px 6px", fontSize: 10, borderRadius: 3, letterSpacing: 1 }}>{l}</span>)}
          </div>
          <div className="flex justify-between items-center mt-2">
            {s.tier && <span style={{ background: s.tier === "Top" ? GOLD : s.tier === "Mid" ? BLUE : "#888", color: "white", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>{s.tier}</span>}
            {s.onVacation && <span style={{ background: RED, color: "white", fontSize: 10, padding: "2px 6px", borderRadius: 3 }}>ON VACATION</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryVisual() {
  const data = [...inventory].sort((a, b) => a.units_in_stock - b.units_in_stock).slice(0, 10).map((i) => ({
    name: i.sku,
    units: i.units_in_stock,
    low: i.units_in_stock < 5,
    vip: i.is_vip_selection,
  }));
  return (
    <div style={{ height: 360, padding: 16 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#888" }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#555" }} width={80} />
          <Tooltip />
          <Bar dataKey="units" barSize={14}>
            {data.map((d, i) => <Cell key={i} fill={d.vip ? GOLD : d.low ? RED : GREEN} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DefaultVisual() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {kpis.map((k) => (
        <div key={k.label} className="p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8, background: "white" }}>
          <div style={{ color: "#888", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>{k.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{k.value}</div>
          <div style={{ fontSize: 11, color: k.dir === "up" ? GREEN : k.dir === "down" ? RED : "#888", fontWeight: 600, marginTop: 4 }}>
            {k.dir === "up" ? "▲" : k.dir === "down" ? "▼" : "—"} {k.dir === "flat" ? "flat" : `${Math.abs(k.delta)}%`} vs LY
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoriesVisual() {
  return (
    <div style={{ height: 360, padding: 16 }}>
      <ResponsiveContainer>
        <BarChart data={categoryPerf} margin={{ left: 0, right: 16 }}>
          <CartesianGrid stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#666" }} />
          <YAxis tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="ly" fill="#d0d0d0" name="LY" />
          <Bar dataKey="ty" fill={GOLD} name="TY" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ClientsVisual() {
  return (
    <div style={{ height: 360, padding: 16 }}>
      <ResponsiveContainer>
        <BarChart data={clientSegments} margin={{ left: 0, right: 16 }}>
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
  );
}

function TrendVisual() {
  return (
    <div style={{ height: 360, padding: 16 }}>
      <ResponsiveContainer>
        <LineChart data={dailyTrend}>
          <CartesianGrid stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#888" }} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: "#888" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="ly" stroke="#bdbdbd" strokeDasharray="4 4" strokeWidth={2} dot={false} name="LY" />
          <Line type="monotone" dataKey="ty" stroke={GOLD} strokeWidth={2.5} dot={false} name="TY" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AskAI() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [visual, setVisual] = useState<Visual>("default");
  const [animKey, setAnimKey] = useState(0);

  const send = async (q: string) => {
    if (!q.trim() || loading) return;
    const v = classify(q);
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const { job_id } = await api.chat(q, "store_manager");
      const start = Date.now();
      let answer = "";
      while (Date.now() - start < 60000) {
        await new Promise((r) => setTimeout(r, 1500));
        const result = await api.getChatResult(job_id);
        if (result.status === "done") {
          answer = result.answer ?? result.result ?? "";
          break;
        }
        if (result.status === "error") {
          answer = result.answer ?? "Something went wrong. Please try again.";
          break;
        }
      }
      setMsgs((m) => [...m, { role: "ai", text: answer || mockAnswer(q, v) }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "ai", text: mockAnswer(q, v) }]);
    } finally {
      setVisual(v);
      setAnimKey((k) => k + 1);
      setLoading(false);
    }
  };

  const visualEl = {
    default: <DefaultVisual />,
    categories: <CategoriesVisual />,
    clients: <ClientsVisual />,
    staff: <StaffVisual />,
    inventory: <InventoryVisual />,
    trend: <TrendVisual />,
  }[visual];

  return (
    <Shell fullHeight>
      <div className="flex-1 grid grid-cols-2 overflow-hidden" style={{ minHeight: 0 }}>
        {/* LEFT — Chat */}
        <div className="flex flex-col overflow-hidden" style={{ borderRight: "1px solid #e0e0e0", minHeight: 0 }}>
          <div className="px-5 py-3" style={{ background: "#1a1a1a", color: GOLD, letterSpacing: 2, fontSize: 12, fontWeight: 600 }}>
            ASK AI — 5-AGENT INTELLIGENCE
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ background: "#fafafa" }}>
            {msgs.length === 0 && (
              <div style={{ color: "#888", textAlign: "center", marginTop: 40, fontSize: 12 }}>
                Ask anything about your store — sales, clients, staff, inventory, events.
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="px-4 py-2.5" style={{ background: "#1a1a1a", color: "white", borderRadius: 14, borderTopRightRadius: 4, maxWidth: "80%", fontSize: 12 }}>
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i}>
                  <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>STOREIQ AGENTS</div>
                  <div className="px-4 py-3" style={{ background: "white", borderLeft: `3px solid ${GOLD}`, borderRadius: 6, border: "1px solid #eee", maxWidth: "90%", fontSize: 12 }}>
                    <FormattedAIText text={m.text} />
                  </div>
                </div>
              )
            )}
            {loading && (
              <div>
                <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>STOREIQ AGENTS</div>
                <div className="px-4 py-3" style={{ background: "white", borderLeft: `3px solid ${GOLD}`, borderRadius: 6, border: "1px solid #eee", maxWidth: 120 }}>
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          {/* Suggested chips */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto" style={{ borderTop: "1px solid #eee", background: "white" }}>
            {suggestedQuestions.map((q) => (
              <button key={q} onClick={() => send(q)} className="whitespace-nowrap px-3 py-1.5 text-[11px] hover:opacity-80"
                style={{ background: "#faf4e4", color: "#8a7240", border: "1px solid #e8dcb6", borderRadius: 16 }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 flex gap-2" style={{ borderTop: "1px solid #eee", background: "white" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the agents…" className="flex-1 px-3 py-2 text-[13px]"
              style={{ border: "1px solid #e0e0e0", borderRadius: 4, outline: "none" }} />
            <button type="submit" className="px-4 py-2 text-[12px] font-medium" style={{ background: GOLD, color: "#1a1a1a", border: "none", borderRadius: 4, letterSpacing: 0.5 }}>
              Ask AI →
            </button>
          </form>
        </div>

        {/* RIGHT — Visual */}
        <div className="flex flex-col bg-white overflow-hidden">
          <div className="px-5 py-3" style={{ background: "#1a1a1a", color: GOLD, letterSpacing: 2, fontSize: 12, fontWeight: 600 }}>
            LIVE INSIGHTS
          </div>
          <div key={animKey} className="flex-1 overflow-y-auto" style={{ animation: "siq-fade .4s ease" }}>
            {visualEl}
          </div>
          <style>{`@keyframes siq-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
        </div>
      </div>
    </Shell>
  );
}
