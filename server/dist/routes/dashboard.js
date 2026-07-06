import { Router } from "express";
import { getCache, setCache } from "../services/cache.js";
import { getPipelineStatus } from "../services/pipelineEngine.js";
import { getRiskList } from "../services/riskEngine.js";
export const dashboardRouter = Router();
const TTL = 60_000;
dashboardRouter.get("/", (_req, res) => {
    const cached = getCache("route:dashboard");
    if (cached)
        return res.json(cached);
    const risks = getRiskList();
    const criticalSkus = risks.filter((sku) => sku.riskLevel === "Critical");
    const highRiskSkus = risks.filter((sku) => sku.riskLevel === "High");
    const mediumRiskSkus = risks.filter((sku) => sku.riskLevel === "Medium");
    const lowRiskSkus = risks.filter((sku) => sku.riskLevel === "Low");
    const avgDaysCover = risks.length ? risks.reduce((sum, sku) => sum + sku.daysOfCover, 0) / risks.length : 0;
    const pipeline = getPipelineStatus();
    const payload = {
        totalSkus: risks.length,
        criticalSkus: criticalSkus.length,
        highRiskSkus: criticalSkus.length + highRiskSkus.length,
        highOnlySkus: highRiskSkus.length,
        mediumRiskSkus: mediumRiskSkus.length,
        lowRiskSkus: lowRiskSkus.length,
        avgDaysCover: Number(avgDaysCover.toFixed(1)),
        revenueAtRisk: risks.reduce((sum, sku) => sum + sku.revenueAtRisk, 0),
        forecastAccuracy: 91.4,
        skusScanned: risks.length,
        topRiskSkus: risks.slice(0, 8),
        lastRefreshTime: pipeline.lastRunTime,
        lastUpdated: pipeline.lastRunTime,
        nextRefreshSeconds: 1800,
        pipelineStatus: `${pipeline.pipelineLabel}: ${pipeline.durationSeconds}s`,
        riskDistribution: [
            { level: "Low", count: lowRiskSkus.length },
            { level: "Medium", count: mediumRiskSkus.length },
            { level: "High", count: highRiskSkus.length },
            { level: "Critical", count: criticalSkus.length }
        ]
    };
    res.json(setCache("route:dashboard", payload, TTL));
});
