# SupplyPulse AI

## Real-Time Supply Chain Intelligence for Indian D2C Brands

SupplyPulse AI is an AI-powered inventory intelligence platform designed for Indian D2C brands selling across multiple marketplaces such as **Amazon, Shopify, Meesho, and Flipkart**.

The platform helps brands prevent stockouts by combining multi-channel inventory data, SKU-level sales trends, supplier reliability, festival demand impact, and reorder intelligence into one actionable dashboard.

Instead of manually checking Excel sheets and reacting after products go out of stock, SupplyPulse AI helps operations managers understand:

> Which product may go out of stock, when it may happen, how much to reorder, and which supplier to contact.

---

## Live Demo

**Frontend:**  
https://supply-pulse-ai-client.vercel.app

**Backend API:**  
https://supplypulseai.onrender.com

---

## Problem Statement

Indian D2C brands often sell across multiple platforms such as Amazon, Shopify, Meesho, and Flipkart. Their inventory data is usually scattered across marketplace dashboards, spreadsheets, supplier updates, and ERP tools.

During high-demand periods such as Diwali, Big Billion Day, Eid Sale, and flash sales, brands may not identify stockout risks early enough.

This leads to:

- Lost revenue due to stockouts
- Manual reorder calculations
- Delayed supplier communication
- Poor customer experience
- Lower marketplace ranking
- Overstock or deadstock issues
- Lack of real-time decision support

SupplyPulse AI solves this by creating a real-time decision intelligence layer for D2C inventory operations.

---

## Solution Overview

SupplyPulse AI ingests multi-channel sales and inventory data, analyzes SKU-level demand patterns, forecasts stockout risk, and generates reorder recommendations.

The system provides:

- Real-time dashboard for operations managers
- SKU-level stockout risk scoring
- Demand forecasting based on sales trends
- Festival-aware demand impact
- Supplier reliability scoring
- AI-powered reorder recommendations
- Purchase order and WhatsApp draft generation
- Alerts for urgent stockout risks
- Executive reports for business decisions

---

## Key Features

### 1. Multi-Channel Inventory Fusion

SupplyPulse AI unifies sales and inventory signals from four key D2C channels:

- Amazon
- Shopify
- Meesho
- Flipkart

This gives brands a single view of inventory health across all major sales channels.

---

### 2. Dashboard / Morning Brief

The dashboard gives a quick morning summary for the operations manager.

It shows:

- Action-needed SKUs
- Revenue at risk
- Average stock cover
- SKUs scanned
- Reorder watchlist
- Marketplace badges
- GPU pipeline status

The dashboard is designed to help the operations manager take quick decisions before stockouts happen.

---

### 3. SKU Stockout Risk Scoring

Each SKU receives a stockout risk score from 0 to 100.

The score considers:

- Current inventory
- Sales velocity
- Supplier lead time
- Festival or sale-event demand
- Marketplace demand concentration
- Revenue impact

Risk categories:

| Risk Level | Score Range |
|---|---|
| Critical | 80+ |
| High | 70–79 |
| Medium | 40–69 |
| Low | Below 40 |

---

### 4. Human-Friendly Stock Cover

Instead of showing confusing decimal values like `0.3 days`, the platform displays clear stock-left timing.

Examples:

| Old Format | New Format |
|---|---|
| 0.3 days | ~7 hrs left |
| 0.4 days | ~10 hrs left |
| 0.8 days | ~19 hrs left |
| 1.2 days | 1 day 5 hrs left |
| 14.4 days | 14.4 days left |

This makes the dashboard easier for non-technical users to understand.

---

### 5. Demand Forecasting

The forecasting module predicts upcoming SKU demand using:

- Recent sales history
- 7-day moving average
- 28-day baseline
- Trend adjustment
- Festival/event multiplier
- Channel-wise demand split

This helps brands prepare before stockouts happen, especially during sales events and festivals.

---

### 6. AI Reorder Recommendation

SupplyPulse AI converts risk insights into action.

It recommends:

- Quantity to reorder
- Best supplier
- Reorder deadline
- Expected stockout timing
- Revenue protected
- Purchase order draft
- WhatsApp supplier message

Example recommendation:

> Reorder 600 units of Cotton Kurti Premium Pack from Bengaluru Naturals before 6 PM to avoid stockout risk.

---

### 7. Supplier Intelligence

The supplier module ranks suppliers based on:

- Reliability
- Lead time
- Delay risk
- Cost
- On-time delivery history
- SKU dependency

This helps operations managers choose the best supplier for urgent replenishment.

---

### 8. Alerts

The alerts page highlights urgent operational issues such as:

- High-risk SKUs
- Stockout deadlines
- Supplier delays
- Reorder urgency
- Revenue-at-risk warnings

---

### 9. Pipeline / Acceleration

SupplyPulse AI demonstrates a GPU-accelerated data pipeline concept.

The pipeline compares:

- CPU pipeline runtime
- GPU pipeline runtime
- Speedup achieved
- Refresh cycle readiness

Prototype benchmark:

| Pipeline | Runtime |
|---|---|
| CPU Pipeline | 47.3 seconds |
| GPU Pipeline | 4.2 seconds |
| Speedup | 11.3× faster |

---

### 10. Executive Reports

The reports page provides a business-ready summary including:

- Risk overview
- Top risky SKUs
- Reorder action plan
- Supplier recommendations
- Forecast summary
- Revenue at risk
- Download / print options

---

## Tech Stack

### Frontend

- React.js
- TypeScript
- Vite
- Tailwind CSS
- Recharts

### Backend

- Node.js
- Express.js
- TypeScript
- REST APIs
- JSON-based demo data layer

### Deployment

- Frontend: Vercel
- Backend: Render

### Proposed Cloud Architecture

- Google Cloud Storage
- BigQuery
- Google Kubernetes Engine
- Cloud Functions
- Cloud Scheduler
- Pub/Sub
- Looker
- Gemini Enterprise Agent
- NVIDIA RAPIDS cuDF
- Spark RAPIDS

---

```md
# 🏗️ Project Architecture

```

Marketplace Data

Amazon / Shopify / Meesho / Flipkart
↓
Inventory & Sales Data Layer
↓
Risk Scoring Engine
↓
Demand Forecasting Engine
↓
Supplier Ranking Engine
↓
AI Reorder Recommendation
↓
Dashboard + Alerts + Reports

```

---

###🖥️ **Main Pages**

The application consists of the following modules:

| Page | Description |
|------|-------------|
| Landing Page | Introduction and overview of SupplyPulse AI |
| Dashboard | Real-time inventory intelligence overview |
| Inventory | SKU-level inventory monitoring |
| Risk Scores | Product risk analysis and risk visualization |
| Forecasting | Demand prediction and future inventory planning |
| AI Reorder | Intelligent reorder recommendations |
| Suppliers | Supplier ranking and performance insights |
| Sale Calendar | Festival and sales event planning |
| Acceleration | Growth and optimization insights |
| Pipeline | Data pipeline monitoring |
| Alerts | Inventory and business alerts |
| Reports | Executive summaries and business reports |
| API Overview | Backend API documentation |

---
**
##🔌 Backend API Endpoints**

```

GET /api/health
GET /api/dashboard
GET /api/inventory
GET /api/risks
GET /api/forecast/summary
GET /api/recommendations
GET /api/suppliers
GET /api/alerts
GET /api/pipeline/status
GET /api/reports/executive-summary

````

---

# **⚙️ Local Setup**

## 1. Clone Repository

```bash
git clone https://github.com/petrisha2005/SupplyPulseAi.git

cd SupplyPulseAi
````

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Run Backend

```bash
npm --workspace server run dev
```

Backend runs at:

```
http://127.0.0.1:5050
```

---

## 4. Run Frontend

```bash
npm --workspace client run dev
```

Frontend runs at:

```
http://127.0.0.1:5174
```

---

# 🔐 Environment Variables

## Backend

Create `.env` inside the `server` folder:

```env
PORT=5050
NODE_ENV=development
DATA_MODE=json
ENABLE_GEMINI=false
ENABLE_GPU_SIMULATION=true
CLIENT_ORIGIN=http://127.0.0.1:5174
```

---

## Frontend

Create `.env` inside the `client` folder:

```env
VITE_API_URL=http://127.0.0.1:5050
```

---

# 🚀 Deployment

## Backend Deployment (Render)

### Render Configuration

```
Root Directory:
server

Environment:
Node

Build Command:
npm install --include=dev && npm run build

Start Command:
npm run start
```

### Environment Variables

```env
PORT=10000
NODE_ENV=production
DATA_MODE=json
ENABLE_GEMINI=false
ENABLE_GPU_SIMULATION=true
CLIENT_ORIGIN=https://supply-pulse-ai-client.vercel.app
```

### Backend Live URL

```
https://supplypulseai.onrender.com
```

---

## Frontend Deployment (Vercel)

### Vercel Configuration

```
Root Directory:
client

Framework:
Vite

Build Command:
npm run build

Output Directory:
dist
```

### Environment Variable

```env
VITE_API_URL=https://supplypulseai.onrender.com
```

### Frontend Live URL

```
https://supply-pulse-ai-client.vercel.app
```

---

# 🧪 Build Commands

Run type checks and builds:

```bash
npm --workspace shared run typecheck

npm --workspace server run typecheck

npm --workspace server run build

npm --workspace client run typecheck

npm --workspace client run build
```

---

# 🎬 Demo Flow

Recommended demo flow:

1. Open the Landing Page

2. Click **Launch Dashboard**

3. Show:

   * Action-needed SKUs
   * Revenue at risk
   * Inventory overview

4. Open **Risk Scores**

   * Demonstrate SKU risk heatmap

5. Open **Forecasting**

   * Show demand prediction insights

6. Open **AI Reorder**

   * Show reorder quantity recommendations
   * Supplier recommendations

7. Open **Reports**

   * Show executive summary
   * AI-generated action plan

---

# 🧪 Prototype Note

This prototype uses realistic synthetic D2C inventory and sales data to demonstrate the complete supply chain intelligence workflow.

The system is architected for future integration with:

* Real marketplace APIs
* Google Cloud services
* Gemini AI
* NVIDIA RAPIDS-based GPU acceleration

---

# 🌟 Project Impact

SupplyPulse AI helps D2C brands:

* Prevent stockout losses
* Reduce manual Excel operations
* Improve inventory accuracy
* Reorder before demand spikes
* Protect revenue during festivals and sales
* Make faster supplier decisions
* Move from dashboards to actionable recommendations

---

# 📌 One-Line Summary

> SupplyPulse AI is a real-time inventory intelligence platform that helps D2C brands prevent stockouts by predicting SKU risk, forecasting demand, and recommending reorder actions.

---

# 👩‍💻 Author

**Petrisha V**

Built for **Gen AI Academy APAC Edition**

```
```

