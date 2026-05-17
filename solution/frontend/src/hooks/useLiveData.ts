import { useEffect, useState } from "react";
import { api } from "@/services/api";

// ── KPIs ─────────────────────────────────────────────────────────────────────
function fmtCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${Math.round(val)}`;
}

function fmtNumber(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return `${Math.round(val)}`;
}

export function useKpis() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getKpis()
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!data) return { kpis: null, loading, meta: null };

  const kpis = [
    {
      label: "Sales MTD",
      value: fmtCurrency(data.sales?.ty ?? 0),
      delta: Math.abs(data.sales?.vs?.pct ?? 0),
      dir: (data.sales?.vs?.pct ?? 0) >= 0 ? "up" : "down",
    },
    {
      label: "Transactions",
      value: fmtNumber(data.transactions?.ty ?? 0),
      delta: Math.abs(data.transactions?.vs?.pct ?? 0),
      dir: (data.transactions?.vs?.pct ?? 0) >= 0 ? "up" : "down",
    },
    {
      label: "SPT",
      value: fmtCurrency(data.spt?.ty ?? 0),
      delta: Math.abs(data.spt?.vs?.pct ?? 0),
      dir: (data.spt?.vs?.pct ?? 0) >= 0 ? "up" : (data.spt?.vs?.pct ?? 0) < 0 ? "down" : "flat",
    },
    {
      label: "ASP",
      value: fmtCurrency(data.asp?.ty ?? 0),
      delta: Math.abs(data.asp?.vs?.pct ?? 0),
      dir: (data.asp?.vs?.pct ?? 0) >= 0 ? "up" : "down",
    },
    {
      label: "UPT",
      value: (data.upt?.ty ?? 0).toFixed(1),
      delta: Math.abs(data.upt?.vs?.pct ?? 0),
      dir: (data.upt?.vs?.pct ?? 0) === 0 ? "flat" : (data.upt?.vs?.pct ?? 0) > 0 ? "up" : "down",
    },
    {
      label: "Clients",
      value: fmtNumber(data.unique_clients?.ty ?? 0),
      delta: Math.abs(data.unique_clients?.vs?.pct ?? 0),
      dir: (data.unique_clients?.vs?.pct ?? 0) >= 0 ? "up" : "down",
    },
  ] as const;

  const meta = {
    gapToLy: data.gap_to_ly ?? 0,
    daysRemaining: data.days_remaining ?? 0,
    salesNeededDay: data.sales_needed_day ?? 0,
    projectedMonth: data.projected_month ?? 0,
  };

  return { kpis, loading, meta };
}

// ── CATEGORY PERFORMANCE ─────────────────────────────────────────────────────
export function useCategoryPerf() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWhat()
      .then((d: any[]) => {
        const mapped = d.map((r) => ({
          name: r.category,
          ty: Math.round(r.sales_ty),
          ly: Math.round(r.sales_ly),
          delta: r.vs_ly_pct ?? 0,
        }));
        setData(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categoryPerf: data.length ? data : null, loading };
}

// ── CLIENT SEGMENTS ───────────────────────────────────────────────────────────
export function useClientSegments() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWhom()
      .then((d: any) => {
        const mapped = (d.pyramid ?? []).map((r: any) => ({
          name: r.client_segment,
          ty: Math.round(r.sales_ty),
          ly: Math.round(r.sales_ly),
        }));
        setData(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { clientSegments: data.length ? data : null, loading };
}

// ── TOP ADVISORS ──────────────────────────────────────────────────────────────
export function useTopAdvisors() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWho()
      .then((d: any) => {
        const mapped = (d.top_cas ?? []).slice(0, 5).map((r: any) => ({
          name: r.name,
          sales: Math.round(r.sales),
          tx: r.transactions,
          spt: Math.round(r.spt),
          vsLy: 0,
          tier: r.performance_tier ?? "Mid",
        }));
        setData(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { topAdvisors: data.length ? data : null, loading };
}

// ── DAILY TREND ───────────────────────────────────────────────────────────────
export function useDailyTrend() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTrend()
      .then((d: any) => {
        const tyMap = Object.fromEntries((d.ty ?? []).map((r: any) => [r.date, r.sales_ty]));
        const lyMap = Object.fromEntries((d.ly ?? []).map((r: any) => [r.date, r.sales_ly]));
        const allDates = Array.from(new Set([...Object.keys(tyMap), ...Object.keys(lyMap)])).sort();
        const mapped = allDates.map((date) => ({
          day: `May ${parseInt(date.split("-")[2])}`,
          ty: Math.round(tyMap[date] ?? 0),
          ly: Math.round(lyMap[date] ?? 0),
        }));
        setData(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { dailyTrend: data.length ? data : null, loading };
}

// ── APPOINTMENTS ──────────────────────────────────────────────────────────────
export function useAppointments() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAppointments()
      .then((d: any) => {
        setData({
          appt: {
            pct: Math.round(d.appointment_pct ?? 32),
            spt: Math.round(d.appointment?.spt ?? 3800),
          },
          organic: {
            pct: Math.round(d.organic_pct ?? 68),
            spt: Math.round(d.organic?.spt ?? 3200),
          },
          target: 40,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { appointments: data, loading };
}

// ── STAFF ─────────────────────────────────────────────────────────────────────
export function useStaff() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStaff()
      .then((d: any[]) => {
        const mapped = d.map((r) => ({
          name: r.name,
          role: r.job_title,
          group: r.macro_group as "Management" | "Selling Team" | "Back Office",
          langs: (r.language_skills ?? "English").split(",").map((l: string) => l.trim().substring(0, 2).toUpperCase()),
          tier: r.performance_tier as "Top" | "Mid" | "Junior" | undefined,
          specialty: r.speciality,
          onVacation: r.on_vacation === 1 || r.on_vacation === true,
        }));
        setData(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { staff: data.length ? data : null, loading };
}

// ── EVENTS ────────────────────────────────────────────────────────────────────
export function useEvents() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvents()
      .then((d: any[]) => {
        const mapped = d.map((r) => ({
          date: new Date(r.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          name: r.event_name,
          type: r.event_type as "VIP" | "Training" | "Operations" | "Animation",
          expected: r.expected_clients > 0 ? r.expected_clients : undefined,
          category: r.category_focus,
          staff: r.assigned_staff ? r.assigned_staff.split(",").map((s: string) => s.trim()) : undefined,
          notes: r.notes,
        }));
        setData(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { events: data.length ? data : null, loading };
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────
export function useInventory() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInventory()
      .then((d: any[]) => {
        const mapped = d.map((r) => ({
          sku: r.sku_id,
          name: r.product_name,
          category: r.category,
          units_in_stock: r.units_in_stock,
          reorder_point: r.reorder_point,
          sold_mtd: r.units_sold_mtd,
          vs_ly: r.units_sold_ly > 0
            ? Math.round(((r.units_sold_mtd - r.units_sold_ly) / r.units_sold_ly) * 100)
            : 0,
          is_vip_selection: r.is_vip_selection === 1 || r.is_vip_selection === true,
          is_hero_product: r.is_hero_product === 1 || r.is_hero_product === true,
        }));
        setData(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { inventory: data.length ? data : null, loading };
}

// ── SUGGESTED QUESTIONS ───────────────────────────────────────────────────────
export function useSuggestedQuestions() {
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    api.getSuggestedQuestions()
      .then((d: any) => setData(d.questions ?? []))
      .catch(() => {});
  }, []);

  return data;
}

// ── CHAT ──────────────────────────────────────────────────────────────────────
export async function sendChat(question: string): Promise<string> {
  const { job_id } = await api.chat(question);
  const start = Date.now();
  while (Date.now() - start < 60000) {
    await new Promise((r) => setTimeout(r, 1000));
    const result = await api.getChatResult(job_id);
    if (result.status === "done") return result.result ?? "";
    if (result.status === "error") throw new Error("Agent error");
  }
  throw new Error("Timeout");
}