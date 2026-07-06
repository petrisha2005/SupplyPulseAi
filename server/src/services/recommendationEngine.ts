import type { AlertSeverity, Channel, Recommendation, RecommendationSupplier, RiskLevel, SeedSupplier } from "@supplypulse/shared";
import { addDays, DEMO_TODAY, nowIso } from "../utils/dates.js";
import { round } from "../utils/format.js";
import { dataStore } from "./dataStore.js";
import { getForecastForSku } from "./forecastEngine.js";
import { getRisks, getRiskBySku, type EnrichedRiskSku } from "./riskEngine.js";

export interface RecommendationFilters {
  riskLevel?: string;
  category?: string;
  supplierId?: string;
  urgency?: string;
  limit?: number;
}

interface GeneratePoOptions {
  skuId: string;
  supplierId?: string;
  quantity?: number;
}

const urgencyRank: Record<string, number> = {
  Immediate: 4,
  "Within 24 hours": 3,
  "This week": 2,
  Monitor: 1
};

const deadlineLabel = (urgency: Recommendation["urgency"]) => {
  if (urgency === "Immediate") return "Today before 6 PM";
  if (urgency === "Within 24 hours") return "Within 24 hours";
  if (urgency === "This week") return "Before supplier call tomorrow";
  return "Monitor only";
};

const alertSeverity = (urgency: Recommendation["urgency"], riskLevel: RiskLevel): AlertSeverity => {
  if (urgency === "Immediate" || riskLevel === "Critical") return "critical";
  if (urgency === "Within 24 hours" || riskLevel === "High") return "warning";
  return "info";
};

const urgencyFromSku = (sku: EnrichedRiskSku): Recommendation["urgency"] => {
  if (sku.daysOfCover <= 2 || sku.riskLevel === "Critical") return "Immediate";
  if (sku.daysOfCover <= sku.leadTime) return "Within 24 hours";
  if (sku.riskLevel === "High") return "This week";
  return "Monitor";
};

const legacyUrgencyLevel = (urgency: Recommendation["urgency"], riskLevel: RiskLevel): RiskLevel => {
  if (urgency === "Immediate") return "Critical";
  if (urgency === "Within 24 hours") return "High";
  if (urgency === "This week") return "High";
  return riskLevel;
};

const supplierUnitCost = (sku: EnrichedRiskSku, supplier: SeedSupplier) => {
  const costFactor = supplier.costRating <= 2 ? 0.95 : supplier.costRating >= 5 ? 1.1 : 1 + (supplier.costRating - 3) * 0.04;
  return Math.max(1, Math.round(sku.costPrice * costFactor));
};

const supplierScore = (sku: EnrichedRiskSku, supplier: SeedSupplier, urgency: Recommendation["urgency"]) => {
  const speedWeight = urgency === "Immediate" ? 4.8 : urgency === "Within 24 hours" ? 3.4 : 2.2;
  const reliabilityWeight = urgency === "Immediate" ? 0.95 : 0.8;
  const costPenalty = urgency === "Immediate" ? supplier.costRating * 1.4 : supplier.costRating * 3.2;
  const delayPenalty = supplier.lastDelayDays * (urgency === "Immediate" ? 10 : 7);
  const primaryBonus = sku.supplierId === supplier.supplierId ? 5 : 0;
  return supplier.reliabilityScore * reliabilityWeight + supplier.onTimeDeliveryPct * 0.45 - supplier.avgLeadDays * speedWeight - costPenalty - delayPenalty + primaryBonus;
};

const supplierReason = (supplier: SeedSupplier, urgency: Recommendation["urgency"], rank: number) => {
  if (urgency === "Immediate") return `${rank === 0 ? "Chosen" : "Backup"} for fastest reliable dispatch: ${supplier.avgLeadDays} day lead time, ${supplier.onTimeDeliveryPct}% on-time delivery.`;
  return `${rank === 0 ? "Chosen" : "Backup"} for balanced reliability, lead time, and cost rating ${supplier.costRating}/5.`;
};

const rankSuppliers = (sku: EnrichedRiskSku, urgency: Recommendation["urgency"]): RecommendationSupplier[] => {
  const candidates = dataStore.getAllSuppliers()
    .filter((supplier) => sku.supplierInfo.productsSupplied.includes(sku.category) || supplier.productsSupplied.includes(sku.category) || sku.supplierId === supplier.supplierId)
    .sort((a, b) => supplierScore(sku, b, urgency) - supplierScore(sku, a, urgency));
  const fallback = dataStore.getSupplierById(sku.supplierId);
  const finalCandidates = candidates.length ? candidates : fallback ? [fallback] : [];
  return finalCandidates.map((supplier, index) => ({
    supplierId: supplier.supplierId,
    name: supplier.name,
    city: supplier.city,
    avgLeadDays: supplier.avgLeadDays,
    reliabilityScore: supplier.reliabilityScore,
    onTimeDeliveryPct: supplier.onTimeDeliveryPct,
    unitCost: supplierUnitCost(sku, supplier),
    minOrderQuantity: supplier.minOrderQuantity,
    reason: supplierReason(supplier, urgency, index)
  }));
};

const roundToMinOrder = (quantity: number, minOrder: number) => Math.ceil(quantity / Math.max(1, minOrder)) * Math.max(1, minOrder);

const capQuantity = (quantity: number, avgDailyForecast: number) => {
  const sensibleCap = Math.max(250, Math.ceil(avgDailyForecast * 60));
  return Math.min(quantity, sensibleCap);
};

const calculateQuantity = (sku: EnrichedRiskSku, supplier: RecommendationSupplier, urgency: Recommendation["urgency"], forecast: ReturnType<typeof getForecastForSku>) => {
  const avgDailyForecast = forecast?.avgDailyForecast ?? sku.salesVelocity7d;
  const eventMultiplier = forecast?.festivalImpact?.multiplier ?? 1;
  const eventDaysAway = forecast?.festivalImpact?.daysAway ?? 999;
  const baseDemandDuringLeadTime = avgDailyForecast * supplier.avgLeadDays;
  const safetyBufferDemand = avgDailyForecast * 7;
  const eventBuffer = eventMultiplier > 1 && eventDaysAway <= 21 ? avgDailyForecast * eventMultiplier * 3 : 0;
  const currentAvailableStock = Math.max(0, sku.totalAvailableStock - sku.committedStock);
  let quantity = Math.ceil(baseDemandDuringLeadTime + safetyBufferDemand + eventBuffer + sku.committedStock - currentAvailableStock);
  if (quantity <= 0 && ["Immediate", "Within 24 hours", "This week"].includes(urgency ?? "")) quantity = Math.max(sku.safetyStock, supplier.minOrderQuantity ?? 1);
  quantity = capQuantity(Math.max(0, quantity), avgDailyForecast);
  return {
    quantity: roundToMinOrder(quantity, supplier.minOrderQuantity ?? 1),
    avgDailyForecast,
    eventMultiplier,
    eventName: forecast?.festivalImpact?.eventName,
    eventDaysAway
  };
};

const deadlineDate = (urgency: Recommendation["urgency"]) => {
  if (urgency === "Immediate") return DEMO_TODAY;
  if (urgency === "Within 24 hours") return addDays(DEMO_TODAY, 1);
  if (urgency === "This week") return addDays(DEMO_TODAY, 3);
  return addDays(DEMO_TODAY, 7);
};

const formatRupee = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${Math.round(value)}`;
};

const publicMarketplaceChannels = new Set<Channel>(["Amazon", "Shopify", "Meesho", "Flipkart"]);

const channelSignal = (sku: EnrichedRiskSku) => {
  const highestSales = Object.entries(sku.channelDemandSplit).filter(([channel]) => publicMarketplaceChannels.has(channel as Channel)).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Amazon";
  const lowestInventory = Object.entries(sku.channelStock).filter(([channel, stock]) => publicMarketplaceChannels.has(channel as Channel) && Number(stock) > 0).sort((a, b) => Number(a[1]) - Number(b[1]))[0]?.[0] ?? highestSales;
  return { highestSales, lowestInventory };
};

const buildRecommendation = (sku: EnrichedRiskSku): Recommendation => {
  const urgency = urgencyFromSku(sku);
  const forecast = getForecastForSku(sku.skuId);
  const channels = channelSignal(sku);
  const suppliers = rankSuppliers(sku, urgency);
  const recommendedSupplier = suppliers[0] ?? {
    supplierId: sku.supplierId,
    name: sku.supplierName,
    city: "Unknown",
    avgLeadDays: sku.leadTime,
    reliabilityScore: sku.supplierInfo.reliabilityScore,
    onTimeDeliveryPct: sku.supplierInfo.reliabilityScore,
    unitCost: sku.costPrice,
    minOrderQuantity: 1,
    reason: "Using current primary supplier because no ranked alternate is available."
  };
  const alternateSupplier = suppliers[1] ?? recommendedSupplier;
  const rawRecommendedSupplier = dataStore.getSupplierById(recommendedSupplier.supplierId);
  const quantityModel = calculateQuantity(sku, recommendedSupplier, urgency, forecast);
  const recommendedQuantity = quantityModel.quantity;
  const estimatedPOValue = recommendedQuantity * recommendedSupplier.unitCost;
  const revenueProtected = Math.max(sku.revenueAtRisk, Math.round(quantityModel.avgDailyForecast * Math.max(1, recommendedSupplier.avgLeadDays) * sku.price));
  const eventPhrase = quantityModel.eventName
    ? `${quantityModel.eventName} is expected to lift demand by ${quantityModel.eventMultiplier}x`
    : "no near-term event multiplier is active";
  const supplierDelayWarning = rawRecommendedSupplier && (rawRecommendedSupplier.lastDelayDays >= 2 || rawRecommendedSupplier.reliabilityScore < 85)
    ? ` ${recommendedSupplier.name} has recent delay risk; consider ${alternateSupplier.name} if dispatch cannot be confirmed today.`
    : "";
  const avoidPhrase = supplierDelayWarning || (alternateSupplier.supplierId !== recommendedSupplier.supplierId && alternateSupplier.avgLeadDays > recommendedSupplier.avgLeadDays
    ? ` ${alternateSupplier.name} is kept as backup because its lead time is ${alternateSupplier.avgLeadDays} days.`
    : "");
  const reorderDeadlineLabel = deadlineLabel(urgency);
  const requestedDispatchDeadline = reorderDeadlineLabel === "Monitor only" ? "No urgent dispatch required" : reorderDeadlineLabel;
  const recommendedAction = `Reorder ${recommendedQuantity} units of ${sku.productName} from ${recommendedSupplier.name} ${reorderDeadlineLabel.toLowerCase()}.`;
  const reasoning = `${recommendedAction} Current cover is ${sku.daysOfCover} days while supplier lead time is ${recommendedSupplier.avgLeadDays} days, ${eventPhrase}, highest sales are on ${channels.highestSales}, and lowest inventory is on ${channels.lowestInventory}. This purchase protects an estimated ${formatRupee(revenueProtected)} revenue.${avoidPhrase}`;
  const reasonBullets = [
    `Risk score ${sku.riskScore} (${sku.riskLevel}) with ${sku.daysOfCover} days cover.`,
    `Marketplace signal: highest sales on ${channels.highestSales}; lowest inventory on ${channels.lowestInventory}.`,
    `Forecast avg demand is ${quantityModel.avgDailyForecast} units/day; supplier lead time is ${recommendedSupplier.avgLeadDays} days.`,
    `Quantity includes lead-time demand, 7-day safety buffer, committed stock, and ${quantityModel.eventName ? "event buffer" : "standard buffer"}.`,
    `${recommendedSupplier.name}: ${recommendedSupplier.reliabilityScore}% reliability, ${recommendedSupplier.onTimeDeliveryPct}% on-time delivery, ${recommendedSupplier.avgLeadDays} day lead time.`
  ];
  if (supplierDelayWarning) reasonBullets.push("Supplier has recent delay risk. Consider alternate supplier if dispatch is not confirmed today.");
  const purchaseOrderDraft = {
    title: `PO draft: ${sku.productName}`,
    supplierName: recommendedSupplier.name,
    supplierCity: recommendedSupplier.city,
    skuId: sku.skuId,
    productName: sku.productName,
    quantity: recommendedQuantity,
    unitCost: recommendedSupplier.unitCost,
    estimatedTotalValue: estimatedPOValue,
    requestedDispatchDeadline,
    deliveryUrgency: urgency ?? "Monitor",
    note: reasoning
  };
  const whatsappMessage = `Hi ${recommendedSupplier.name}, please confirm urgent dispatch for ${recommendedQuantity} units of ${sku.productName} (${sku.skuId}). ${quantityModel.eventName ? `Required before ${quantityModel.eventName}. ` : ""}Current stock cover is only ${sku.daysOfCover} days. Please share availability and earliest dispatch time.`;
  return {
    recommendationId: `REC-${sku.skuId}`,
    skuId: sku.skuId,
    productName: sku.productName,
    category: sku.category,
    riskScore: sku.riskScore,
    riskLevel: sku.riskLevel,
    urgencyLevel: legacyUrgencyLevel(urgency, sku.riskLevel),
    urgency,
    recommendedAction,
    recommendedQuantity,
    recommendedSupplier,
    alternateSupplier,
    bestSupplier: recommendedSupplier.name,
    reorderDeadline: deadlineDate(urgency),
    reorderDeadlineLabel,
    expectedStockoutDate: sku.expectedStockoutDate,
    revenueAtRisk: sku.revenueAtRisk,
    revenueProtected,
    revenueSavedEstimate: revenueProtected,
    estimatedPOValue,
    unitCost: recommendedSupplier.unitCost,
    reasoning,
    reasonBullets,
    purchaseOrderDraft,
    purchaseOrderMessage: `Create PO for ${recommendedQuantity} units of ${sku.productName} (${sku.skuId}) from ${recommendedSupplier.name}. ${requestedDispatchDeadline}.`,
    whatsappMessage,
    confidenceScore: Math.min(96, Math.max(55, Math.round((sku.riskScore + (forecast?.confidenceScore ?? 70)) / 2))),
    alertSeverity: alertSeverity(urgency, sku.riskLevel),
    createdAt: nowIso()
  };
};

const recommendationSort = (a: Recommendation, b: Recommendation) =>
  (urgencyRank[b.urgency ?? "Monitor"] - urgencyRank[a.urgency ?? "Monitor"]) ||
  ((b.riskScore ?? 0) - (a.riskScore ?? 0)) ||
  ((b.revenueAtRisk ?? 0) - (a.revenueAtRisk ?? 0));

export const getRecommendations = (filters: RecommendationFilters = {}): Recommendation[] => {
  const candidateLimit = filters.limit ? Math.max(filters.limit * 2, filters.limit) : 30;
  let candidates = getRisks()
    .filter((sku) => ["Medium", "High", "Critical"].includes(sku.riskLevel));
  if (filters.riskLevel) candidates = candidates.filter((sku) => sku.riskLevel === filters.riskLevel);
  if (filters.category) candidates = candidates.filter((sku) => sku.category === filters.category);
  candidates = candidates
    .sort((a, b) => b.riskScore - a.riskScore || b.revenueAtRisk - a.revenueAtRisk)
    .slice(0, filters.supplierId || filters.urgency ? Math.max(candidateLimit, 60) : candidateLimit);
  let recommendations = candidates
    .map((sku) => buildRecommendation(sku))
    .sort(recommendationSort);
  if (filters.supplierId) recommendations = recommendations.filter((item) => item.recommendedSupplier?.supplierId === filters.supplierId);
  if (filters.urgency) recommendations = recommendations.filter((item) => item.urgency === filters.urgency);
  if (filters.limit) recommendations = recommendations.slice(0, filters.limit);
  return recommendations;
};

export const getRecommendationBySku = (skuId: string): Recommendation | undefined => {
  const sku = getRiskBySku(skuId);
  if (!sku) return undefined;
  return buildRecommendation(sku);
};

export const generatePo = (options: GeneratePoOptions) => {
  const base = getRecommendationBySku(options.skuId) ?? getRecommendations({ limit: 1 })[0];
  if (!base) return undefined;
  const sku = getRiskBySku(base.skuId);
  const overrideSupplier = options.supplierId ? rankSuppliers(sku!, base.urgency).find((supplier) => supplier.supplierId === options.supplierId) : undefined;
  const supplier = overrideSupplier ?? base.recommendedSupplier!;
  const quantity = options.quantity && options.quantity > 0 ? options.quantity : base.recommendedQuantity;
  const estimatedPOValue = quantity * supplier.unitCost;
  const purchaseOrderDraft = {
    ...base.purchaseOrderDraft!,
    supplierName: supplier.name,
    supplierCity: supplier.city,
    quantity,
    unitCost: supplier.unitCost,
    estimatedTotalValue: estimatedPOValue
  };
  const whatsappMessage = `Hi ${supplier.name}, please confirm urgent dispatch for ${quantity} units of ${base.productName} (${base.skuId}). Current stock cover is only ${sku?.daysOfCover ?? "low"} days. Please share availability and earliest dispatch time.`;
  const copyReadyText = [
    purchaseOrderDraft.title,
    `Supplier: ${purchaseOrderDraft.supplierName}, ${purchaseOrderDraft.supplierCity}`,
    `SKU: ${purchaseOrderDraft.skuId}`,
    `Product: ${purchaseOrderDraft.productName}`,
    `Quantity: ${purchaseOrderDraft.quantity}`,
    `Unit cost: ${formatRupee(purchaseOrderDraft.unitCost)}`,
    `Estimated total: ${formatRupee(purchaseOrderDraft.estimatedTotalValue)}`,
    `Dispatch deadline: ${purchaseOrderDraft.requestedDispatchDeadline}`,
    `Reason: ${purchaseOrderDraft.note}`
  ].join("\n");
  return {
    poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "draft" as const,
    generatedAt: nowIso(),
    purchaseOrderDraft,
    whatsappMessage,
    estimatedPOValue,
    supplier,
    copyReadyText,
    sku,
    recommendation: { ...base, purchaseOrderDraft, whatsappMessage, estimatedPOValue }
  };
};
