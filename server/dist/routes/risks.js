import { Router } from "express";
import { getCache, setCache } from "../services/cache.js";
import { getRiskBySku, getRiskExplanationBySku, getRiskList } from "../services/riskEngine.js";
export const risksRouter = Router();
const TTL = 60_000;
risksRouter.get("/", (_req, res) => {
    const cached = getCache("route:risks");
    if (cached)
        return res.json(cached);
    const payload = getRiskList().map((sku) => ({
        skuId: sku.skuId,
        productName: sku.productName,
        category: sku.category,
        riskScore: sku.riskScore,
        riskLevel: sku.riskLevel,
        riskColor: sku.riskColor,
        daysOfCover: sku.daysOfCover,
        daysCover: sku.daysOfCover,
        salesVelocity: sku.salesVelocity,
        salesVelocity7d: sku.salesVelocity7d,
        velocityTrend: sku.velocityTrend,
        channel: sku.channel,
        topChannels: sku.topChannels,
        revenueAtRisk: sku.revenueAtRisk,
        expectedStockoutLabel: sku.expectedStockoutLabel,
        expectedStockoutDate: sku.expectedStockoutDate,
        supplierId: sku.supplierId,
        supplierName: sku.supplierName,
        leadTime: sku.leadTime,
        price: sku.price,
        reasonSummary: sku.reasonSummary,
        riskReason: sku.reasonSummary,
        recommendationPriority: sku.recommendationPriority
    }));
    res.json(setCache("route:risks", payload, TTL));
});
risksRouter.get("/:skuId/explain", (req, res) => {
    const risk = getRiskExplanationBySku(req.params.skuId);
    if (!risk)
        return res.status(404).json({ error: "Risk explanation not found" });
    return res.json({
        sku: {
            skuId: risk.skuId,
            productName: risk.productName,
            category: risk.category,
            supplierName: risk.supplierName,
            brand: risk.brand
        },
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        riskColor: risk.riskColor,
        riskExplanation: risk.riskExplanation,
        formulaBreakdown: risk.riskExplanation.formulaBreakdown,
        expectedStockoutDate: risk.expectedStockoutDate,
        expectedStockoutLabel: risk.expectedStockoutLabel,
        stockoutUnits: risk.stockoutUnits,
        revenueAtRisk: risk.revenueAtRisk,
        revenueAtRiskFormatted: risk.revenueAtRiskFormatted,
        recommendationPriority: risk.recommendationPriority,
        reasonBullets: risk.reasonBullets
    });
});
risksRouter.get("/:skuId", (req, res) => {
    const risk = getRiskBySku(req.params.skuId);
    if (!risk)
        return res.status(404).json({ error: "Risk not found" });
    return res.json(risk);
});
