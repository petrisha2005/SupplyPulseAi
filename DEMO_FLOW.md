# SupplyPulse AI Demo Flow

Use this as a 5-7 minute demo script.

## Demo Setup

Default local run:

```bash
PORT=5050 npm --workspace server run start
VITE_API_URL=http://127.0.0.1:5050 npm --workspace client run dev -- --port 5174
```

Open `http://127.0.0.1:5174/`.

If port 5050 is occupied by an older backend:

```bash
lsof -i :5050
kill -9 <PID>
```

Alternate local run:

```bash
PORT=5051 npm --workspace server run start
VITE_API_URL=http://127.0.0.1:5051 npm --workspace client run dev -- --port 5175
```

## 1. Dashboard: Morning Command Center

Talking point: "SupplyPulse AI starts every morning by scanning SKU inventory across Amazon, Meesho, Shopify, Flipkart, and ERP stock. The founder sees critical SKUs, days of cover, revenue at risk, and the current pipeline status without opening five spreadsheets."

Action: Open Dashboard and point to Critical SKUs, Revenue at Risk, SKUs scanned, the alert banner, and the top SKU table.

## 2. Critical SKU Risk

Talking point: "The risk score is not a black box. It combines days cover, velocity trend, festival multiplier, supplier lead time, committed stock, and channel concentration."

Action: Click a high-risk SKU and use the "Why?" or risk explanation control to show the formula breakdown.

## 3. Forecasting

Talking point: "The forecast engine blends recent 7-day demand, 28-day baseline, same-weekday behavior, trend, and festival uplift. This tells us if demand is genuinely rising or if the SKU can wait."

Action: Open Forecasting and select a risky SKU. Show 7-day demand, 30-day demand, trend direction, event multiplier, and channel split.

## 4. AI Reorder

Talking point: "SupplyPulse converts risk into an action: how many units to reorder, which supplier to use, when to confirm dispatch, the PO value, and the revenue protected."

Action: Open AI Reorder. Show recommendation quantity, supplier, urgency, reasoning, PO draft, and WhatsApp-ready supplier message.

## 5. Suppliers

Talking point: "Stockout risk is connected to supplier reality. If a supplier is delayed or many critical SKUs depend on them, the system flags it and suggests alternatives."

Action: Open Suppliers. Show supplier scorecards, dependency risk, critical SKU count, lead time, and reliability.

## 6. Supplier Delay Simulation

Talking point: "Now we stress test the operation. A supplier delay should immediately change risk posture and create actionable alerts."

Action: Run the supplier delay simulation from Suppliers or Demo Controls. Wait for the confirmation toast and refreshed metrics.

## 7. Alerts

Talking point: "Alerts turn analytics into an operations queue: reorder deadlines, supplier delay, festival spikes, channel mismatch, and revenue at risk."

Action: Open Alerts. Filter or inspect pending critical alerts. Mark one alert actioned to show workflow status.

## 8. Pipeline

Talking point: "The pipeline simulates ingestion, cleaning, inventory fusion, forecasting, risk scoring, recommendations, alert generation, and dashboard refresh."

Action: Open Pipeline and run the pipeline. Show the 8 stages, rows processed, generated alerts, recommendations, GPU duration, CPU baseline, and 11.3x speedup.

## 9. Reports

Talking point: "Finally, the founder gets a boardroom-ready morning report with risk, recommendations, suppliers, forecast, alerts, and the acceleration benchmark."

Action: Open Reports. Show the executive summary, KPI grid, top risky SKUs, reorder action plan, supplier risk, forecast summary, alerts, pipeline benchmark, then use Print report, Download JSON, and Copy summary.

## Closing Line

"SupplyPulse AI moves a D2C brand from reactive spreadsheet firefighting to an explainable, automated morning decision loop: what is at risk, why it is at risk, who can supply it, and what action protects revenue today."
