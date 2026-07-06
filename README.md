# SupplyPulse AI

SupplyPulse AI is a hackathon-ready supply chain command center for Indian D2C brands that predicts SKU stockout risk, recommends reorder actions, and generates a morning executive report.

## Problem Statement

Indian D2C teams sell through Amazon, Meesho, Shopify, Flipkart, and ERP-backed warehouses, but inventory, demand, and supplier data often live in separate exports. Founders lose revenue when sale-event demand spikes before reorder decisions are made, and operations teams spend hours reconciling spreadsheets before supplier calls.

## Solution

SupplyPulse AI fuses local multi-channel inventory, sales history, supplier reliability, sale-event multipliers, forecast demand, risk scoring, reorder recommendations, alerts, and pipeline status into one operational dashboard. The current version uses a JSON local data layer so demos are reliable and the architecture remains ready for future BigQuery, GCP, GPU, and Gemini integration.

## Target Users

- D2C founders running lean inventory operations.
- Marketplace operations managers.
- Supply chain analysts.
- Category managers handling sale events and supplier calls.

## Key Features

- Morning dashboard with KPI cards, realistic risk distribution, SKU table, and recommendation panel.
- SKU risk scoring with explainable formula drivers.
- Forecasting page with 7-day and 30-day demand, trend direction, and event impact.
- AI Reorder page with reorder quantity, supplier choice, PO draft, and WhatsApp-ready message.
- Supplier scorecards with dependency risk, delay simulation, and supplier comparison.
- Alerts center with status updates and operational alert types.
- Pipeline simulator with 8 stages, GPU-vs-CPU benchmark, and run history.
- Executive Reports page with print, JSON download, and copyable summary.

## Architecture

```text
React + Vite client
        |
        | REST API
        v
Express + TypeScript server
        |
        v
JSON local data layer
        |
        v
Risk, forecast, recommendation, supplier, alert, pipeline, and report engines
```

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Recharts, lucide-react.
- Backend: Node.js, Express, TypeScript.
- Shared types: local `@supplypulse/shared` workspace package.
- Data: JSON seed files for SKUs, suppliers, events, channels, and sales history.
- Database status: no external DB yet; Phase 2 local JSON layer is the source of truth.
- AI/GPU status: simulated Gemini-style recommendation and GPU acceleration story; no paid external APIs required.

## Screens And Pages

- Problem
- Dashboard
- Inventory
- Risk Scores
- Forecasting
- AI Reorder
- Suppliers
- Sale Calendar
- Acceleration
- Pipeline
- Alerts
- Reports
- Demo Controls

## Backend APIs

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/inventory`
- `GET /api/inventory/:skuId`
- `GET /api/risks`
- `GET /api/risks/:skuId/explain`
- `GET /api/forecast/summary`
- `GET /api/forecast/compare?skuIds=SKU1,SKU2`
- `GET /api/forecast/:skuId`
- `GET /api/recommendations`
- `GET /api/recommendations/:skuId`
- `POST /api/recommendations/generate-po`
- `GET /api/suppliers`
- `GET /api/suppliers/:supplierId/dependencies`
- `GET /api/suppliers/compare?ids=SUP-BLR,SUP-SUR`
- `GET /api/events`
- `GET /api/alerts`
- `POST /api/alerts/generate`
- `PATCH /api/alerts/:alertId/status`
- `GET /api/pipeline/status`
- `GET /api/pipeline/runs`
- `POST /api/pipeline/run`
- `GET /api/reports/executive-summary`
- `POST /api/simulate/flash-sale`
- `POST /api/simulate/supplier-delay`
- `POST /api/simulate/channel-mismatch`
- `POST /api/simulate/benchmark`
- `POST /api/simulate/reset`

## Data Model

Core entities:

- SKU: product, category, brand, price, cost, stock, committed stock, safety stock, supplier IDs, channel stock.
- Supplier: location, lead time, reliability, on-time delivery, cost rating, delay days, min order quantity.
- Sales history: daily SKU/channel units, revenue, returns, promo flag, and event linkage.
- Event: sale/festival date range, categories, channels, multiplier, and priority.
- Alert: type, severity, status, SKU/supplier/channel context, revenue at risk, and suggested action.
- Pipeline run: stages, row counts, duration, speedup, alerts generated, and recommendations generated.

## Risk Formula

The risk engine creates a 0-100 score from weighted drivers:

- Days cover risk: 35%.
- Velocity trend risk: 20%.
- Festival/event risk: 15%.
- Supplier pressure: 15%.
- Committed stock pressure: 10%.
- Channel concentration: 5%.

Most scores are capped below 98 unless the SKU is truly extreme, which keeps the dashboard realistic while still allowing rare 100-level situations.

## Forecast Formula

The forecasting engine blends:

- 50% recent 7-day average.
- 30% 28-day baseline.
- 20% same-weekday average.
- Capped trend adjustment.
- Event/festival multiplier based on proximity and affected channel/category.

It returns confidence, channel split, reorder window, 7-day demand, 30-day demand, and explanation text.

## Recommendation Formula

The recommendation engine calculates:

- Lead-time demand.
- 7-day safety buffer.
- Event buffer.
- Committed stock requirement.
- Current available stock offset.
- Supplier min-order rounding and practical caps.

It ranks suppliers by reliability, on-time percentage, lead time, cost, recent delay, and whether they are the primary supplier for the SKU.

## Supplier Scoring Formula

Supplier risk considers:

- Recent delay days.
- On-time delivery percentage.
- Reliability score.
- Average lead time.
- Critical/high-risk SKU dependencies.
- Revenue at risk linked to dependent SKUs.

Levels are `Healthy`, `Watch`, `Risky`, and `Critical`.

## Alerts And Pipeline Logic

Alerts are generated for stockout risk, supplier delay, festival spike, reorder deadline, channel mismatch, revenue at risk, and pipeline events. Alerts can be marked pending, actioned, or dismissed.

The pipeline simulates eight stages: marketplace ingestion, data cleaning, channel inventory fusion, forecast generation, risk scoring, recommendation generation, alert generation, and dashboard refresh.

## Acceleration Story

- CPU pipeline: 47.3s.
- GPU pipeline: 4.2s.
- Speedup: 11.3x.
- Demo value: morning insight generation moves from manual spreadsheet work to a repeatable pipeline loop.
- Future path: Cloud Run, BigQuery, GCS, Gemini, and GKE GPU node pools.

## Run Locally

Install dependencies:

```bash
npm install
```

Copy environment examples if needed:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Run both apps:

```bash
npm run dev
```

Run separately:

```bash
npm run dev:server
npm run dev:client
```

Default URLs:

- Frontend: `http://127.0.0.1:5174` or the next Vite port if 5174 is occupied.
- Backend: `http://127.0.0.1:5050`.
- Health check: `http://127.0.0.1:5050/api/health`.

If an old backend process is still occupying port 5050, stop it before the demo:

```bash
lsof -i :5050
kill -9 <PID>
```

Explicit canonical demo commands:

```bash
PORT=5050 npm --workspace server run start
VITE_API_URL=http://127.0.0.1:5050 npm --workspace client run dev -- --port 5174
```

Alternate ports if 5050/5174 are busy:

```bash
PORT=5051 npm --workspace server run start
VITE_API_URL=http://127.0.0.1:5051 npm --workspace client run dev -- --port 5175
```

## Build Checks

```bash
npm --workspace shared run typecheck
npm --workspace server run typecheck
npm --workspace server run build
npm --workspace client run typecheck
npm --workspace client run build
```

The Vite chunk-size warning is currently non-blocking for the demo. Splitting heavier pages with `React.lazy` is a future optimization.

## Smoke Tests

Start the backend first, then run:

```bash
npm --workspace server run smoke
```

From the repository root, this alias is also available:

```bash
npm run smoke
```

Optional custom target:

```bash
SMOKE_API_URL=https://your-backend.example.com npm --workspace server run smoke
```

## Demo Flow

Use `DEMO_FLOW.md` for the 5-7 minute talk track. The high-level flow is Dashboard, Risk explanation, Forecasting, AI Reorder, Suppliers, supplier delay simulation, Alerts, Pipeline, and Reports.

## Screenshots

Screenshots are not committed in this repository. For submission packaging, capture:

- Dashboard morning report.
- Forecasting demand view.
- AI Reorder recommendation and PO modal.
- Supplier scorecard/dependency view.
- Alerts center after supplier delay simulation.
- Pipeline stage history.
- Reports executive summary.

## Deployment Guide

### Frontend: Vercel

- Root directory: `client`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Environment variable: `VITE_API_URL=https://your-render-backend.onrender.com`.

### Backend: Render

- Root directory: `server`.
- Build command: `npm install && npm run build`.
- Start command: `npm run start`.
- Health check endpoint: `/api/health`.
- Required env variables:
  - `PORT`
  - `HOST=0.0.0.0`
  - `NODE_ENV=production`
  - `CLIENT_ORIGIN=https://your-vercel-app.vercel.app`
  - `DATA_MODE=json`
  - `ENABLE_GEMINI=false`
  - `ENABLE_GPU_SIMULATION=true`

### Optional Future Deployment

- Cloud Run for backend APIs.
- BigQuery for SKU, sales, supplier, and event tables.
- GCS for marketplace export ingestion.
- Gemini for guarded recommendation generation.
- GKE GPU pipeline for RAPIDS-style batch scoring.

## Future Scope

- Real marketplace connectors.
- Persistent database with organization workspaces.
- Auth, roles, and audit trail.
- Gemini API integration with grounded prompts.
- BigQuery warehouse and scheduled transforms.
- Supplier email, WhatsApp, and ERP purchase order integrations.
- Production observability and alert notification channels.

## Known Limitations

- Current data is local JSON seed data, not live marketplace data.
- GPU performance is simulated for hackathon storytelling.
- Gemini is not connected yet.
- No authentication or multi-tenant organization model yet.
