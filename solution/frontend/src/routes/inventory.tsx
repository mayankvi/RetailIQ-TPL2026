import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/storeiq/Shell";
import { inventory as mockInventory } from "@/lib/mockData";
import { useInventory } from "@/hooks/useLiveData";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "StoreIQ — Inventory" }, { name: "description", content: "Inventory health and VIP selections." }] }),
  component: InventoryPage,
});

const GOLD = "#c9a96e", GREEN = "#1a6b3c", RED = "#c62828", BLUE = "#1565c0", ORANGE = "#e67e22";

function statusBadges(i: any) {
  const out: { label: string; color: string }[] = [];
  if (i.units_in_stock < i.reorder_point) out.push({ label: "LOW STOCK", color: RED });
  if (i.is_vip_selection) out.push({ label: "VIP PICK", color: GOLD });
  if (i.is_hero_product) out.push({ label: "HERO", color: BLUE });
  if (i.units_in_stock > 15) out.push({ label: "OVERSTOCK", color: ORANGE });
  return out;
}

function InventoryPage() {
  const { inventory: liveInventory } = useInventory();
  const inventory = liveInventory ?? mockInventory;
  const [cat, setCat] = useState("All");
  const [lowOnly, setLowOnly] = useState(false);
  const [vipOnly, setVipOnly] = useState(false);
  const categories = useMemo(() => ["All", ...Array.from(new Set(inventory.map((i) => i.category)))], []);

  const rows = useMemo(() => {
    return [...inventory]
      .filter((i) => cat === "All" || i.category === cat)
      .filter((i) => !lowOnly || i.units_in_stock < i.reorder_point)
      .filter((i) => !vipOnly || i.is_vip_selection)
      .sort((a, b) => a.units_in_stock - b.units_in_stock);
  }, [cat, lowOnly, vipOnly]);

  const totals = useMemo(() => ({
    total: inventory.length,
    low: inventory.filter((i) => i.units_in_stock < i.reorder_point).length,
    vip: inventory.filter((i) => i.is_vip_selection).length,
    over: inventory.filter((i) => i.units_in_stock > 15).length,
  }), []);

  return (
    <Shell>
      {/* filter bar */}
      <div className="bg-white px-4 py-3 mb-4 flex items-center gap-4 flex-wrap" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
        <label className="flex items-center gap-2 text-[12px]" style={{ color: "#555" }}>
          <span style={{ color: "#888" }}>Category:</span>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="px-2 py-1 bg-white" style={{ border: "1px solid #e0e0e0", borderRadius: 4 }}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[12px] cursor-pointer">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low Stock Only
        </label>
        <label className="flex items-center gap-2 text-[12px] cursor-pointer">
          <input type="checkbox" checked={vipOnly} onChange={(e) => setVipOnly(e.target.checked)} />
          VIP Selections Only
        </label>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total SKUs", value: totals.total, color: "#1a1a1a" },
          { label: "Low Stock Items", value: totals.low, color: RED },
          { label: "VIP Selections", value: totals.vip, color: GOLD },
          { label: "Overstocked Items", value: totals.over, color: ORANGE },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4" style={{ border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <div style={{ color: "#888", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white" style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ background: "#fafafa", color: "#888", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
              <th className="text-left py-3 px-4">SKU</th>
              <th className="text-left">Product Name</th>
              <th className="text-left">Category</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Sold MTD</th>
              <th className="text-right">vs LY</th>
              <th className="text-left px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i, idx) => {
              const badges = statusBadges(i);
              const low = i.units_in_stock < i.reorder_point;
              return (
                <tr key={i.sku} style={{ background: idx % 2 ? "#fafafa" : "white", borderTop: "1px solid #f0f0f0" }}>
                  <td className="py-3 px-4" style={{ fontFamily: "ui-monospace, monospace", color: "#666" }}>{i.sku}</td>
                  <td style={{ fontWeight: 600 }}>{i.name}</td>
                  <td style={{ color: "#666" }}>{i.category}</td>
                  <td className="text-right" style={{ fontWeight: 700, color: low ? RED : "#1a1a1a" }}>{i.units_in_stock}</td>
                  <td className="text-right">{i.sold_mtd}</td>
                  <td className="text-right" style={{ color: i.vs_ly >= 0 ? GREEN : RED, fontWeight: 600 }}>{i.vs_ly >= 0 ? "+" : ""}{i.vs_ly}%</td>
                  <td className="px-4">
                    <div className="flex gap-1 flex-wrap">
                      {badges.map((b) => (
                        <span key={b.label} style={{ background: b.color, color: "white", fontSize: 9, padding: "2px 6px", borderRadius: 3, letterSpacing: 1, fontWeight: 600 }}>{b.label}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
