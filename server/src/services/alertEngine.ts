import type { AlertItem, AlertSeverity, AlertStatus, AlertType, Channel } from "@supplypulse/shared";
import { daysBetween, DEMO_TODAY, nowIso } from "../utils/dates.js";
import { idFromTime } from "../utils/format.js";
import { dataStore } from "./dataStore.js";
import { getRecommendations } from "./recommendationEngine.js";
import { getRisks } from "./riskEngine.js";
import { getSupplierScorecards } from "./supplierEngine.js";

export interface AlertFilters {
  severity?: string;
  status?: string;
  type?: string;
  skuId?: string;
  supplierId?: string;
  limit?: number;
}

type AlertInput = Omit<AlertItem, "id" | "time" | "severity" | "sku"> & {
  id?: string;
  alertId?: string;
  severity: AlertSeverity;
  sku?: string;
  skuId?: string;
  time?: string;
};

const severityRank: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
  info: 1,
  warning: 3,
  critical: 4
};

const normalizeSeverity = (severity: AlertSeverity): AlertSeverity => {
  if (severity === "critical") return "Critical";
  if (severity === "warning") return "High";
  if (severity === "info") return "Low";
  return severity;
};

const alertKey = (alert: Pick<AlertItem, "type" | "skuId" | "supplierId" | "channel" | "source">) =>
  [alert.type, alert.skuId ?? "", alert.supplierId ?? "", alert.channel ?? "", alert.source ?? ""].join("|");

const formatTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} hr ago`;
};

const upsertAlert = (input: AlertInput) => {
  const now = nowIso();
  const skuId = input.skuId ?? input.sku ?? "";
  const severity = normalizeSeverity(input.severity);
  const existing = dataStore.getAlerts().find((alert) =>
    (alert.status ?? "Pending") === "Pending" &&
    alertKey(alert) === alertKey({ type: input.type, skuId, supplierId: input.supplierId, channel: input.channel, source: input.source })
  );
  if (existing) {
    existing.severity = severity;
    existing.title = input.title ?? existing.title;
    existing.message = input.message;
    existing.suggestedAction = input.suggestedAction;
    existing.revenueAtRisk = input.revenueAtRisk ?? existing.revenueAtRisk;
    existing.updatedAt = now;
    existing.time = formatTime(existing.createdAt ?? now);
    return existing;
  }
  const alertId = input.alertId ?? input.id ?? idFromTime("ALT");
  return dataStore.saveAlert({
    id: alertId,
    alertId,
    type: input.type,
    severity,
    status: input.status ?? "Pending",
    sku: skuId,
    skuId,
    productName: input.productName,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    channel: input.channel,
    title: input.title ?? input.message,
    message: input.message,
    suggestedAction: input.suggestedAction,
    revenueAtRisk: input.revenueAtRisk ?? 0,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    source: input.source ?? "risk-engine",
    relatedRecommendationId: input.relatedRecommendationId,
    time: input.time ?? "just now"
  });
};

export const createAlert = (input: AlertInput) => upsertAlert(input);

export const generateAlerts = () => {
  const before = dataStore.getAlerts().length;
  const risks = getRisks();
  const recommendations = getRecommendations({ limit: 40 });
  const suppliers = getSupplierScorecards();

  for (const sku of risks.slice(0, 60)) {
    const stockoutDays = sku.expectedStockoutDate ? daysBetween(DEMO_TODAY, sku.expectedStockoutDate) : 999;
    if (sku.riskScore >= 81 || stockoutDays <= 2) {
      upsertAlert({
        type: "STOCKOUT_RISK",
        severity: sku.riskLevel === "Critical" ? "Critical" : "High",
        skuId: sku.skuId,
        productName: sku.productName,
        supplierId: sku.supplierId,
        supplierName: sku.supplierName,
        title: `${sku.productName} may stock out ${sku.expectedStockoutLabel ?? "soon"}`,
        message: `${sku.productName} has risk score ${sku.riskScore} and ${sku.daysOfCover} days cover against ${sku.leadTime} day supplier lead time.`,
        suggestedAction: `Create reorder before ${sku.expectedStockoutDate}`,
        revenueAtRisk: sku.revenueAtRisk,
        source: "risk-engine"
      });
    }
    if (sku.revenueAtRisk >= 100000) {
      upsertAlert({
        type: "REVENUE_AT_RISK",
        severity: sku.revenueAtRisk >= 500000 ? "Critical" : "High",
        skuId: sku.skuId,
        productName: sku.productName,
        title: `Revenue exposure above ₹1L for ${sku.productName}`,
        message: `Estimated revenue at risk is ₹${Math.round(sku.revenueAtRisk / 1000)}K if reorder is delayed.`,
        suggestedAction: "Prioritize PO review and supplier confirmation.",
        revenueAtRisk: sku.revenueAtRisk,
        source: "risk-engine"
      });
    }
    if (sku.festivalProximity.includes("1.5") && ["High", "Critical"].includes(sku.riskLevel)) {
      upsertAlert({
        type: "FESTIVAL_SPIKE",
        severity: sku.riskLevel === "Critical" ? "Critical" : "High",
        skuId: sku.skuId,
        productName: sku.productName,
        title: `Sale-event demand spike on ${sku.productName}`,
        message: `${sku.festivalProximity} while SKU is ${sku.riskLevel}.`,
        suggestedAction: "Review forecast and increase reorder buffer.",
        revenueAtRisk: sku.revenueAtRisk,
        source: "forecast-engine"
      });
    }
    const channelEntries = Object.entries(sku.channelStock) as Array<[Channel, number]>;
    const totalStock = channelEntries.reduce((sum, [, value]) => sum + value, 0);
    const lowChannel = channelEntries.find(([, value]) => value <= Math.max(2, totalStock * 0.08));
    const concentrated = Object.entries(sku.channelDemandSplit).sort((a, b) => b[1] - a[1])[0] as [Channel, number] | undefined;
    if (lowChannel && totalStock > 20 || (concentrated && concentrated[1] >= 0.42)) {
      upsertAlert({
        type: "CHANNEL_MISMATCH",
        severity: "Medium",
        skuId: sku.skuId,
        productName: sku.productName,
        channel: lowChannel?.[0] ?? concentrated?.[0],
        title: `Channel stock imbalance on ${sku.productName}`,
        message: `${lowChannel?.[0] ?? concentrated?.[0]} needs reconciliation before marketplace demand drains available stock.`,
        suggestedAction: "Reconcile marketplace and ERP stock.",
        revenueAtRisk: sku.revenueAtRisk,
        source: "risk-engine"
      });
    }
  }

  for (const supplier of suppliers) {
    if ((supplier.lastDelayDays ?? 0) >= 2 || ["Risky", "Critical"].includes(supplier.supplierRiskLevel ?? "")) {
      upsertAlert({
        type: "SUPPLIER_DELAY",
        severity: supplier.supplierRiskLevel === "Critical" ? "Critical" : "High",
        supplierId: supplier.supplierId ?? supplier.id,
        supplierName: supplier.name,
        title: `${supplier.name} delay pressure`,
        message: `${supplier.name} has ${supplier.lastDelayDays ?? 0} recent delay days and ${supplier.criticalSkusDependent ?? 0} critical SKU dependencies.`,
        suggestedAction: supplier.recommendedUsage === "Avoid today" ? "Use alternate supplier for critical POs." : "Confirm dispatch capacity before issuing urgent PO.",
        revenueAtRisk: supplier.totalRevenueAtRiskLinked ?? 0,
        source: "supplier-engine"
      });
    }
  }

  for (const rec of recommendations) {
    if (rec.urgency === "Immediate" || rec.urgency === "Within 24 hours") {
      upsertAlert({
        type: "REORDER_DEADLINE",
        severity: rec.urgency === "Immediate" ? "Critical" : "High",
        skuId: rec.skuId,
        productName: rec.productName,
        supplierId: rec.recommendedSupplier?.supplierId,
        supplierName: rec.recommendedSupplier?.name,
        title: `${rec.reorderDeadlineLabel} deadline for ${rec.productName}`,
        message: rec.reasoning,
        suggestedAction: rec.recommendedAction ?? "Review reorder recommendation.",
        revenueAtRisk: rec.revenueAtRisk ?? rec.revenueSavedEstimate,
        source: "risk-engine",
        relatedRecommendationId: rec.recommendationId
      });
    }
  }

  return {
    generatedCount: dataStore.getAlerts().length - before,
    alerts: getAlerts()
  };
};

export const buildAlerts = (filters: AlertFilters = [] as unknown as AlertFilters): AlertItem[] => {
  generateAlerts();
  return getAlerts(filters);
};

export const getAlerts = (filters: AlertFilters = {}): AlertItem[] => {
  let alerts = dataStore.getAlerts().map((alert) => ({ ...alert, alertId: alert.alertId ?? alert.id, status: alert.status ?? "Pending", time: formatTime(alert.updatedAt ?? alert.createdAt ?? nowIso()) }));
  if (filters.severity) alerts = alerts.filter((alert) => String(alert.severity) === filters.severity);
  if (filters.status) alerts = alerts.filter((alert) => (alert.status ?? "Pending") === filters.status);
  if (filters.type) alerts = alerts.filter((alert) => alert.type === filters.type);
  if (filters.skuId) alerts = alerts.filter((alert) => alert.skuId === filters.skuId || alert.sku === filters.skuId);
  if (filters.supplierId) alerts = alerts.filter((alert) => alert.supplierId === filters.supplierId);
  alerts = alerts.sort((a, b) =>
    (severityRank[String(b.severity)] ?? 0) - (severityRank[String(a.severity)] ?? 0) ||
    new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
  );
  return filters.limit ? alerts.slice(0, filters.limit) : alerts;
};

export const updateAlertStatus = (alertId: string, status: AlertStatus) => {
  const now = nowIso();
  return dataStore.updateAlert(alertId, { status, updatedAt: now, time: "just now" });
};

export const createPipelineAlert = (runId: string, alertsGenerated: number) => upsertAlert({
  type: "PIPELINE_COMPLETED",
  severity: alertsGenerated > 0 ? "Medium" : "Low",
  title: "Pipeline refresh completed",
  message: `Pipeline ${runId} completed and generated or refreshed ${alertsGenerated} alert signals.`,
  suggestedAction: alertsGenerated > 0 ? "Review pending alert center." : "No immediate action required.",
  source: "pipeline"
});
