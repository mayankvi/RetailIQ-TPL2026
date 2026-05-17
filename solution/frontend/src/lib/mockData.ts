export const kpis = [
  { label: "Sales MTD", value: "$1.08M", delta: -9.0, dir: "down" as const },
  { label: "Transactions", value: "297", delta: -12.9, dir: "down" as const },
  { label: "SPT", value: "$3,626", delta: 4.5, dir: "up" as const },
  { label: "ASP", value: "$1,723", delta: 1.2, dir: "up" as const },
  { label: "UPT", value: "2.0", delta: 0, dir: "flat" as const },
  { label: "Clients", value: "181", delta: -10.8, dir: "down" as const },
];

export const categoryPerf = [
  { name: "Leather Goods", ty: 480000, ly: 436000, delta: 10 },
  { name: "Ready-to-Wear", ty: 220000, ly: 253000, delta: -13 },
  { name: "Shoes", ty: 160000, ly: 168000, delta: -5 },
  { name: "Accessories", ty: 110000, ly: 102000, delta: 8 },
  { name: "Fragrances", ty: 65000, ly: 71000, delta: -8 },
  { name: "Jewelry", ty: 45000, ly: 52000, delta: -13 },
];

export const appointments = {
  appt: { pct: 32, spt: 3800 },
  organic: { pct: 68, spt: 3200 },
  target: 40,
};

export const dailyTrend = Array.from({ length: 20 }, (_, i) => {
  const d = i + 1;
  const ty = 40000 + Math.round(Math.sin(i / 2.3) * 12000 + (i % 5) * 2200);
  const ly = 44000 + Math.round(Math.sin(i / 2.1 + 1) * 11000 + (i % 4) * 2400);
  return { day: `May ${d}`, ty, ly };
});

export const clientSegments = [
  { name: "Top Tier", ty: 38, ly: 42 },
  { name: "High Potential", ty: 29, ly: 26 },
  { name: "Repeater 10K+", ty: 44, ly: 51 },
  { name: "Repeater", ty: 41, ly: 47 },
  { name: "One-Timer", ty: 29, ly: 37 },
];

export const topAdvisors = [
  { name: "Isabella Conti", sales: 218000, tx: 41, spt: 5317, vsLy: 12, tier: "Top" },
  { name: "Lucas Moreau", sales: 184000, tx: 38, spt: 4842, vsLy: -3, tier: "Top" },
  { name: "Mei Chen", sales: 142000, tx: 33, spt: 4303, vsLy: 8, tier: "Mid" },
  { name: "James Whitfield", sales: 121000, tx: 36, spt: 3361, vsLy: -7, tier: "Mid" },
  { name: "Sofia Rinaldi", sales: 88000, tx: 29, spt: 3034, vsLy: 2, tier: "Junior" },
];

export type StaffMember = {
  name: string;
  role: string;
  group: "Management" | "Selling Team" | "Back Office";
  langs: string[];
  tier?: "Top" | "Mid" | "Junior";
  specialty?: string;
  onVacation?: boolean;
};

export const staff: StaffMember[] = [
  { name: "Charlotte Aubert", role: "Store Director", group: "Management", langs: ["EN", "FR"] },
  { name: "Henri Lavigne", role: "Assistant Director", group: "Management", langs: ["EN", "FR", "IT"] },
  { name: "Isabella Conti", role: "Senior Client Advisor", group: "Selling Team", langs: ["EN", "IT", "FR"], tier: "Top", specialty: "Leather Goods" },
  { name: "Lucas Moreau", role: "Senior Client Advisor", group: "Selling Team", langs: ["EN", "FR"], tier: "Top", specialty: "Ready-to-Wear", onVacation: true },
  { name: "Mei Chen", role: "Client Advisor", group: "Selling Team", langs: ["EN", "MN", "CN"], tier: "Mid", specialty: "VIP Asia" },
  { name: "James Whitfield", role: "Client Advisor", group: "Selling Team", langs: ["EN"], tier: "Mid", specialty: "Menswear" },
  { name: "Sofia Rinaldi", role: "Client Advisor", group: "Selling Team", langs: ["EN", "IT"], tier: "Junior", specialty: "Accessories" },
  { name: "Aria Tanaka", role: "Senior Client Advisor", group: "Selling Team", langs: ["EN", "JP"], tier: "Top", specialty: "Jewelry", onVacation: true },
  { name: "Diego Alvarez", role: "Client Advisor", group: "Selling Team", langs: ["EN", "ES"], tier: "Mid", specialty: "Shoes" },
  { name: "Noor Haddad", role: "Client Advisor", group: "Selling Team", langs: ["EN", "AR", "FR"], tier: "Mid", specialty: "VIP Middle East" },
  { name: "Olivia Bennett", role: "Client Advisor", group: "Selling Team", langs: ["EN"], tier: "Junior", specialty: "Fragrances" },
  { name: "Ryo Nakamura", role: "Client Advisor", group: "Selling Team", langs: ["EN", "JP"], tier: "Junior", specialty: "Leather Goods" },
  { name: "Camille Dubois", role: "Client Advisor", group: "Selling Team", langs: ["EN", "FR"], tier: "Mid", specialty: "RTW" },
  { name: "Marcus King", role: "Client Advisor", group: "Selling Team", langs: ["EN"], tier: "Junior", specialty: "Menswear" },
  { name: "Yuki Sato", role: "Client Advisor", group: "Selling Team", langs: ["EN", "JP", "CN"], tier: "Top", specialty: "VIP Asia" },
  { name: "Priya Kapoor", role: "Client Advisor", group: "Selling Team", langs: ["EN", "HI"], tier: "Mid", specialty: "Jewelry" },
  { name: "Tomás Ferreira", role: "Stock Manager", group: "Back Office", langs: ["EN", "PT", "ES"] },
  { name: "Hannah Klein", role: "Operations Lead", group: "Back Office", langs: ["EN", "DE"] },
  { name: "Sébastien Roy", role: "Visual Merchandiser", group: "Back Office", langs: ["EN", "FR"] },
  { name: "Anya Volkov", role: "CRM Specialist", group: "Back Office", langs: ["EN", "RU"] },
  { name: "Felix Brandt", role: "Stockroom Associate", group: "Back Office", langs: ["EN"] },
  { name: "Mariana Lopes", role: "Concierge", group: "Back Office", langs: ["EN", "PT", "ES"] },
];

export type EventItem = {
  date: string;
  name: string;
  type: "VIP" | "Training" | "Operations" | "Animation";
  expected?: number;
  category?: string;
  staff?: string[];
  notes?: string;
};

export const events: EventItem[] = [
  { date: "May 21", name: "RTW Morning Briefing", type: "Training", category: "Ready-to-Wear" },
  { date: "May 23", name: "Window Refresh — Summer Edit", type: "Operations" },
  { date: "May 24", name: "Fragrance Discovery Saturday", type: "Animation", expected: 80, category: "Fragrances" },
  {
    date: "May 27",
    name: "SS25 RTW & Accessories Preview",
    type: "VIP",
    expected: 35,
    category: "Ready-to-Wear / Accessories",
    staff: ["Isabella Conti", "Mei Chen", "Yuki Sato", "Noor Haddad", "Camille Dubois"],
    notes: "2 senior CAs on vacation (Lucas Moreau, Aria Tanaka). Re-allocate VIPs to Isabella & Yuki. Champagne service from 5pm.",
  },
  { date: "May 29", name: "Leather Care Clinic", type: "Animation", expected: 24, category: "Leather Goods" },
  { date: "May 31", name: "Month-end Inventory Count", type: "Operations" },
];

export type InventoryItem = {
  sku: string;
  name: string;
  category: string;
  units_in_stock: number;
  reorder_point: number;
  sold_mtd: number;
  vs_ly: number;
  is_vip_selection?: boolean;
  is_hero_product?: boolean;
};

export const inventory: InventoryItem[] = [
  { sku: "LG-1042", name: "Petite Sellier Tote — Noir", category: "Leather Goods", units_in_stock: 2, reorder_point: 5, sold_mtd: 14, vs_ly: 22, is_vip_selection: true, is_hero_product: true },
  { sku: "LG-1188", name: "Crossbody Mini — Camel", category: "Leather Goods", units_in_stock: 3, reorder_point: 6, sold_mtd: 11, vs_ly: 18 },
  { sku: "RTW-2210", name: "Silk Plissé Midi Dress", category: "Ready-to-Wear", units_in_stock: 4, reorder_point: 5, sold_mtd: 7, vs_ly: -12, is_vip_selection: true },
  { sku: "SH-3301", name: "Calfskin Loafer — Ebony", category: "Shoes", units_in_stock: 5, reorder_point: 6, sold_mtd: 9, vs_ly: 4 },
  { sku: "AC-4420", name: "Silk Twill Scarf — Equestrian", category: "Accessories", units_in_stock: 6, reorder_point: 8, sold_mtd: 15, vs_ly: 11, is_hero_product: true },
  { sku: "JW-5501", name: "18k Chain Bracelet", category: "Jewelry", units_in_stock: 8, reorder_point: 4, sold_mtd: 5, vs_ly: -6 },
  { sku: "FR-6610", name: "Eau de Parfum 100ml — Oud", category: "Fragrances", units_in_stock: 9, reorder_point: 6, sold_mtd: 18, vs_ly: 3 },
  { sku: "LG-1077", name: "Bridle Wallet — Bordeaux", category: "Leather Goods", units_in_stock: 11, reorder_point: 6, sold_mtd: 6, vs_ly: -3 },
  { sku: "RTW-2255", name: "Cashmere Cardigan — Ivory", category: "Ready-to-Wear", units_in_stock: 12, reorder_point: 6, sold_mtd: 4, vs_ly: -18 },
  { sku: "SH-3340", name: "Suede Mule — Sand", category: "Shoes", units_in_stock: 14, reorder_point: 6, sold_mtd: 3, vs_ly: -22 },
  { sku: "AC-4488", name: "Leather Belt — Reversible", category: "Accessories", units_in_stock: 17, reorder_point: 6, sold_mtd: 4, vs_ly: -8 },
  { sku: "JW-5550", name: "Pearl Drop Earrings", category: "Jewelry", units_in_stock: 19, reorder_point: 5, sold_mtd: 2, vs_ly: -30 },
  { sku: "FR-6655", name: "Candle — Cèdre Noir", category: "Fragrances", units_in_stock: 22, reorder_point: 8, sold_mtd: 7, vs_ly: 5 },
  { sku: "LG-1199", name: "Weekender Duffel", category: "Leather Goods", units_in_stock: 24, reorder_point: 6, sold_mtd: 2, vs_ly: -40 },
];

export const suggestedQuestions = [
  "What are my 3 priorities today?",
  "How should I staff the VIP event?",
  "Which inventory should I push?",
  "How to close the gap to LY?",
  "Who speaks Mandarin on my team?",
  "Top performing advisors?",
];
