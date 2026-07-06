# SupplyPulse AI Submission Checklist

## Build Checks

- [ ] `npm --workspace shared run typecheck`
- [ ] `npm --workspace server run typecheck`
- [ ] `npm --workspace server run build`
- [ ] `npm --workspace client run typecheck`
- [ ] `npm --workspace client run build`
- [ ] Confirm any Vite chunk-size warning is documented as non-blocking.

## Smoke Tests

- [ ] Start backend on `http://127.0.0.1:5050`.
- [ ] Run `npm --workspace server run smoke`.
- [ ] Or run root alias `npm run smoke`.
- [ ] Confirm `/api/reports/executive-summary` passes.
- [ ] Confirm `/api/health` returns `{ ok: true }`.
- [ ] If 5050 is stale, run `lsof -i :5050` and `kill -9 <PID>`, then restart.

## Feature Checklist

- [ ] Dashboard shows realistic KPIs, alert banner, SKU risk table, and Gemini-style recommendation panel.
- [ ] SKU risk explanation shows formula drivers and revenue at risk.
- [ ] Forecasting shows 7-day and 30-day demand with event impact.
- [ ] AI Reorder shows reorder quantity, supplier, PO draft, WhatsApp message, and reasoning.
- [ ] Suppliers shows scorecards, dependencies, comparison, and delay simulation.
- [ ] Alerts supports pending/actioned/dismissed workflow.
- [ ] Pipeline supports run history and 8-stage simulation.
- [ ] Reports page supports print, JSON download, and copy executive summary.

## Demo Checklist

- [ ] Browser opens the correct frontend URL.
- [ ] Default demo uses backend `http://127.0.0.1:5050` and frontend `http://127.0.0.1:5174`.
- [ ] Alternate demo path is documented: backend `5051`, frontend `5175`.
- [ ] Backend health check is reachable.
- [ ] Dashboard loads without blank screen.
- [ ] Supplier delay simulation refreshes supplier/alert risk.
- [ ] Pipeline run completes and updates run history.
- [ ] Reports page loads from `/api/reports/executive-summary`.
- [ ] Print preview hides navigation and keeps tables readable.

## Deployment Checklist

- [ ] `client/.env.example` exists with `VITE_API_URL`.
- [ ] `server/.env.example` exists with server and feature flags.
- [ ] Vercel frontend build command documented.
- [ ] Vercel output directory documented.
- [ ] Render backend build/start commands documented.
- [ ] Render `HOST=0.0.0.0` documented.
- [ ] Render health check endpoint documented.

## Security Checklist

- [ ] No secrets committed.
- [ ] `GEMINI_API_KEY` is blank in examples.
- [ ] CORS origin can be restricted with `CLIENT_ORIGIN`.
- [ ] No production credentials in JSON seed data.
- [ ] No external paid API calls required for demo.

## Known Limitations

- Local JSON data layer only; no live marketplace connectors yet.
- Gemini is simulated through a deterministic recommendation engine.
- GPU acceleration is a benchmark simulation, not a live RAPIDS/GPU job.
- No authentication, organizations, or role-based access yet.
- Alerts are in-memory during a server process and reset with demo data.

## Future Scope

- BigQuery warehouse and scheduled transforms.
- GCS export ingestion.
- Gemini grounded recommendation layer.
- Cloud Run backend deployment.
- GKE GPU batch scoring pipeline.
- Supplier WhatsApp/email/ERP integrations.
- Persistent database, auth, workspaces, and audit logs.
