import { createFileRoute } from "@tanstack/react-router";
import { Card, Shell } from "@/components/storeiq/Shell";
import { events as mockEvents, staff as mockStaff } from "@/lib/mockData";
import { useStaff, useEvents } from "@/hooks/useLiveData";

export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "StoreIQ — Staff & Events" }, { name: "description", content: "Staff roster and upcoming events." }] }),
  component: StaffPage,
});

const GOLD = "#c9a96e", RED = "#c62828", BLUE = "#1565c0";

const typeColor = (t: string) => ({ VIP: GOLD, Training: BLUE, Operations: "#888", Animation: "#1a6b3c" }[t] || "#888");

function StaffCard({ s }: { s: any }) {
  const tierColor = s.tier === "Top" ? GOLD : s.tier === "Mid" ? BLUE : "#888";
  return (
    <div className="p-3 bg-white" style={{ border: `1px solid ${s.onVacation ? RED : "#e0e0e0"}`, borderRadius: 8 }}>
      <div className="flex justify-between items-start">
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
          <div style={{ fontSize: 11, color: "#888" }}>{s.role}</div>
        </div>
        {s.tier && <span style={{ background: tierColor, color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 3, letterSpacing: 1 }}>{s.tier}</span>}
      </div>
      <div className="flex gap-1 mt-2 flex-wrap">
        {s.langs.map((l: string) => <span key={l} style={{ background: "#faf4e4", color: "#8a7240", border: "1px solid #e8dcb6", padding: "1px 6px", fontSize: 10, borderRadius: 3, letterSpacing: 1 }}>{l}</span>)}
      </div>
      {s.specialty && <div className="mt-2 text-[11px]" style={{ color: "#666" }}>Specialty: {s.specialty}</div>}
      {s.onVacation && (
        <div className="mt-2 inline-block" style={{ background: RED, color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 3, letterSpacing: 1, fontWeight: 600 }}>
          ON VACATION MAY 26-30
        </div>
      )}
    </div>
  );
}

function StaffPage() {
  const groups: Array<typeof staff[number]["group"]> = ["Management", "Selling Team", "Back Office"];
  const { staff: liveStaff } = useStaff();
  const { events: liveEvents } = useEvents();
  const staff = liveStaff ?? mockStaff;
  const events = liveEvents ?? mockEvents;
  return (
    <Shell>
      <div className="grid gap-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        {/* LEFT */}
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g} title={g.toUpperCase()}>
              <div className="grid grid-cols-2 gap-3">
                {staff.filter((s) => s.group === g).map((s) => <StaffCard key={s.name} s={s} />)}
              </div>
            </Card>
          ))}
        </div>

        {/* RIGHT — events timeline */}
        <Card title="UPCOMING EVENTS">
          <div className="relative" style={{ paddingLeft: 20 }}>
            <div style={{ position: "absolute", left: 6, top: 6, bottom: 6, width: 2, background: "#eee" }} />
            <div className="space-y-4">
              {events.map((e) => {
                const isVip = e.type === "VIP";
                return (
                  <div key={e.name} className="relative">
                    <div style={{ position: "absolute", left: -18, top: 6, width: 12, height: 12, borderRadius: "50%", background: typeColor(e.type), border: "2px solid white", boxShadow: "0 0 0 1px #ddd" }} />
                    <div className="p-3" style={{ border: `${isVip ? 2 : 1}px solid ${isVip ? GOLD : "#e0e0e0"}`, borderRadius: 8, background: isVip ? "#fffdf0" : "white" }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div style={{ fontSize: 11, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>{e.date} · {e.type}</div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{e.name}</div>
                        </div>
                        {e.expected && <div style={{ fontSize: 11, color: "#666" }}>{e.expected} clients</div>}
                      </div>
                      {e.category && <div className="mt-1 text-[11px]" style={{ color: "#666" }}>Focus: {e.category}</div>}
                      {isVip && e.staff && (
                        <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f0e9c8" }}>
                          <div style={{ fontSize: 10, letterSpacing: 1.5, color: GOLD, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Assigned Staff</div>
                          <div className="flex flex-wrap gap-1">
                            {e.staff.map((n: string) => <span key={n} style={{ background: "white", border: `1px solid ${GOLD}`, color: "#1a1a1a", padding: "2px 8px", fontSize: 11, borderRadius: 3 }}>{n}</span>)}
                          </div>
                          {e.notes && <div className="mt-2 text-[11px]" style={{ color: "#666", lineHeight: 1.5 }}>{e.notes}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
