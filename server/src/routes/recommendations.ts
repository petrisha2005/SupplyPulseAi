import { Router } from "express";
import { clearCache, getCache, setCache } from "../services/cache.js";
import { generatePo, getRecommendationBySku, getRecommendations } from "../services/recommendationEngine.js";

export const recommendationsRouter = Router();
const TTL = 60_000;

recommendationsRouter.get("/", (req, res) => {
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 30;
  const filters = {
    riskLevel: typeof req.query.riskLevel === "string" ? req.query.riskLevel : undefined,
    category: typeof req.query.category === "string" ? req.query.category : undefined,
    supplierId: typeof req.query.supplierId === "string" ? req.query.supplierId : undefined,
    urgency: typeof req.query.urgency === "string" ? req.query.urgency : undefined,
    limit: Number.isFinite(limit) ? limit : undefined
  };
  const cacheKey = `route:recommendations:${JSON.stringify(filters)}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);
  const payload = getRecommendations(filters).map((rec) => ({
    recommendationId: rec.recommendationId,
    skuId: rec.skuId,
    productName: rec.productName,
    category: rec.category,
    riskScore: rec.riskScore,
    riskLevel: rec.riskLevel,
    urgency: rec.urgency,
    urgencyLevel: rec.urgencyLevel,
    recommendedQuantity: rec.recommendedQuantity,
    recommendedSupplier: rec.recommendedSupplier,
    bestSupplier: rec.bestSupplier,
    reorderDeadlineLabel: rec.reorderDeadlineLabel,
    revenueProtected: rec.revenueProtected,
    revenueSavedEstimate: rec.revenueSavedEstimate,
    revenueAtRisk: rec.revenueAtRisk,
    estimatedPOValue: rec.estimatedPOValue,
    reasoning: rec.reasoning?.slice(0, 260),
    shortReasoning: rec.reasoning?.slice(0, 180),
    whatsappMessage: rec.whatsappMessage
  }));
  res.json(setCache(cacheKey, payload, TTL));
});

recommendationsRouter.get("/:skuId", (req, res) => {
  const recommendation = getRecommendationBySku(req.params.skuId);
  if (!recommendation) return res.status(404).json({ error: "Recommendation not found" });
  return res.json(recommendation);
});

recommendationsRouter.post("/generate-po", (req, res) => {
  clearCache();
  const skuId = String(req.body?.skuId ?? "");
  if (!skuId) return res.status(400).json({ error: "skuId is required" });
  const result = generatePo({
    skuId,
    supplierId: typeof req.body?.supplierId === "string" ? req.body.supplierId : undefined,
    quantity: typeof req.body?.quantity === "number" ? req.body.quantity : undefined
  });
  if (!result) return res.status(404).json({ error: "Unable to generate PO for SKU" });
  return res.json(result);
});
