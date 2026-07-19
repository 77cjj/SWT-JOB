# Breakfast Ops Dashboard — Scheme B Demo

A standalone prototype for Lucas (owner) to visualize breakfast supply spend, cost per guest, inventory, and trends.

## Open the demo

No install required — open in any browser:

```bash
open breakfast-ops-dashboard/index.html
```

Or double-click `index.html`.

## What's included

| Page | Purpose |
|------|---------|
| **Overview** | Weekly spend, guests, cost/guest, category mix |
| **Purchases** | Item, qty, unit price, supplier — filterable table |
| **Inventory** | On-hand vs par, days of supply, usage chart |
| **Trends** | Unit price over time, guests vs spend scatter |
| **Alerts** | Low stock, cost spikes, price increases |
| **Daily Log** | Staff end-of-shift entry (demo — session only) |

## Demo data

- 12 weeks of guest counts
- 34 purchase records (Jun–Jul 2026)
- 18 inventory SKUs with par levels
- 7-day usage log
- Price history for eggs, milk, coffee cups, hash browns

## Pair with print checklists

- `breakfast-inventory-checklist-en.html` — daily stock check
- `breakfast-supply-usage-log-en.html` — weekly end-count log

## Production next steps

1. Replace `data.js` with API (Postgres / Sheets sync)
2. Auth: Lucas (owner) vs staff (log only)
3. Purchase entry when Lucas orders
4. Guest count from front desk daily
5. Photo upload on shortage → alert pipeline

## Tech

- Vanilla HTML/CSS/JS
- Chart.js (CDN)
- No build step
