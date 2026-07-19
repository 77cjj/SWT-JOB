/**
 * Demo mock data — Breakfast Ops Dashboard (Scheme B prototype)
 * All 12+ weeks aligned: guests, spend, purchases, trends.
 */

const DEMO = {
  property: "The Porch Inn — Breakfast",
  currency: "USD",
  updatedAt: "2026-07-09T18:00:00",

  // Weekly guest counts — Mondays, 13 weeks
  weeklyGuests: [
    { week: "2026-04-14", guests: 142, rooms: 98 },
    { week: "2026-04-21", guests: 156, rooms: 108 },
    { week: "2026-04-28", guests: 148, rooms: 102 },
    { week: "2026-05-05", guests: 171, rooms: 118 },
    { week: "2026-05-12", guests: 189, rooms: 131 },
    { week: "2026-05-19", guests: 201, rooms: 139 },
    { week: "2026-05-26", guests: 195, rooms: 135 },
    { week: "2026-06-02", guests: 178, rooms: 124 },
    { week: "2026-06-09", guests: 164, rooms: 114 },
    { week: "2026-06-16", guests: 172, rooms: 119 },
    { week: "2026-06-23", guests: 198, rooms: 137 },
    { week: "2026-06-30", guests: 211, rooms: 146 },
    { week: "2026-07-07", guests: 218, rooms: 151 },
  ],

  // Weekly spend totals — aligned 1:1 with weeklyGuests (slight noise + summer uptick)
  weeklySpend: [
    { week: "2026-04-14", spend: 612.40, costPerGuest: 4.31 },
    { week: "2026-04-21", spend: 685.20, costPerGuest: 4.39 },
    { week: "2026-04-28", spend: 651.20, costPerGuest: 4.40 },
    { week: "2026-05-05", spend: 769.50, costPerGuest: 4.50 },
    { week: "2026-05-12", spend: 869.40, costPerGuest: 4.60 },
    { week: "2026-05-19", spend: 925.60, costPerGuest: 4.60 },
    { week: "2026-05-26", spend: 916.50, costPerGuest: 4.70 },
    { week: "2026-06-02", spend: 854.40, costPerGuest: 4.80 },
    { week: "2026-06-09", spend: 770.80, costPerGuest: 4.70 },
    { week: "2026-06-16", spend: 826.60, costPerGuest: 4.81 },
    { week: "2026-06-23", spend: 970.20, costPerGuest: 4.90 },
    { week: "2026-06-30", spend: 1044.50, costPerGuest: 4.95 },
    { week: "2026-07-07", spend: 1089.60, costPerGuest: 5.00 },
  ],

  // Category spend per week (for doughnut — current week)
  weeklyCategorySpend: {
    "2026-07-07": {
      Protein: 198.40,
      Dairy: 312.60,
      Beverage: 186.20,
      Bakery: 245.80,
      Supplies: 98.50,
      Frozen: 28.10,
      Produce: 20.00,
    },
  },

  purchases: [
    // Apr
    { id: 1, date: "2026-04-15", item: "Eggs (trays)", category: "Protein", qty: 5, unit: "tray", unitPrice: 4.05, supplier: "Sysco" },
    { id: 2, date: "2026-04-15", item: "Whole milk", category: "Dairy", qty: 10, unit: "gal", unitPrice: 3.55, supplier: "Sysco" },
    { id: 3, date: "2026-04-16", item: "Coffee cups", category: "Supplies", qty: 500, unit: "pcs", unitPrice: 0.058, supplier: "Webstaurant" },
    { id: 4, date: "2026-04-18", item: "Orange juice", category: "Beverage", qty: 6, unit: "gal", unitPrice: 5.20, supplier: "Sysco" },
    { id: 5, date: "2026-04-22", item: "Eggs (trays)", category: "Protein", qty: 6, unit: "tray", unitPrice: 4.08, supplier: "Sysco" },
    { id: 6, date: "2026-04-22", item: "Muffins (assorted)", category: "Bakery", qty: 40, unit: "pcs", unitPrice: 1.28, supplier: "Local Bakery" },
    { id: 7, date: "2026-04-24", item: "Hash browns", category: "Frozen", qty: 3, unit: "box", unitPrice: 17.80, supplier: "Sysco" },
    { id: 8, date: "2026-04-28", item: "Chobani yogurt", category: "Dairy", qty: 20, unit: "cup", unitPrice: 1.05, supplier: "Costco" },
    { id: 9, date: "2026-04-29", item: "Regular coffee (bulk)", category: "Beverage", qty: 2, unit: "bag", unitPrice: 27.00, supplier: "Local Roaster" },
    // May
    { id: 10, date: "2026-05-06", item: "Eggs (trays)", category: "Protein", qty: 7, unit: "tray", unitPrice: 4.12, supplier: "Sysco" },
    { id: 11, date: "2026-05-06", item: "Whole milk", category: "Dairy", qty: 12, unit: "gal", unitPrice: 3.62, supplier: "Sysco" },
    { id: 12, date: "2026-05-08", item: "Sausage patties", category: "Protein", qty: 3, unit: "pack", unitPrice: 21.50, supplier: "Sysco" },
    { id: 13, date: "2026-05-10", item: "Danish (assorted)", category: "Bakery", qty: 32, unit: "pcs", unitPrice: 1.55, supplier: "Local Bakery" },
    { id: 14, date: "2026-05-13", item: "Coffee lids", category: "Supplies", qty: 500, unit: "pcs", unitPrice: 0.038, supplier: "Webstaurant" },
    { id: 15, date: "2026-05-15", item: "Fruit (platter prep)", category: "Produce", qty: 1, unit: "lot", unitPrice: 78.00, supplier: "Local Produce" },
    { id: 16, date: "2026-05-20", item: "Eggs (trays)", category: "Protein", qty: 8, unit: "tray", unitPrice: 4.20, supplier: "Sysco" },
    { id: 17, date: "2026-05-20", item: "Activia yogurt", category: "Dairy", qty: 24, unit: "cup", unitPrice: 0.92, supplier: "Costco" },
    { id: 18, date: "2026-05-22", item: "Cranberry juice", category: "Beverage", qty: 5, unit: "gal", unitPrice: 5.60, supplier: "Sysco" },
    { id: 19, date: "2026-05-27", item: "Paper towels", category: "Supplies", qty: 8, unit: "roll", unitPrice: 2.65, supplier: "Costco" },
    { id: 20, date: "2026-05-28", item: "Hash browns", category: "Frozen", qty: 4, unit: "box", unitPrice: 18.25, supplier: "Sysco" },
    // Jun
    { id: 21, date: "2026-06-02", item: "Eggs (trays)", category: "Protein", qty: 6, unit: "tray", unitPrice: 4.20, supplier: "Sysco" },
    { id: 22, date: "2026-06-02", item: "Whole milk", category: "Dairy", qty: 12, unit: "gal", unitPrice: 3.85, supplier: "Sysco" },
    { id: 23, date: "2026-06-02", item: "Coffee cups", category: "Supplies", qty: 500, unit: "pcs", unitPrice: 0.06, supplier: "Webstaurant" },
    { id: 24, date: "2026-06-05", item: "Hash browns", category: "Frozen", qty: 4, unit: "box", unitPrice: 18.50, supplier: "Sysco" },
    { id: 25, date: "2026-06-05", item: "Sausage patties", category: "Protein", qty: 3, unit: "pack", unitPrice: 22.00, supplier: "Sysco" },
    { id: 26, date: "2026-06-09", item: "Chobani yogurt", category: "Dairy", qty: 24, unit: "cup", unitPrice: 1.10, supplier: "Costco" },
    { id: 27, date: "2026-06-09", item: "Activia yogurt", category: "Dairy", qty: 24, unit: "cup", unitPrice: 0.95, supplier: "Costco" },
    { id: 28, date: "2026-06-09", item: "Orange juice", category: "Beverage", qty: 8, unit: "gal", unitPrice: 5.40, supplier: "Sysco" },
    { id: 29, date: "2026-06-12", item: "Regular coffee (bulk)", category: "Beverage", qty: 2, unit: "bag", unitPrice: 28.00, supplier: "Local Roaster" },
    { id: 30, date: "2026-06-12", item: "Decaf coffee (bulk)", category: "Beverage", qty: 1, unit: "bag", unitPrice: 30.00, supplier: "Local Roaster" },
    { id: 31, date: "2026-06-16", item: "Eggs (trays)", category: "Protein", qty: 8, unit: "tray", unitPrice: 4.45, supplier: "Sysco" },
    { id: 32, date: "2026-06-16", item: "Muffins (assorted)", category: "Bakery", qty: 48, unit: "pcs", unitPrice: 1.35, supplier: "Local Bakery" },
    { id: 33, date: "2026-06-16", item: "Gloves (boxes)", category: "Supplies", qty: 2, unit: "box", unitPrice: 14.99, supplier: "Webstaurant" },
    { id: 34, date: "2026-06-19", item: "Paper towels", category: "Supplies", qty: 6, unit: "roll", unitPrice: 2.80, supplier: "Costco" },
    { id: 35, date: "2026-06-19", item: "Black trash bags", category: "Supplies", qty: 1, unit: "box", unitPrice: 24.00, supplier: "Costco" },
    { id: 36, date: "2026-06-23", item: "Eggs (trays)", category: "Protein", qty: 9, unit: "tray", unitPrice: 4.55, supplier: "Sysco" },
    { id: 37, date: "2026-06-23", item: "Almond milk", category: "Dairy", qty: 6, unit: "half-gal", unitPrice: 3.20, supplier: "Sysco" },
    { id: 38, date: "2026-06-23", item: "French Vanilla Half & Half", category: "Dairy", qty: 4, unit: "qt", unitPrice: 2.90, supplier: "Sysco" },
    { id: 39, date: "2026-06-26", item: "Fruit (platter prep)", category: "Produce", qty: 1, unit: "lot", unitPrice: 85.00, supplier: "Local Produce" },
    { id: 40, date: "2026-06-26", item: "Danish (assorted)", category: "Bakery", qty: 36, unit: "pcs", unitPrice: 1.65, supplier: "Local Bakery" },
    { id: 41, date: "2026-06-30", item: "Eggs (trays)", category: "Protein", qty: 10, unit: "tray", unitPrice: 4.60, supplier: "Sysco" },
    { id: 42, date: "2026-06-30", item: "Whole milk", category: "Dairy", qty: 14, unit: "gal", unitPrice: 3.95, supplier: "Sysco" },
    { id: 43, date: "2026-06-30", item: "Coffee lids", category: "Supplies", qty: 500, unit: "pcs", unitPrice: 0.04, supplier: "Webstaurant" },
    // Jul (current week)
    { id: 44, date: "2026-07-02", item: "Hash browns", category: "Frozen", qty: 4, unit: "box", unitPrice: 19.25, supplier: "Sysco" },
    { id: 45, date: "2026-07-02", item: "Sausage patties", category: "Protein", qty: 4, unit: "pack", unitPrice: 22.50, supplier: "Sysco" },
    { id: 46, date: "2026-07-05", item: "Tea light candles", category: "Supplies", qty: 24, unit: "pcs", unitPrice: 0.35, supplier: "Amazon" },
    { id: 47, date: "2026-07-05", item: "Chobani yogurt", category: "Dairy", qty: 30, unit: "cup", unitPrice: 1.15, supplier: "Costco" },
    { id: 48, date: "2026-07-05", item: "Activia yogurt", category: "Dairy", qty: 30, unit: "cup", unitPrice: 0.98, supplier: "Costco" },
    { id: 49, date: "2026-07-07", item: "Regular coffee (bulk)", category: "Beverage", qty: 2, unit: "bag", unitPrice: 29.50, supplier: "Local Roaster" },
    { id: 50, date: "2026-07-07", item: "Cranberry juice", category: "Beverage", qty: 6, unit: "gal", unitPrice: 5.80, supplier: "Sysco" },
    { id: 51, date: "2026-07-07", item: "Apple juice", category: "Beverage", qty: 6, unit: "gal", unitPrice: 4.90, supplier: "Sysco" },
    { id: 52, date: "2026-07-08", item: "Eggs (trays)", category: "Protein", qty: 8, unit: "tray", unitPrice: 4.75, supplier: "Sysco" },
    { id: 53, date: "2026-07-08", item: "Muffins (assorted)", category: "Bakery", qty: 54, unit: "pcs", unitPrice: 1.40, supplier: "Local Bakery" },
    { id: 54, date: "2026-07-09", item: "Coffee cups", category: "Supplies", qty: 500, unit: "pcs", unitPrice: 0.065, supplier: "Webstaurant" },
    { id: 55, date: "2026-07-09", item: "Whole milk", category: "Dairy", qty: 10, unit: "gal", unitPrice: 3.98, supplier: "Sysco" },
  ],

  inventory: [
    { item: "Eggs (trays)", category: "Protein", onHand: 2, par: 6, unit: "tray", dailyUse: 1.2, lastCount: "2026-07-09" },
    { item: "Hash browns", category: "Frozen", onHand: 1, par: 3, unit: "box", dailyUse: 0.4, lastCount: "2026-07-09" },
    { item: "Sausage patties", category: "Protein", onHand: 1, par: 2, unit: "pack", dailyUse: 0.3, lastCount: "2026-07-09" },
    { item: "Whole milk", category: "Dairy", onHand: 4, par: 8, unit: "gal", dailyUse: 1.5, lastCount: "2026-07-09" },
    { item: "Almond milk", category: "Dairy", onHand: 3, par: 4, unit: "half-gal", dailyUse: 0.6, lastCount: "2026-07-09" },
    { item: "Chobani yogurt", category: "Dairy", onHand: 14, par: 20, unit: "cup", dailyUse: 4, lastCount: "2026-07-09" },
    { item: "Activia yogurt", category: "Dairy", onHand: 12, par: 20, unit: "cup", dailyUse: 3.5, lastCount: "2026-07-09" },
    { item: "Regular coffee (bulk)", category: "Beverage", onHand: 1.2, par: 2, unit: "bag", dailyUse: 0.25, lastCount: "2026-07-09" },
    { item: "Decaf coffee (bulk)", category: "Beverage", onHand: 0.6, par: 1, unit: "bag", dailyUse: 0.12, lastCount: "2026-07-09" },
    { item: "Coffee cups", category: "Supplies", onHand: 280, par: 400, unit: "pcs", dailyUse: 55, lastCount: "2026-07-09" },
    { item: "Coffee lids", category: "Supplies", onHand: 95, par: 300, unit: "pcs", dailyUse: 48, lastCount: "2026-07-09" },
    { item: "Gloves (boxes)", category: "Supplies", onHand: 1, par: 2, unit: "box", dailyUse: 0.15, lastCount: "2026-07-09" },
    { item: "Paper towels", category: "Supplies", onHand: 8, par: 10, unit: "roll", dailyUse: 1.2, lastCount: "2026-07-09" },
    { item: "Napkins", category: "Supplies", onHand: 1200, par: 1500, unit: "pcs", dailyUse: 180, lastCount: "2026-07-09" },
    { item: "Tea light candles", category: "Supplies", onHand: 8, par: 15, unit: "pcs", dailyUse: 2, lastCount: "2026-07-09" },
    { item: "Towels (clean set)", category: "Supplies", onHand: 9, par: 12, unit: "set", dailyUse: 2, lastCount: "2026-07-09" },
    { item: "Muffins (assorted)", category: "Bakery", onHand: 22, par: 40, unit: "pcs", dailyUse: 12, lastCount: "2026-07-09" },
    { item: "Orange juice", category: "Beverage", onHand: 3, par: 5, unit: "gal", dailyUse: 0.8, lastCount: "2026-07-09" },
  ],

  dailyUsage: [
    { date: "2026-07-03", guests: 28, eggsEnd: 4, milkEnd: 7, cupsEnd: 420, lidsEnd: 310, notes: "" },
    { date: "2026-07-04", guests: 34, eggsEnd: 3, milkEnd: 5, cupsEnd: 350, lidsEnd: 240, notes: "Busy — 2 fruit platters" },
    { date: "2026-07-05", guests: 31, eggsEnd: 3, milkEnd: 6, cupsEnd: 380, lidsEnd: 280, notes: "" },
    { date: "2026-07-06", guests: 26, eggsEnd: 4, milkEnd: 7, cupsEnd: 410, lidsEnd: 300, notes: "" },
    { date: "2026-07-07", guests: 29, eggsEnd: 3, milkEnd: 5, cupsEnd: 340, lidsEnd: 210, notes: "Lids low — restocked" },
    { date: "2026-07-08", guests: 33, eggsEnd: 2, milkEnd: 4, cupsEnd: 310, lidsEnd: 150, notes: "Eggs low" },
    { date: "2026-07-09", guests: 30, eggsEnd: 2, milkEnd: 4, cupsEnd: 280, lidsEnd: 95, notes: "Lids critical" },
  ],

  // Extended daily guest series for usage chart (14 days)
  dailyGuestsExtended: [
    { date: "2026-06-26", guests: 24 },
    { date: "2026-06-27", guests: 31 },
    { date: "2026-06-28", guests: 29 },
    { date: "2026-06-29", guests: 27 },
    { date: "2026-06-30", guests: 32 },
    { date: "2026-07-01", guests: 30 },
    { date: "2026-07-02", guests: 28 },
    { date: "2026-07-03", guests: 28, eggsEnd: 4, milkEnd: 7, cupsEnd: 420, lidsEnd: 310 },
    { date: "2026-07-04", guests: 34, eggsEnd: 3, milkEnd: 5, cupsEnd: 350, lidsEnd: 240 },
    { date: "2026-07-05", guests: 31, eggsEnd: 3, milkEnd: 6, cupsEnd: 380, lidsEnd: 280 },
    { date: "2026-07-06", guests: 26, eggsEnd: 4, milkEnd: 7, cupsEnd: 410, lidsEnd: 300 },
    { date: "2026-07-07", guests: 29, eggsEnd: 3, milkEnd: 5, cupsEnd: 340, lidsEnd: 210 },
    { date: "2026-07-08", guests: 33, eggsEnd: 2, milkEnd: 4, cupsEnd: 310, lidsEnd: 150 },
    { date: "2026-07-09", guests: 30, eggsEnd: 2, milkEnd: 4, cupsEnd: 280, lidsEnd: 95 },
  ],

  priceHistory: {
    "Eggs (trays)": [
      { month: "2026-01", price: 3.90 }, { month: "2026-02", price: 3.95 },
      { month: "2026-03", price: 4.05 }, { month: "2026-04", price: 4.10 },
      { month: "2026-05", price: 4.25 }, { month: "2026-06", price: 4.55 },
      { month: "2026-07", price: 4.75 },
    ],
    "Whole milk": [
      { month: "2026-01", price: 3.40 }, { month: "2026-02", price: 3.45 },
      { month: "2026-03", price: 3.55 }, { month: "2026-04", price: 3.60 },
      { month: "2026-05", price: 3.70 }, { month: "2026-06", price: 3.90 },
      { month: "2026-07", price: 3.98 },
    ],
    "Coffee cups": [
      { month: "2026-01", price: 0.055 }, { month: "2026-02", price: 0.055 },
      { month: "2026-03", price: 0.058 }, { month: "2026-04", price: 0.060 },
      { month: "2026-05", price: 0.060 }, { month: "2026-06", price: 0.062 },
      { month: "2026-07", price: 0.065 },
    ],
    "Hash browns": [
      { month: "2026-01", price: 17.00 }, { month: "2026-02", price: 17.25 },
      { month: "2026-03", price: 17.50 }, { month: "2026-04", price: 18.00 },
      { month: "2026-05", price: 18.25 }, { month: "2026-06", price: 19.00 },
      { month: "2026-07", price: 19.25 },
    ],
    "Muffins (assorted)": [
      { month: "2026-01", price: 1.20 }, { month: "2026-02", price: 1.22 },
      { month: "2026-03", price: 1.25 }, { month: "2026-04", price: 1.28 },
      { month: "2026-05", price: 1.32 }, { month: "2026-06", price: 1.35 },
      { month: "2026-07", price: 1.40 },
    ],
    "Sausage patties": [
      { month: "2026-01", price: 20.50 }, { month: "2026-02", price: 20.75 },
      { month: "2026-03", price: 21.00 }, { month: "2026-04", price: 21.25 },
      { month: "2026-05", price: 21.50 }, { month: "2026-06", price: 22.00 },
      { month: "2026-07", price: 22.50 },
    ],
  },

  alerts: [
    { level: "critical", item: "Coffee lids", message: "95 pcs left — ~2 days supply", date: "2026-07-09" },
    { level: "warning", item: "Eggs (trays)", message: "2 trays left — below par (6)", date: "2026-07-09" },
    { level: "warning", item: "Tea light candles", message: "8 left — remind to reorder (par 15)", date: "2026-07-09" },
    { level: "info", item: "Eggs unit price", message: "+21.8% vs Jan 2026 ($3.90 → $4.75)", date: "2026-07-09" },
    { level: "info", item: "Cost per guest", message: "This week $5.00 — up 6.4% vs 4-wk avg ($4.70)", date: "2026-07-09" },
  ],

  settings: {
    breakfastIncludedInRate: true,
    avgRoomRate: 189,
    targetCostPerGuest: 4.50,
    targetFoodCostPct: 0.024,
  },
};

function purchaseTotal(p) {
  return p.qty * p.unitPrice;
}

/** Local-date Monday (avoids UTC shift from toISOString). */
function weekStart(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatMoney(n) {
  return "$" + n.toFixed(2);
}

function formatWeekLabel(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeeklySpend() {
  return DEMO.weeklySpend.map((w) => ({ week: w.week, spend: w.spend }));
}

function getCostPerGuestSeries() {
  return DEMO.weeklyGuests.map((g, i) => {
    const s = DEMO.weeklySpend[i];
    return {
      week: g.week,
      guests: g.guests,
      spend: s?.spend ?? 0,
      costPerGuest: s?.costPerGuest ?? (g.guests ? (s?.spend || 0) / g.guests : 0),
    };
  });
}

function getCategoryBreakdown(weekFilter) {
  const preset = weekFilter && DEMO.weeklyCategorySpend[weekFilter];
  if (preset) {
    return Object.entries(preset)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }
  const map = {};
  DEMO.purchases
    .filter((p) => !weekFilter || weekStart(p.date) === weekFilter)
    .forEach((p) => {
      map[p.category] = (map[p.category] || 0) + purchaseTotal(p);
    });
  const entries = Object.entries(map).map(([category, total]) => ({ category, total }));
  if (entries.length) return entries.sort((a, b) => b.total - a.total);
  // Fallback: aggregate last 7 days of purchases
  const cutoff = "2026-07-03";
  DEMO.purchases
    .filter((p) => p.date >= cutoff)
    .forEach((p) => {
      map[p.category] = (map[p.category] || 0) + purchaseTotal(p);
    });
  return Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function getCurrentWeekStats() {
  const i = DEMO.weeklyGuests.length - 1;
  const latest = DEMO.weeklyGuests[i];
  const spend = DEMO.weeklySpend[i];
  const costSeries = getCostPerGuestSeries();
  const prevCosts = costSeries.slice(-5, -1).map((x) => x.costPerGuest).filter(Boolean);
  const avg4 = prevCosts.length ? prevCosts.reduce((a, b) => a + b, 0) / prevCosts.length : 0;

  return {
    weekLabel: formatWeekLabel(latest.week),
    guests: latest.guests,
    rooms: latest.rooms,
    spend: spend?.spend || 0,
    costPerGuest: spend?.costPerGuest || 0,
    avg4wkCost: avg4,
    stockouts: DEMO.alerts.filter((a) => a.level !== "info").length,
  };
}

function getUsageChartData() {
  const ext = DEMO.dailyGuestsExtended;
  const logs = [...ext, ...[]];
  const session = typeof window !== "undefined" && window.__sessionLogs ? window.__sessionLogs : [];
  const merged = [...logs, ...session].slice(-14);
  return merged;
}

if (typeof window !== "undefined") {
  window.DEMO = DEMO;
  window.DemoHelpers = {
    purchaseTotal,
    weekStart,
    formatMoney,
    formatWeekLabel,
    getWeeklySpend,
    getCostPerGuestSeries,
    getCategoryBreakdown,
    getCurrentWeekStats,
    getUsageChartData,
  };
}
