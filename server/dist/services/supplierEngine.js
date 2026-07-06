import { dataStore } from "./dataStore.js";
import { getRisks } from "./riskEngine.js";
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const compactRupee = (value) => {
    const abs = Math.abs(value);
    if (abs >= 10000000)
        return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000)
        return `₹${(value / 100000).toFixed(1)}L`;
    if (abs >= 1000)
        return `₹${Math.round(value / 1000)}K`;
    return `₹${Math.round(value)}`;
};
export const toLegacySupplier = (supplierId) => {
    const supplier = dataStore.getSupplierById(supplierId);
    if (!supplier) {
        return {
            id: supplierId,
            supplierId,
            name: "Unknown Supplier",
            productsSupplied: [],
            averageLeadTime: 7,
            avgLeadDays: 7,
            reliabilityScore: 70,
            costRating: 3,
            lastDelay: "Unknown",
            lastDelayDays: 0,
            onTimeDeliveryPct: 70,
            city: "Unknown"
        };
    }
    return {
        id: supplier.supplierId,
        supplierId: supplier.supplierId,
        name: supplier.name,
        productsSupplied: supplier.productsSupplied,
        averageLeadTime: supplier.avgLeadDays,
        avgLeadDays: supplier.avgLeadDays,
        reliabilityScore: supplier.reliabilityScore,
        onTimeDeliveryPct: supplier.onTimeDeliveryPct,
        costRating: supplier.costRating,
        minOrderQuantity: supplier.minOrderQuantity,
        lastDelay: supplier.lastDelayDays ? `${supplier.lastDelayDays} days` : "No active delay",
        lastDelayDays: supplier.lastDelayDays,
        city: supplier.city
    };
};
const supplierRiskLevel = (score) => {
    if (score <= 30)
        return "Healthy";
    if (score <= 60)
        return "Watch";
    if (score <= 80)
        return "Risky";
    return "Critical";
};
const serviceHealth = (level) => {
    if (level === "Healthy")
        return "Reliable today";
    if (level === "Watch")
        return "Watch closely";
    if (level === "Risky")
        return "Delay pressure";
    return "Avoid for critical SKUs";
};
const recommendedUsage = (level, delayDays, criticalSkus) => {
    if (level === "Critical" || delayDays >= 4)
        return "Avoid today";
    if (level === "Risky" || criticalSkus >= 4)
        return "Backup supplier only";
    if (level === "Watch")
        return "Planned replenishment";
    return "Urgent orders";
};
const insight = (supplier, level, highRiskSkus, criticalSkus) => {
    if (level === "Healthy")
        return "Healthy supplier. Good for planned replenishment and urgent dispatch when stock cover is tight.";
    if (level === "Watch")
        return `Watch closely: ${highRiskSkus} high-risk SKUs depend on this supplier.`;
    if (level === "Risky")
        return `Risky for urgent orders because recent delay pressure is ${supplier.lastDelayDays} days and ${criticalSkus} critical SKUs depend on it.`;
    return "Avoid for critical SKUs today; choose a faster alternate supplier.";
};
const scoreSupplier = (supplier, linkedRevenueAtRisk, criticalSkus) => {
    const delayPressure = clamp(supplier.lastDelayDays * 18 + Math.max(0, supplier.avgLeadDays - 5) * 8, 0, 100);
    const onTimePressure = clamp((100 - supplier.onTimeDeliveryPct) * 1.25, 0, 100);
    const reliabilityPressure = clamp((100 - supplier.reliabilityScore) * 1.1, 0, 100);
    const criticalPressure = clamp(criticalSkus * 14, 0, 100);
    const revenuePressure = clamp(linkedRevenueAtRisk / 3000000 * 100, 0, 100);
    const supplierRiskScore = Math.round(delayPressure * 0.25 +
        onTimePressure * 0.2 +
        reliabilityPressure * 0.15 +
        criticalPressure * 0.25 +
        revenuePressure * 0.15);
    return {
        supplierRiskScore,
        delayPressure: Math.round(delayPressure),
        costEfficiencyScore: Math.round(clamp((6 - supplier.costRating) * 18 + supplier.onTimeDeliveryPct * 0.1, 0, 100))
    };
};
export const getSupplierScorecards = () => {
    const risks = getRisks();
    return dataStore.getAllSuppliers().map((supplier) => {
        const supplierSkus = dataStore.getAllSkus().filter((sku) => sku.supplierIds.includes(supplier.supplierId));
        const dependentRisks = risks.filter((sku) => supplierSkus.some((item) => item.skuId === sku.skuId));
        const criticalSkusDependent = dependentRisks.filter((sku) => sku.riskLevel === "Critical").length;
        const highRiskSkusDependent = dependentRisks.filter((sku) => sku.riskLevel === "High").length;
        const totalRevenueAtRiskLinked = dependentRisks.reduce((sum, sku) => sum + sku.revenueAtRisk, 0);
        const recommendedOrderValue = dependentRisks
            .filter((sku) => ["High", "Critical"].includes(sku.riskLevel))
            .reduce((sum, sku) => sum + Math.max(0, sku.revenueAtRisk * 0.58), 0);
        const scored = scoreSupplier(supplier, totalRevenueAtRiskLinked, criticalSkusDependent);
        const level = supplierRiskLevel(scored.supplierRiskScore);
        const urgencyPenalty = supplier.lastDelayDays * 3 + Math.max(0, supplier.avgLeadDays - 5) * 2;
        const rankingScore = Math.round(supplier.reliabilityScore * 0.65 + supplier.onTimeDeliveryPct * 0.25 + (6 - supplier.costRating) * 4 - urgencyPenalty);
        return {
            ...toLegacySupplier(supplier.supplierId),
            supplierId: supplier.supplierId,
            avgLeadDays: supplier.avgLeadDays,
            onTimeDeliveryPct: supplier.onTimeDeliveryPct,
            lastDelayDays: supplier.lastDelayDays,
            minOrderQuantity: supplier.minOrderQuantity,
            skuCount: supplierSkus.length,
            urgentSkus: supplierSkus.filter((sku) => sku.currentStock <= sku.reorderPoint).length,
            rankingScore,
            totalSkusSupplied: supplierSkus.length,
            criticalSkusDependent,
            highRiskSkusDependent,
            totalRevenueAtRiskLinked,
            recommendedOrderValue,
            supplierRiskLevel: level,
            supplierRiskScore: scored.supplierRiskScore,
            delayPressure: scored.delayPressure,
            costEfficiencyScore: scored.costEfficiencyScore,
            serviceHealthLabel: serviceHealth(level),
            supplierInsight: insight(supplier, level, highRiskSkusDependent, criticalSkusDependent),
            recommendedUsage: recommendedUsage(level, supplier.lastDelayDays, criticalSkusDependent)
        };
    }).sort((a, b) => (b.supplierRiskScore ?? 0) - (a.supplierRiskScore ?? 0));
};
export const getSupplierDependencies = (supplierId) => {
    const supplier = getSupplierScorecards().find((item) => item.supplierId === supplierId || item.id === supplierId);
    if (!supplier)
        return undefined;
    const rawSkus = dataStore.getAllSkus().filter((sku) => sku.supplierIds.includes(supplierId));
    const risks = getRisks();
    const skus = rawSkus.map((sku) => {
        const risk = risks.find((item) => item.skuId === sku.skuId);
        const recommendedQuantity = risk ? Math.max(sku.safetyStock, Math.ceil((risk.salesVelocity * ((risk.leadTime ?? 5) + 7) - risk.totalAvailableStock + risk.committedStock) / 10) * 10) : undefined;
        return {
            skuId: sku.skuId,
            productName: sku.productName,
            category: sku.category,
            riskScore: risk?.riskScore ?? 0,
            riskLevel: risk?.riskLevel ?? "Low",
            revenueAtRisk: risk?.revenueAtRisk ?? 0,
            expectedStockoutDate: risk?.expectedStockoutDate,
            expectedStockoutLabel: risk?.expectedStockoutLabel,
            recommendedQuantity,
            recommendedSupplier: supplier.name
        };
    }).sort((a, b) => b.riskScore - a.riskScore);
    return {
        supplier,
        skus,
        totalDependencyRevenueAtRisk: skus.reduce((sum, sku) => sum + sku.revenueAtRisk, 0),
        criticalDependencyCount: skus.filter((sku) => sku.riskLevel === "Critical").length
    };
};
export const compareSuppliers = (ids) => {
    const suppliers = getSupplierScorecards().filter((supplier) => ids.includes(supplier.supplierId ?? supplier.id));
    const bestForUrgentReorder = [...suppliers].sort((a, b) => (a.avgLeadDays ?? a.averageLeadTime) - (b.avgLeadDays ?? b.averageLeadTime) ||
        b.reliabilityScore - a.reliabilityScore ||
        (a.supplierRiskScore ?? 100) - (b.supplierRiskScore ?? 100))[0];
    const lowestCostSupplier = [...suppliers].sort((a, b) => b.costEfficiencyScore - a.costEfficiencyScore)[0];
    const highestReliabilitySupplier = [...suppliers].sort((a, b) => b.reliabilityScore - a.reliabilityScore)[0];
    return { suppliers, bestForUrgentReorder, lowestCostSupplier, highestReliabilitySupplier };
};
export const supplierSummaryText = (supplier) => `${supplier.name}: ${supplier.supplierRiskLevel} risk, ${supplier.avgLeadDays ?? supplier.averageLeadTime} day lead time, ${supplier.onTimeDeliveryPct}% on-time, ${compactRupee(supplier.totalRevenueAtRiskLinked ?? 0)} revenue linked.`;
