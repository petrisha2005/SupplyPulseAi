import { Router } from "express";
import { createAlert } from "../services/alertEngine.js";
import { clearCache } from "../services/cache.js";
import { dataStore } from "../services/dataStore.js";
import { getRisks } from "../services/riskEngine.js";
export const simulateRouter = Router();
simulateRouter.post("/flash-sale", (req, res) => {
    clearCache();
    const category = typeof req.body?.category === "string" ? req.body.category : "Ethnic Wear";
    const channel = typeof req.body?.channel === "string" ? req.body.channel : "Amazon";
    dataStore.setFlashSale({ multiplier: Number(req.body?.multiplier ?? 1.6), category, channel });
    const affected = getRisks().filter((sku) => sku.category === category).slice(0, 5);
    for (const sku of affected) {
        createAlert({
            severity: sku.riskLevel === "Critical" ? "critical" : "warning",
            sku: sku.skuId,
            message: `Flash sale demand spike on ${channel}`,
            suggestedAction: `Review ${sku.productName} reorder quantity`
        });
    }
    res.json({ enabled: true, category, channel, affectedSkus: affected.length, dashboard: { topRiskSkus: getRisks().slice(0, 8) } });
});
simulateRouter.post("/supplier-delay", (req, res) => {
    clearCache();
    const supplierId = String(req.body?.supplierId ?? "SUP-SUR");
    const delayDays = Number(req.body?.delayDays ?? 3);
    const supplier = dataStore.updateSupplierDelay(supplierId, delayDays);
    const affected = getRisks().filter((sku) => sku.supplierId === supplierId).slice(0, 8);
    for (const sku of affected) {
        createAlert({
            severity: "warning",
            sku: sku.skuId,
            message: `${supplier?.name ?? supplierId} delay simulated`,
            suggestedAction: `Recalculate PO deadline for ${sku.productName}`
        });
    }
    res.json({ enabled: true, supplier, affectedSkus: affected.length, topRiskSkus: getRisks().slice(0, 8) });
});
simulateRouter.post("/stockout", (req, res) => {
    clearCache();
    const skuId = String(req.body?.skuId ?? getRisks()[0]?.skuId ?? "");
    const channel = String(req.body?.channel ?? "Amazon");
    const sku = dataStore.updateSkuStock(skuId, { channel, delta: -99999 });
    if (sku) {
        createAlert({
            severity: "critical",
            sku: sku.skuId,
            message: `Stockout simulated on ${channel}`,
            suggestedAction: `Create urgent PO for ${sku.productName}`
        });
    }
    res.json({ enabled: true, sku, risk: sku ? getRisks().find((item) => item.skuId === sku.skuId) : undefined });
});
simulateRouter.post("/channel-mismatch", (_req, res) => {
    clearCache();
    const target = getRisks()[0];
    if (target) {
        dataStore.updateSkuStock(target.skuId, { channel: "ERP", delta: -Math.ceil(target.totalAvailableStock * 0.2) });
        createAlert({
            severity: "warning",
            sku: target.skuId,
            message: "Channel stock mismatch simulated",
            suggestedAction: "Reconcile ERP stock against marketplace availability"
        });
    }
    res.json({ enabled: true, affectedSku: target?.skuId });
});
simulateRouter.post("/benchmark", (_req, res) => {
    res.json({ mode: "GPU", durationSeconds: 4.2, cpuDurationSeconds: 47.3 });
});
simulateRouter.post("/reset", (_req, res) => {
    clearCache();
    dataStore.reset();
    res.json({ ok: true, totalSkus: dataStore.getAllSkus().length });
});
