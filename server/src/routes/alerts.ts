import { Router } from "express";
import { clearCache, getCache, setCache } from "../services/cache.js";
import { buildAlerts, generateAlerts, updateAlertStatus } from "../services/alertEngine.js";
import type { AlertStatus } from "@supplypulse/shared";

export const alertsRouter = Router();
const TTL = 30_000;

alertsRouter.get("/", (req, res) => {
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
  const filters = {
    severity: typeof req.query.severity === "string" ? req.query.severity : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    type: typeof req.query.type === "string" ? req.query.type : undefined,
    skuId: typeof req.query.skuId === "string" ? req.query.skuId : undefined,
    supplierId: typeof req.query.supplierId === "string" ? req.query.supplierId : undefined,
    limit: Number.isFinite(limit) ? limit : undefined
  };
  const cacheKey = `route:alerts:${JSON.stringify(filters)}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);
  res.json(setCache(cacheKey, buildAlerts(filters), TTL));
});

alertsRouter.post("/generate", (_req, res) => {
  clearCache();
  res.json(generateAlerts());
});

alertsRouter.patch("/:alertId/status", (req, res) => {
  clearCache();
  const status = String(req.body?.status ?? "") as AlertStatus;
  if (!["Pending", "Actioned", "Dismissed"].includes(status)) return res.status(400).json({ error: "status must be Pending, Actioned, or Dismissed" });
  const alert = updateAlertStatus(req.params.alertId, status);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  return res.json(alert);
});
