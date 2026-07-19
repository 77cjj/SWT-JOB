/**
 * Breakfast Ops Dashboard — Scheme B demo app logic
 */

const H = window.DemoHelpers;
const charts = {};

// Session-only log entries (demo)
let sessionLogs = [];

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return [...document.querySelectorAll(sel)]; }

function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

function goPage(id) {
  const link = document.querySelector(`.nav-link[data-page="${id}"]`);
  if (link) link.click();
}

function pillClass(cat) {
  return "pill " + cat.toLowerCase();
}

function stockStatus(item) {
  const ratio = item.onHand / item.par;
  const days = item.dailyUse > 0 ? item.onHand / item.dailyUse : 99;
  if (ratio < 0.35 || days < 2) return { label: "Critical", cls: "crit" };
  if (ratio < 0.7 || days < 4) return { label: "Low", cls: "low" };
  return { label: "OK", cls: "ok" };
}

// Navigation
function initNav() {
  $$(".nav-link").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const page = a.dataset.page;
      $$(".nav-link").forEach((x) => x.classList.remove("active"));
      a.classList.add("active");
      $$(".page").forEach((p) => p.classList.remove("active"));
      $(`#page-${page}`).classList.add("active");
      if (page === "trends") renderPriceTrend();
    });
  });
}

// Overview KPIs
function renderKPIs() {
  const s = H.getCurrentWeekStats();
  const pctVsAvg = s.avg4wkCost ? ((s.costPerGuest - s.avg4wkCost) / s.avg4wkCost) * 100 : 0;
  const foodCostPct = (s.costPerGuest / DEMO.settings.avgRoomRate) * 100;

  $("#kpi-grid").innerHTML = `
    <div class="kpi">
      <div class="label">Weekly spend</div>
      <div class="value">${H.formatMoney(s.spend)}</div>
      <div class="sub">Week of ${s.weekLabel}</div>
    </div>
    <div class="kpi">
      <div class="label">Breakfast guests</div>
      <div class="value">${s.guests}</div>
      <div class="sub">${s.rooms} room-nights</div>
    </div>
    <div class="kpi">
      <div class="label">Cost per guest</div>
      <div class="value">${H.formatMoney(s.costPerGuest)}</div>
      <div class="sub">Target ${H.formatMoney(DEMO.settings.targetCostPerGuest)}</div>
      <span class="delta ${pctVsAvg > 5 ? "up" : pctVsAvg < -2 ? "down" : "ok"}">
        ${pctVsAvg >= 0 ? "+" : ""}${pctVsAvg.toFixed(1)}% vs 4-wk avg
      </span>
    </div>
    <div class="kpi">
      <div class="label">Food cost / room</div>
      <div class="value">${foodCostPct.toFixed(2)}%</div>
      <div class="sub">Avg rate ${H.formatMoney(DEMO.settings.avgRoomRate)} · breakfast included</div>
      <span class="delta ${s.stockouts > 0 ? "up" : "ok"}">${s.stockouts} active alerts</span>
    </div>
  `;

  $("#target-cpg").textContent = H.formatMoney(DEMO.settings.targetCostPerGuest);
}

function renderOverviewAlerts() {
  const el = $("#overview-alerts");
  el.innerHTML = DEMO.alerts.slice(0, 4).map((a) => `
    <div class="alert-item ${a.level}">
      <span class="alert-dot"></span>
      <div>
        <strong>${a.item}</strong>
        <p>${a.message}</p>
      </div>
      <time>${a.date}</time>
    </div>
  `).join("");
}

function renderFullAlerts() {
  $("#full-alerts").innerHTML = DEMO.alerts.map((a) => `
    <div class="alert-item ${a.level}">
      <span class="alert-dot"></span>
      <div>
        <strong>${a.item}</strong>
        <p>${a.message}</p>
      </div>
      <time>${a.date}</time>
    </div>
  `).join("");
}

// Charts
function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function chartDefaults() {
  Chart.defaults.font.family = '"DM Sans", system-ui, sans-serif';
  Chart.defaults.color = "#6b6560";
}

function renderSpendGuestsChart() {
  destroyChart("spendGuests");
  const series = H.getCostPerGuestSeries();
  const labels = series.map((x) => H.formatWeekLabel(x.week));
  const ctx = $("#chart-spend-guests").getContext("2d");
  charts.spendGuests = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Weekly spend ($)",
          data: series.map((x) => x.spend),
          backgroundColor: "rgba(45, 90, 71, 0.75)",
          borderRadius: 6,
          yAxisID: "y",
        },
        {
          label: "Guests",
          data: series.map((x) => x.guests),
          type: "line",
          borderColor: "#8b5e3c",
          backgroundColor: "#8b5e3c",
          tension: 0.35,
          pointRadius: 3,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 16 } } },
      scales: {
        y: { position: "left", min: 0, grid: { color: "#efe9df" }, ticks: { callback: (v) => "$" + v } },
        y1: { position: "right", grid: { drawOnChartArea: false }, min: 120, max: 230 },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderCategoryChart() {
  destroyChart("category");
  const latestWeek = DEMO.weeklyGuests[DEMO.weeklyGuests.length - 1].week;
  const data = H.getCategoryBreakdown(latestWeek);
  const ctx = $("#chart-category").getContext("2d");
  const colors = ["#2d5a47", "#8b5e3c", "#3d6b8c", "#9d5b7a", "#6b5b95", "#4a7c59", "#b45309"];
  charts.category = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.map((d) => d.category),
      datasets: [{ data: data.map((d) => d.total), backgroundColor: colors.slice(0, data.length), borderWidth: 0 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { boxWidth: 10, padding: 10, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (c) => {
              const sum = c.dataset.data.reduce((a, b) => a + b, 0);
              const pct = sum ? ((c.raw / sum) * 100).toFixed(1) : 0;
              return ` ${c.label}: ${H.formatMoney(c.raw)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

function renderCPGChart() {
  destroyChart("cpg");
  const series = H.getCostPerGuestSeries();
  const target = DEMO.settings.targetCostPerGuest;
  const ctx = $("#chart-cpg").getContext("2d");
  charts.cpg = new Chart(ctx, {
    type: "line",
    data: {
      labels: series.map((x) => H.formatWeekLabel(x.week)),
      datasets: [
        {
          label: "Cost / guest",
          data: series.map((x) => +x.costPerGuest.toFixed(2)),
          borderColor: "#2d5a47",
          backgroundColor: "rgba(45,90,71,.08)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
        },
        {
          label: "Target",
          data: series.map(() => target),
          borderColor: "#b45309",
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { min: 4.0, max: 5.2, grid: { color: "#efe9df" }, ticks: { callback: (v) => "$" + v.toFixed(2) } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderUsageChart() {
  destroyChart("usage");
  window.__sessionLogs = sessionLogs;
  const logs = H.getUsageChartData().filter((l) => l.eggsEnd != null).slice(-10);
  const ctx = $("#chart-usage").getContext("2d");
  charts.usage = new Chart(ctx, {
    type: "line",
    data: {
      labels: logs.map((l) => l.date.slice(5)),
      datasets: [
        { label: "Guests", data: logs.map((l) => l.guests), borderColor: "#8b5e3c", tension: 0.3, yAxisID: "y1" },
        { label: "Eggs end", data: logs.map((l) => l.eggsEnd), borderColor: "#2d5a47", tension: 0.3 },
        { label: "Milk end (gal)", data: logs.map((l) => l.milkEnd), borderColor: "#3d6b8c", tension: 0.3 },
        { label: "Lids end", data: logs.map((l) => l.lidsEnd), borderColor: "#b91c1c", tension: 0.3 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { position: "left", grid: { color: "#efe9df" }, title: { display: true, text: "Inventory end" } },
        y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Guests" } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderInventoryHealthChart() {
  destroyChart("invHealth");
  const below = DEMO.inventory.filter((i) => i.onHand < i.par);
  const ok = DEMO.inventory.length - below.length;
  const ctx = $("#chart-inventory-health").getContext("2d");
  charts.invHealth = new Chart(ctx, {
    type: "bar",
    data: {
      labels: below.map((i) => i.item.replace(/\(.*\)/, "").trim()),
      datasets: [{
        label: "% of par",
        data: below.map((i) => Math.round((i.onHand / i.par) * 100)),
        backgroundColor: below.map((i) => {
          const s = stockStatus(i);
          return s.cls === "crit" ? "#b91c1c" : "#b45309";
        }),
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { max: 100, grid: { color: "#efe9df" }, ticks: { callback: (v) => v + "%" } },
        y: { grid: { display: false } },
      },
    },
  });
}

function renderPriceTrend() {
  destroyChart("price");
  const sku = $("#trend-sku").value || Object.keys(DEMO.priceHistory)[0];
  const hist = DEMO.priceHistory[sku] || [];
  const first = hist[0]?.price || 0;
  const last = hist[hist.length - 1]?.price || 0;
  const chg = first ? ((last - first) / first) * 100 : 0;

  $("#price-trend-sub").textContent =
    `${sku} · ${H.formatMoney(first)} → ${H.formatMoney(last)} (${chg >= 0 ? "+" : ""}${chg.toFixed(1)}% YTD)`;

  const ctx = $("#chart-price").getContext("2d");
  charts.price = new Chart(ctx, {
    type: "line",
    data: {
      labels: hist.map((h) => h.month.slice(5)),
      datasets: [{
        label: "Unit price",
        data: hist.map((h) => h.price),
        borderColor: "#2d5a47",
        backgroundColor: "rgba(45,90,71,.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` ${H.formatMoney(c.raw)}` } },
      },
      scales: {
        y: { grid: { color: "#efe9df" }, ticks: { callback: (v) => "$" + v } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderScatterChart() {
  destroyChart("scatter");
  const series = H.getCostPerGuestSeries();
  const ctx = $("#chart-scatter").getContext("2d");
  charts.scatter = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [{
        label: "Week",
        data: series.map((x) => ({ x: x.guests, y: x.spend })),
        backgroundColor: "rgba(139, 94, 60, 0.7)",
        pointRadius: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => {
              const w = series[c.dataIndex];
              return ` ${H.formatWeekLabel(w.week)}: ${w.guests} guests · ${H.formatMoney(w.spend)} · ${H.formatMoney(w.costPerGuest)}/guest`;
            },
          },
        },
      },
      scales: {
        x: { min: 130, max: 230, title: { display: true, text: "Weekly guests" }, grid: { color: "#efe9df" } },
        y: { min: 550, max: 1150, title: { display: true, text: "Weekly spend ($)" }, grid: { color: "#efe9df" } },
      },
    },
  });
}

function renderTrendInsights() {
  const eggs = DEMO.priceHistory["Eggs (trays)"];
  const eggChg = ((eggs[eggs.length - 1].price - eggs[0].price) / eggs[0].price) * 100;
  const series = H.getCostPerGuestSeries();
  const best = [...series].filter((x) => x.costPerGuest).sort((a, b) => a.costPerGuest - b.costPerGuest)[0];
  const worst = [...series].filter((x) => x.costPerGuest).sort((a, b) => b.costPerGuest - a.costPerGuest)[0];

  $("#trend-insights").innerHTML = `
    <div class="insight">
      <div class="t">Biggest price rise</div>
      <div class="v">Eggs +${eggChg.toFixed(0)}%</div>
      <div class="d">Jan → Jul 2026 · consider alt supplier or menu tweak</div>
    </div>
    <div class="insight">
      <div class="t">Best week (cost/guest)</div>
      <div class="v">${H.formatMoney(best.costPerGuest)}</div>
      <div class="d">${H.formatWeekLabel(best.week)} · ${best.guests} guests · ${H.formatMoney(best.spend)} spend</div>
    </div>
    <div class="insight">
      <div class="t">Highest week (cost/guest)</div>
      <div class="v">${H.formatMoney(worst.costPerGuest)}</div>
      <div class="d">${H.formatWeekLabel(worst.week)} · ${worst.guests} guests · check waste / over-order</div>
    </div>
  `;
}

// Purchases table
function initPurchaseFilters() {
  const cats = [...new Set(DEMO.purchases.map((p) => p.category))].sort();
  const months = [...new Set(DEMO.purchases.map((p) => p.date.slice(0, 7)))].sort().reverse();
  const catSel = $("#filter-category");
  const monSel = $("#filter-month");
  cats.forEach((c) => { const o = document.createElement("option"); o.value = c; o.textContent = c; catSel.appendChild(o); });
  months.forEach((m) => { const o = document.createElement("option"); o.value = m; o.textContent = m; monSel.appendChild(o); });
}

function renderPurchases() {
  const cat = $("#filter-category").value;
  const month = $("#filter-month").value;
  const rows = DEMO.purchases
    .filter((p) => (!cat || p.category === cat) && (!month || p.date.startsWith(month)))
    .sort((a, b) => b.date.localeCompare(a.date));

  const tbody = $("#purchases-table tbody");
  tbody.innerHTML = rows.map((p) => `
    <tr>
      <td>${p.date}</td>
      <td><strong>${p.item}</strong></td>
      <td><span class="${pillClass(p.category)}">${p.category}</span></td>
      <td>${p.qty} ${p.unit}</td>
      <td>${H.formatMoney(p.unitPrice)}</td>
      <td><strong>${H.formatMoney(H.purchaseTotal(p))}</strong></td>
      <td>${p.supplier}</td>
    </tr>
  `).join("");

  const total = rows.reduce((s, p) => s + H.purchaseTotal(p), 0);
  const topItem = rows.reduce((m, p) => {
    const t = H.purchaseTotal(p);
    return t > (m.total || 0) ? { item: p.item, total: t } : m;
  }, {});

  $("#purchase-insights").innerHTML = `
    <div class="insight">
      <div class="t">Filtered total</div>
      <div class="v">${H.formatMoney(total)}</div>
      <div class="d">${rows.length} purchase lines</div>
    </div>
    <div class="insight">
      <div class="t">Largest line item</div>
      <div class="v">${topItem.item || "—"}</div>
      <div class="d">${topItem.total ? H.formatMoney(topItem.total) : ""}</div>
    </div>
    <div class="insight">
      <div class="t">Avg unit price (eggs)</div>
      <div class="v">${H.formatMoney(DEMO.priceHistory["Eggs (trays)"][6].price)}</div>
      <div class="d">Latest recorded purchase</div>
    </div>
  `;
}

// Inventory table
function renderInventory() {
  const tbody = $("#inventory-table tbody");
  tbody.innerHTML = DEMO.inventory.map((item) => {
    const st = stockStatus(item);
    const days = item.dailyUse > 0 ? (item.onHand / item.dailyUse).toFixed(1) : "—";
    const pct = Math.min(100, Math.round((item.onHand / item.par) * 100));
    return `
      <tr>
        <td><strong>${item.item}</strong><br><span style="font-size:11px;color:#6b6560">${item.category}</span></td>
        <td>${item.onHand} ${item.unit}</td>
        <td>${item.par}</td>
        <td>${item.dailyUse} / day</td>
        <td>${days}</td>
        <td><span class="pill ${st.cls === "ok" ? "dairy" : st.cls === "low" ? "frozen" : "protein"}">${st.label}</span></td>
        <td style="min-width:100px">
          ${pct}%
          <div class="stock-bar ${st.cls}"><span style="width:${pct}%"></span></div>
        </td>
      </tr>
    `;
  }).join("");
}

// Trend SKU select
function initTrendSku() {
  const sel = $("#trend-sku");
  Object.keys(DEMO.priceHistory).forEach((sku) => {
    const o = document.createElement("option");
    o.value = sku;
    o.textContent = sku;
    sel.appendChild(o);
  });
}

// Daily log
function submitDailyLog(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const entry = {
    date: fd.get("date"),
    guests: +fd.get("guests"),
    eggsEnd: +fd.get("eggsEnd") || 0,
    milkEnd: +fd.get("milkEnd") || 0,
    cupsEnd: +fd.get("cupsEnd") || 0,
    lidsEnd: +fd.get("lidsEnd") || 0,
    notes: fd.get("notes") || "",
  };
  sessionLogs.push(entry);
  e.target.reset();
  initLogDate();
  renderUsageChart();
  showToast("Demo entry saved for this session");
}

function initLogDate() {
  const d = $("#log-date");
  if (d) d.value = new Date().toISOString().slice(0, 10);
}

function exportDemo() {
  const s = H.getCurrentWeekStats();
  const text = [
    "Breakfast Ops — Weekly Summary (DEMO)",
    "================================",
    `Week of: ${s.weekLabel}`,
    `Guests: ${s.guests}`,
    `Weekly spend: ${H.formatMoney(s.spend)}`,
    `Cost per guest: ${H.formatMoney(s.costPerGuest)}`,
    `4-wk avg cost/guest: ${H.formatMoney(s.avg4wkCost)}`,
    `Active alerts: ${s.stockouts}`,
    "",
    "Alerts:",
    ...DEMO.alerts.map((a) => `- [${a.level}] ${a.item}: ${a.message}`),
  ].join("\n");

  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "breakfast-ops-summary-demo.txt";
  a.click();
  showToast("Summary exported");
}

// Boot
function init() {
  chartDefaults();
  initNav();
  initPurchaseFilters();
  initTrendSku();
  initLogDate();

  renderKPIs();
  renderOverviewAlerts();
  renderFullAlerts();
  renderPurchases();
  renderInventory();

  renderSpendGuestsChart();
  renderCategoryChart();
  renderCPGChart();
  renderUsageChart();
  renderInventoryHealthChart();
  renderPriceTrend();
  renderScatterChart();
  renderTrendInsights();
}

document.addEventListener("DOMContentLoaded", init);
