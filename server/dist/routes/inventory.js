import { Router } from "express";
import { getCache, setCache } from "../services/cache.js";
import { getInventoryList, getRiskBySku } from "../services/riskEngine.js";
export const inventoryRouter = Router();
const TTL = 60_000;
inventoryRouter.get("/", (_req, res) => {
    const cached = getCache("route:inventory");
    if (cached)
        return res.json(cached);
    const payload = getInventoryList().map((sku) => ({
        skuId: sku.skuId,
        productName: sku.productName,
        category: sku.category,
        brand: "brand" in sku ? sku.brand : undefined,
        price: sku.price,
        channelStock: sku.channelStock,
        totalAvailableStock: sku.totalAvailableStock,
        committedStock: sku.committedStock,
        salesVelocity: sku.salesVelocity,
        salesVelocity7d: "salesVelocity7d" in sku ? sku.salesVelocity7d : sku.salesVelocity,
        velocityTrend: sku.velocityTrend,
        daysOfCover: sku.daysOfCover,
        daysCover: sku.daysOfCover,
        supplierName: sku.supplierName,
        supplierId: sku.supplierId,
        leadTime: sku.leadTime,
        festivalProximity: sku.festivalProximity,
        riskScore: sku.riskScore,
        riskLevel: sku.riskLevel,
        revenueAtRisk: sku.revenueAtRisk
    }));
    res.json(setCache("route:inventory", payload, TTL));
});
inventoryRouter.get("/:skuId", (req, res) => {
    const sku = getRiskBySku(req.params.skuId);
    if (!sku)
        return res.status(404).json({ error: "SKU not found" });
    return res.json(sku);
});
