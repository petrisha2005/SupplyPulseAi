import { Router } from "express";
import { getCache, setCache } from "../services/cache.js";
import { getRiskBySku } from "../services/riskEngine.js";
import { compareSuppliers, getSupplierDependencies, getSupplierScorecards } from "../services/supplierEngine.js";
import { dataStore } from "../services/dataStore.js";
export const suppliersRouter = Router();
const TTL = 60_000;
suppliersRouter.get("/", (_req, res) => {
    const cached = getCache("route:suppliers");
    if (cached)
        return res.json(cached);
    const payload = getSupplierScorecards().map((supplier) => ({
        id: supplier.id,
        supplierId: supplier.supplierId,
        name: supplier.name,
        city: supplier.city,
        productsSupplied: supplier.productsSupplied,
        averageLeadTime: supplier.averageLeadTime,
        avgLeadDays: supplier.avgLeadDays,
        reliabilityScore: supplier.reliabilityScore,
        onTimeDeliveryPct: supplier.onTimeDeliveryPct,
        costRating: supplier.costRating,
        lastDelay: supplier.lastDelay,
        lastDelayDays: supplier.lastDelayDays,
        skuCount: supplier.skuCount,
        urgentSkus: supplier.urgentSkus,
        rankingScore: supplier.rankingScore,
        criticalSkusDependent: supplier.criticalSkusDependent,
        highRiskSkusDependent: supplier.highRiskSkusDependent,
        totalRevenueAtRiskLinked: supplier.totalRevenueAtRiskLinked,
        recommendedOrderValue: supplier.recommendedOrderValue,
        supplierRiskLevel: supplier.supplierRiskLevel,
        supplierRiskScore: supplier.supplierRiskScore,
        delayPressure: supplier.delayPressure,
        costEfficiencyScore: supplier.costEfficiencyScore,
        serviceHealthLabel: supplier.serviceHealthLabel,
        supplierInsight: supplier.supplierInsight,
        recommendedUsage: supplier.recommendedUsage
    }));
    res.json(setCache("route:suppliers", payload, TTL));
});
suppliersRouter.get("/compare", (req, res) => {
    const ids = typeof req.query.ids === "string" ? req.query.ids.split(",").map((id) => id.trim()).filter(Boolean) : [];
    if (!ids.length)
        return res.status(400).json({ error: "ids query parameter is required. Example: /api/suppliers/compare?ids=SUP-BLR,SUP-SUR" });
    if (ids.length > 3)
        return res.status(400).json({ error: "Compare supports up to 3 suppliers." });
    const result = compareSuppliers(ids);
    if (result.suppliers.length !== ids.length)
        return res.status(404).json({ error: "One or more suppliers were not found.", foundIds: result.suppliers.map((supplier) => supplier.supplierId ?? supplier.id) });
    return res.json(result);
});
suppliersRouter.get("/:supplierId/dependencies", (req, res) => {
    const result = getSupplierDependencies(req.params.supplierId);
    if (!result)
        return res.status(404).json({ error: "Supplier dependencies not found" });
    return res.json(result);
});
suppliersRouter.get("/by-sku/:skuId", (req, res) => {
    const sku = getRiskBySku(req.params.skuId);
    if (!sku)
        return res.status(404).json({ error: "SKU not found" });
    const suppliers = dataStore.getAllSuppliers().filter((supplier) => supplier.productsSupplied.includes(sku.category));
    return res.json({ skuId: sku.skuId, productName: sku.productName, suppliers });
});
suppliersRouter.get("/:skuId", (req, res) => {
    const supplier = dataStore.getSupplierById(req.params.skuId);
    if (supplier)
        return res.json(getSupplierDependencies(supplier.supplierId));
    const sku = getRiskBySku(req.params.skuId);
    if (!sku)
        return res.status(404).json({ error: "Supplier or SKU not found" });
    const suppliers = dataStore.getAllSuppliers().filter((item) => item.productsSupplied.includes(sku.category));
    return res.json({ skuId: sku.skuId, productName: sku.productName, suppliers });
});
