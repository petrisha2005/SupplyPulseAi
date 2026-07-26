

```markdown
# 🚀 SupplyPulse AI

## Real-Time AI Supply Chain Intelligence Copilot for Indian D2C Brands

SupplyPulse AI is a **Gemini-powered supply chain intelligence platform** designed for Indian D2C brands selling across multiple marketplaces such as Amazon, Shopify, Meesho, and Flipkart.

The platform combines multi-channel inventory intelligence, SKU-level risk analysis, demand forecasting, supplier intelligence, and AI-powered decision reasoning into one operational command center.

Instead of manually checking Excel sheets and reacting after products go out of stock, SupplyPulse AI helps operations teams understand:

- Which product may go out of stock
- When stockout may happen
- How much inventory should be reordered
- Which supplier should be contacted
- What action should be taken immediately

SupplyPulse AI transforms inventory data into **AI-powered executive decisions using Google Gemini reasoning.**

---

# 🌐 Live Demo

## Frontend

https://supply-pulse-ai-client.vercel.app

## Backend API

https://supplypulseai.onrender.com


---

# 🧠 AI Copilot Architecture

SupplyPulse AI uses Gemini as an **executive reasoning layer** over deterministic supply chain intelligence engines.

The AI agent:

1. Understands business questions
2. Selects relevant supply chain tools
3. Executes intelligence engines
4. Analyzes evidence
5. Generates grounded business recommendations


Architecture:

```

User Question
|
↓
Gemini AI Supply Chain Agent
|
↓
Controlled Tool Calling Layer
|
↓
-

Risk Engine
Inventory Engine
Forecast Engine
Supplier Engine
Recommendation Engine
Alert Engine
------------

```
    |
    ↓
```

Executive Supply Chain Decision

```

---

# Problem Statement

Indian D2C brands sell across multiple platforms:

- Amazon
- Shopify
- Meesho
- Flipkart

However, inventory data is usually scattered across:

- Marketplace dashboards
- Excel sheets
- Supplier updates
- ERP systems

During high-demand periods such as:

- Diwali Sale
- Big Billion Days
- Eid Sale
- Flash Sales

brands often identify stockout risks too late.

This leads to:

- Lost revenue
- Emergency purchasing
- Delayed supplier communication
- Poor customer experience
- Marketplace ranking loss
- Overstock and deadstock issues
- Lack of real-time decision support


SupplyPulse AI solves this by creating an AI-powered decision intelligence layer for D2C inventory operations.

---

# 💡 Solution Overview

SupplyPulse AI collects inventory and sales signals, analyzes SKU-level risks, forecasts demand changes, ranks suppliers, and generates AI-powered recommendations.

The system provides:

✅ Real-time inventory dashboard  
✅ SKU stockout risk scoring  
✅ Demand forecasting  
✅ Festival-aware demand analysis  
✅ Supplier intelligence  
✅ AI reorder recommendations  
✅ Executive AI briefings  
✅ Evidence-based recommendations  
✅ Operational alerts  
✅ Business reports  

---

# 🔥 Key Features

## 1. Multi-Channel Inventory Intelligence

SupplyPulse AI combines inventory signals from:

- Amazon
- Shopify
- Meesho
- Flipkart

This provides a unified view of inventory health across multiple marketplaces.

---

# 2. Gemini AI Supply Chain Copilot

The AI Copilot allows operations managers to ask natural language questions.

Example:

```

What should I do today to prevent stockouts?

```

Gemini analyzes:

- Inventory levels
- Sales velocity
- Supplier lead time
- Festival impact
- Revenue risk
- Reorder opportunities


Example output:

```

25 high-risk SKUs identified

Revenue at Risk:
₹99.0L

Immediate Action:
Reorder Handbag Premium Pack

Supplier:
Bengaluru Naturals

Revenue Protected:
₹6.7L

```

---

# 3. Morning Operations Dashboard

The dashboard provides:

- Action-needed SKUs
- Revenue at risk
- Inventory health
- Risk summary
- Reorder watchlist
- Marketplace insights

Designed for quick daily decision-making.

---

# 4. SKU Stockout Risk Scoring

Each SKU receives a stockout risk score based on:

- Current inventory
- Sales velocity
- Supplier lead time
- Demand spikes
- Festival impact
- Revenue contribution


Risk Categories:

| Risk Level | Score |
|------------|-------|
| Critical | 80+ |
| High | 70-79 |
| Medium | 40-69 |
| Low | Below 40 |

---

# 5. Human-Friendly Stock Cover

SupplyPulse AI converts technical inventory values into understandable timelines.

Examples:

| System Value | Human View |
|-------------|------------|
| 0.3 days | ~7 hours left |
| 0.4 days | ~10 hours left |
| 0.8 days | ~19 hours left |
| 1.2 days | 1 day 5 hours left |

---

# 6. Demand Forecasting

The forecasting engine analyzes:

- Recent sales history
- Moving averages
- Demand trends
- Festival multipliers
- Marketplace demand


This helps brands prepare inventory before demand spikes.

---

# 7. Gemini AI Reorder Recommendations

SupplyPulse AI converts risks into actions.

The AI recommends:

- Reorder quantity
- Best supplier
- Reorder deadline
- Revenue impact
- Purchase action


Example:

```

Reorder 600 units of Cotton Kurti Premium Pack

Supplier:
Bengaluru Naturals

Deadline:
Today before 6 PM

Revenue Protected:
₹4.6L

```

---

# 8. Supplier Intelligence

Supplier ranking considers:

- Reliability
- Lead time
- Delivery performance
- Delay risk
- SKU dependency

Helps operations teams select the best supplier during urgent situations.

---

# 9. Operational Alerts

The alert engine highlights:

- High-risk SKUs
- Stockout deadlines
- Supplier issues
- Revenue risks
- Reorder urgency

---

# 10. Executive AI Reports

Reports provide:

- Risk overview
- Top risky SKUs
- Reorder action plan
- Supplier recommendations
- Forecast summary
- Revenue impact

---

# ⚡ GPU Acceleration Concept

SupplyPulse AI demonstrates a GPU-accelerated data pipeline concept.

Prototype benchmark:

| Pipeline | Runtime |
|----------|---------|
| CPU Pipeline | 47.3 seconds |
| GPU Pipeline | 4.2 seconds |
| Speedup | 11.3x faster |

Future architecture supports:

- NVIDIA RAPIDS cuDF
- Spark RAPIDS

---

# 🏗️ System Architecture

```

Marketplace Data

Amazon
Shopify
Meesho
Flipkart

```
    ↓
```

Inventory & Sales Data Layer

```
    ↓
```

Risk Scoring Engine

```
    ↓
```

Demand Forecasting Engine

```
    ↓
```

Supplier Intelligence Engine

```
    ↓
```

Recommendation Engine

```
    ↓
```

Gemini AI Copilot

```
    ↓
```

Dashboard + Alerts + Reports

```

---

# 🖥️ Application Modules

| Page | Description |
|------|-------------|
| Landing Page | Project introduction |
| Dashboard | Inventory intelligence overview |
| Inventory | SKU monitoring |
| Risk Scores | Risk visualization |
| Forecasting | Demand prediction |
| AI Copilot | Gemini-powered assistant |
| AI Reorder | Smart recommendations |
| Suppliers | Supplier insights |
| Sale Calendar | Festival planning |
| Pipeline | Data processing insights |
| Alerts | Operational warnings |
| Reports | Executive summaries |

---

# 🛠️ Tech Stack

## Frontend

- React.js
- TypeScript
- Vite
- Tailwind CSS
- Recharts


## Backend

- Node.js
- Express.js
- TypeScript
- REST APIs


## AI Layer

- Google Gemini API
- AI Agent Architecture
- Controlled Tool Calling
- Grounded Reasoning


## Deployment

Frontend:
- Vercel

Backend:
- Render

---

# 🔌 Backend API Endpoints

```

GET /api/health

GET /api/dashboard

GET /api/inventory

GET /api/risks

GET /api/forecast/summary

GET /api/recommendations

GET /api/suppliers

GET /api/alerts

GET /api/reports/executive-summary

POST /api/ai/copilot

````

---

# ⚙️ Local Setup

## Clone Repository

```bash
git clone https://github.com/petrisha2005/SupplyPulseAi.git

cd SupplyPulseAi
````

## Install Dependencies

```bash
npm install
```

## Run Backend

```bash
npm --workspace server run dev
```

Backend:

```
http://127.0.0.1:5050
```

## Run Frontend

```bash
npm --workspace client run dev
```

Frontend:

```
http://127.0.0.1:5174
```

---

# 🔐 Environment Variables

## Backend

Create `.env` inside server:

```
PORT=5050
NODE_ENV=development
DATA_MODE=json
ENABLE_GEMINI=true
ENABLE_GPU_SIMULATION=true
CLIENT_ORIGIN=http://127.0.0.1:5174
```

## Frontend

Create `.env` inside client:

```
VITE_API_URL=http://127.0.0.1:5050
```

---

# 🚀 Deployment

## Frontend Deployment

Platform:

```
Vercel
```

Root Directory:

```
client
```

Framework:

```
Vite
```

Environment Variable:

```
VITE_API_URL=https://supplypulseai.onrender.com
```

## Backend Deployment

Platform:

```
Render
```

Root Directory:

```
server
```

Environment Variables:

```
PORT=10000
NODE_ENV=production
DATA_MODE=json
ENABLE_GEMINI=true
ENABLE_GPU_SIMULATION=true
CLIENT_ORIGIN=https://supply-pulse-ai-client.vercel.app
```

---

# 🧪 Prototype Note

This prototype uses realistic synthetic D2C inventory and sales data.

The architecture is designed for future integration with:

* Real marketplace APIs
* Google Cloud services
* BigQuery
* Google Kubernetes Engine
* Cloud Functions
* Pub/Sub
* Looker
* NVIDIA RAPIDS

---

# 🌟 Impact

SupplyPulse AI helps D2C brands:

✅ Prevent stockout losses
✅ Reduce manual Excel operations
✅ Improve inventory planning
✅ Make faster supplier decisions
✅ Protect festival sales revenue
✅ Move from dashboards to AI-powered decisions

---

# 📌 One-Line Summary

**SupplyPulse AI is a Gemini-powered supply chain copilot that helps Indian D2C brands predict inventory risks, forecast demand, and take proactive actions before stockouts happen.**

---

# 👩‍💻 Author

## Petrisha V

Built for:

**Gen AI Academy APAC Edition**

```


```

