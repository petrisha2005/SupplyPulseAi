import type { Channel, InventorySku, RiskDriver, RiskExplanation, RiskFormulaBreakdown, RiskLevel, RiskSku, SaleEvent, SalesRecord, SeedSku } from "@supplypulse/shared";
import { addDays, daysBetween, DEMO_TODAY } from "../utils/dates.js";
import { round } from "../utils/format.js";
import { getCache, setCache } from "./cache.js";
import { dataStore } from "./dataStore.js";
import { toLegacySupplier } from "./supplierEngine.js";

const riskLabel = (score: number): RiskLevel => {
  if (score <= 30) return "Low";
  if (score <= 60) return "Medium";
  if (score <= 80) return "High";
  return "Critical";
};

const riskColor = (level: RiskLevel) => {
  if (level === "Critical") return "red";
  if (level === "High") return "orange";
  if (level === "Medium") return "amber";
  return "emerald";
};

const priority = (level: RiskLevel) => {
  if (level === "Critical") return "Reorder today" as const;
  if (level === "High") return "Reorder soon" as const;
  if (level === "Medium") return "Plan reorder" as const;
  return "Monitor" as const;
};

const recordsInWindow = (records: SalesRecord[], days: number) => {
  const start = addDays(DEMO_TODAY, -(days - 1));
  return records.filter((record) => record.date >= start && record.date <= DEMO_TODAY);
};

const sumUnits = (records: SalesRecord[]) => records.reduce((sum, record) => sum + Math.max(0, record.unitsSold - record.returns), 0);

const unitsForChannel = (records: SalesRecord[], channel: Channel) =>
  records.filter((record) => record.channel === channel).reduce((sum, record) => sum + Math.max(0, record.unitsSold - record.returns), 0);

const channelSplit = (records: SalesRecord[]): Record<Channel, number> => {
  const channels = dataStore.getChannels();
  const totals = Object.fromEntries(channels.map((channel) => [channel, 0])) as Record<Channel, number>;
  for (const record of records) totals[record.channel] += Math.max(0, record.unitsSold - record.returns);
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(channels.map((channel) => [channel, round(totals[channel] / total, 2)])) as Record<Channel, number>;
};

const upcomingEvent = (sku: SeedSku) => {
  return dataStore.getAllEvents()
    .filter((event) => event.startDate >= DEMO_TODAY && event.affectedCategories.includes(sku.category))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
};

const upcomingMultiplier = (sku: SeedSku) => {
  const eventMultiplier = upcomingEvent(sku)?.demandMultiplier ?? 1;
  const modifier = dataStore.getDemandModifier();
  const simulated = (!modifier.category || modifier.category === sku.category) ? modifier.multiplier : 1;
  return Math.max(eventMultiplier, simulated);
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const compactRupee = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${Math.round(value)}`;
};

const formatDateLabel = (dateString: string) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC"
}).format(new Date(`${dateString}T00:00:00.000Z`));

const stockoutLabel = (daysOfCover: number, date: string) => {
  if (daysOfCover < 1) return "Within 24 hours";
  if (daysOfCover < 2) return "Tomorrow";
  if (daysOfCover >= 31) return `Safe for ${Math.floor(daysOfCover)} days`;
  return formatDateLabel(date);
};

const impact = (score: number): RiskDriver["impact"] => {
  if (score >= 70) return "High";
  if (score >= 35) return "Medium";
  return "Low";
};

const calculateFormula = ({
  daysOfCover,
  leadTime,
  velocityTrend,
  event,
  demandMultiplier,
  supplierReliability,
  supplierDelayDays,
  committedStock,
  totalAvailableStock,
  channelConcentration
}: {
  daysOfCover: number;
  leadTime: number;
  velocityTrend: number;
  event?: SaleEvent;
  demandMultiplier: number;
  supplierReliability: number;
  supplierDelayDays: number;
  committedStock: number;
  totalAvailableStock: number;
  channelConcentration: number;
}): RiskFormulaBreakdown => {
  const leadGap = Math.max(0, leadTime - daysOfCover);
  const daysCoverRaw =
    daysOfCover <= 2 ? 100 :
    daysOfCover <= leadTime ? 82 :
    daysOfCover <= leadTime + 3 ? 52 :
    daysOfCover <= leadTime + 7 ? 24 :
    8;
  const velocityRaw = velocityTrend >= 1.5 ? 100 : velocityTrend >= 1.3 ? 82 : velocityTrend >= 1.15 ? 66 : velocityTrend >= 1.05 ? 42 : velocityTrend >= 0.95 ? 24 : 8;
  const daysUntilEvent = event ? daysBetween(DEMO_TODAY, event.startDate) : 999;
  const eventRaw = !event ? 5 : daysUntilEvent <= 7 ? 100 * Math.min(1, demandMultiplier / 2.1) : daysUntilEvent <= 21 ? 72 * Math.min(1, demandMultiplier / 1.8) : daysUntilEvent <= 45 ? 38 * Math.min(1, demandMultiplier / 1.5) : 12;
  const supplierRaw = clamp((leadTime / 10) * 40 + leadGap * 8 + Math.max(0, 90 - supplierReliability) * 1.2 + supplierDelayDays * 7);
  const committedRatio = committedStock / Math.max(1, totalAvailableStock);
  const committedRaw = committedRatio >= 0.45 ? 100 : committedRatio >= 0.3 ? 70 : committedRatio >= 0.18 ? 42 : 12;
  const channelRaw = channelConcentration >= 0.55 ? 100 : channelConcentration >= 0.42 ? 70 : channelConcentration >= 0.33 ? 42 : 16;
  return {
    daysCoverRisk: round(daysCoverRaw * 0.35, 1),
    velocityTrendRisk: round(velocityRaw * 0.2, 1),
    festivalRisk: round(eventRaw * 0.15, 1),
    supplierRisk: round(supplierRaw * 0.15, 1),
    committedStockRisk: round(committedRaw * 0.1, 1),
    channelConcentrationRisk: round(channelRaw * 0.05, 1)
  };
};

const totalFormulaScore = (breakdown: RiskFormulaBreakdown) => Math.round(
  breakdown.daysCoverRisk +
  breakdown.velocityTrendRisk +
  breakdown.festivalRisk +
  breakdown.supplierRisk +
  breakdown.committedStockRisk +
  breakdown.channelConcentrationRisk
);

const supplierRawRecord = (supplierId: string) => dataStore.getSupplierById(supplierId);

export type EnrichedRiskSku = RiskSku & {
  brand: string;
  sellingPrice: number;
  costPrice: number;
  currentStock: number;
  reorderPoint: number;
  safetyStock: number;
  status: SeedSku["status"];
  salesVelocity7d: number;
  salesVelocity28d: number;
  daysCover: number;
  expectedStockoutDate: string;
  supplierInfo: ReturnType<typeof toLegacySupplier>;
  riskColor: string;
  riskDrivers: string[];
  reasonBullets: string[];
  recommendationPriority: "Monitor" | "Plan reorder" | "Reorder soon" | "Reorder today";
  riskExplanation: RiskExplanation;
  stockoutUnits: number;
  revenueAtRiskFormatted: string;
  expectedStockoutLabel: string;
};

export type RiskListSku = Omit<EnrichedRiskSku, "salesHistory" | "riskExplanation" | "supplierInfo" | "reasonBullets"> & {
  channel: Channel;
  topChannels: Channel[];
  reasonSummary: string;
};

const publicMarketplaceChannels = new Set<Channel>(["Amazon", "Shopify", "Meesho", "Flipkart"]);

export const toRiskListSku = (sku: EnrichedRiskSku): RiskListSku => {
  const { salesHistory: _salesHistory, riskExplanation: _riskExplanation, supplierInfo: _supplierInfo, reasonBullets: _reasonBullets, ...rest } = sku;
  const topChannels = (Object.entries(sku.channelDemandSplit) as Array<[Channel, number]>)
    .filter(([channel, share]) => publicMarketplaceChannels.has(channel) && share > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([channel]) => channel);
  return {
    ...rest,
    channel: topChannels[0] ?? "Amazon",
    topChannels,
    reasonSummary: sku.riskReason
  };
};

export const toInventoryListSku = (sku: EnrichedRiskSku): RiskSku => ({
  skuId: sku.skuId,
  productName: sku.productName,
  category: sku.category,
  price: sku.price,
  channelStock: sku.channelStock,
  committedStock: sku.committedStock,
  totalAvailableStock: sku.totalAvailableStock,
  salesVelocity: sku.salesVelocity,
  velocityTrend: sku.velocityTrend,
  daysOfCover: sku.daysOfCover,
  supplierId: sku.supplierId,
  supplierName: sku.supplierName,
  leadTime: sku.leadTime,
  festivalProximity: sku.festivalProximity,
  channelDemandSplit: sku.channelDemandSplit,
  riskScore: sku.riskScore,
  riskLevel: sku.riskLevel,
  riskColor: sku.riskColor,
  riskDrivers: sku.riskDrivers,
  revenueAtRisk: sku.revenueAtRisk,
  revenueAtRiskFormatted: sku.revenueAtRiskFormatted,
  stockoutUnits: sku.stockoutUnits,
  expectedStockoutDate: sku.expectedStockoutDate,
  expectedStockoutLabel: sku.expectedStockoutLabel,
  recommendationPriority: sku.recommendationPriority,
  riskReason: sku.riskReason
});

export const enrichSku = (sku: SeedSku): EnrichedRiskSku => {
  const records = dataStore.getSalesHistory(sku.skuId);
  const recent7 = recordsInWindow(records, 7);
  const recent28 = recordsInWindow(records, 28);
  const velocity7 = round(sumUnits(recent7) / 7, 1);
  const velocity28 = round(sumUnits(recent28) / 28, 1);
  const supplierInfo = toLegacySupplier(sku.primarySupplierId);
  const supplierSeed = supplierRawRecord(sku.primarySupplierId);
  const totalAvailableStock = Object.values(sku.channelStock).reduce((sum, value) => sum + value, 0);
  const netAvailable = Math.max(0, totalAvailableStock - sku.committedStock);
  const demandMultiplier = upcomingMultiplier(sku);
  const event = upcomingEvent(sku);
  const adjustedVelocity = Math.max(1, velocity7 * demandMultiplier);
  const daysOfCover = round(netAvailable / adjustedVelocity, 1);
  const velocityTrend = round(velocity7 / Math.max(1, velocity28), 2);
  const demandRecords = recordsInWindow(records, 28);
  const split = channelSplit(demandRecords);
  const channelEntries = Object.entries(split).sort((a, b) => b[1] - a[1]);
  const channelHotspot = channelEntries[0][0] as Channel;
  const channelConcentration = channelEntries[0][1];
  const marketplaceChannels = dataStore.getChannels().filter((channel) => publicMarketplaceChannels.has(channel));
  const fastestGrowthChannel = marketplaceChannels
    .map((channel) => {
      const recentUnits = unitsForChannel(recent7, channel) / 7;
      const baselineUnits = unitsForChannel(recent28, channel) / 28;
      return { channel, growth: baselineUnits > 0 ? recentUnits / baselineUnits : 1 };
    })
    .sort((a, b) => b.growth - a.growth)[0]?.channel ?? channelHotspot;
  const lowestInventoryChannel = (Object.entries(sku.channelStock) as Array<[Channel, number]>)
    .filter(([channel, stock]) => publicMarketplaceChannels.has(channel) && stock > 0)
    .sort((a, b) => a[1] - b[1])[0]?.[0] ?? channelHotspot;
  const formulaBreakdown = calculateFormula({
    daysOfCover,
    leadTime: supplierInfo.averageLeadTime,
    velocityTrend,
    event,
    demandMultiplier,
    supplierReliability: supplierInfo.reliabilityScore,
    supplierDelayDays: supplierSeed?.lastDelayDays ?? 0,
    committedStock: sku.committedStock,
    totalAvailableStock,
    channelConcentration
  });
  const isExtreme = daysOfCover <= 1 && velocityTrend >= 1.35 && formulaBreakdown.supplierRisk >= 10;
  const riskScore = clamp(totalFormulaScore(formulaBreakdown), 0, isExtreme ? 100 : 97);
  const level = riskLabel(riskScore);
  const expectedDemandDuringLeadTime = adjustedVelocity * (supplierInfo.averageLeadTime + 3);
  const stockoutUnits = Math.max(0, Math.round(expectedDemandDuringLeadTime - totalAvailableStock));
  const revenueAtRisk = Math.round(stockoutUnits * sku.sellingPrice);
  const expectedStockoutDate = addDays(DEMO_TODAY, Math.max(1, Math.floor(daysOfCover)));
  const expectedStockoutLabel = stockoutLabel(daysOfCover, expectedStockoutDate);
  const eventName = event?.name ?? "next sale window";
  const velocityPercent = Math.round((velocityTrend - 1) * 100);
  const drivers: RiskDriver[] = [
    {
      label: "Low days of cover",
      impact: impact((formulaBreakdown.daysCoverRisk / 35) * 100),
      value: `${daysOfCover} days`,
      detail: daysOfCover < supplierInfo.averageLeadTime ? `Stock cover is below supplier lead time of ${supplierInfo.averageLeadTime} days.` : `Stock cover has ${round(daysOfCover - supplierInfo.averageLeadTime, 1)} days buffer after supplier lead time.`
    },
    {
      label: "Sales velocity trend",
      impact: impact((formulaBreakdown.velocityTrendRisk / 20) * 100),
      value: `${velocityTrend}x`,
      detail: `7-day velocity is ${velocityPercent >= 0 ? "+" : ""}${velocityPercent}% versus the 28-day baseline.`
    },
    {
      label: "Festival/sale demand",
      impact: impact((formulaBreakdown.festivalRisk / 15) * 100),
      value: `${demandMultiplier}x`,
      detail: event ? `${event.name} starts in ${daysBetween(DEMO_TODAY, event.startDate)} days and affects ${sku.category}.` : "No major category event is currently driving demand."
    },
    {
      label: "Supplier pressure",
      impact: impact((formulaBreakdown.supplierRisk / 15) * 100),
      value: `${supplierInfo.averageLeadTime} days`,
      detail: `${supplierInfo.name} reliability is ${supplierInfo.reliabilityScore}% with ${supplierSeed?.lastDelayDays ?? 0} recent delay days.`
    },
    {
      label: "Committed stock",
      impact: impact((formulaBreakdown.committedStockRisk / 10) * 100),
      value: `${sku.committedStock} units`,
      detail: `${Math.round((sku.committedStock / Math.max(1, totalAvailableStock)) * 100)}% of available stock is already committed.`
    },
    {
      label: "Channel concentration",
      impact: impact((formulaBreakdown.channelConcentrationRisk / 5) * 100),
      value: `${Math.round(channelConcentration * 100)}% ${channelHotspot}`,
      detail: `Highest sales: ${channelHotspot}. Fastest growth: ${fastestGrowthChannel}. Lowest inventory: ${lowestInventoryChannel}.`
    }
  ];
  const highDrivers = drivers.filter((driver) => driver.impact === "High").map((driver) => driver.label);
  const riskExplanation: RiskExplanation = {
    summary: `${level} risk because current stock covers only ${daysOfCover} days while supplier lead time is ${supplierInfo.averageLeadTime} days. Highest sales: ${channelHotspot}; fastest growth: ${fastestGrowthChannel}; lowest inventory: ${lowestInventoryChannel} ahead of ${eventName}.`,
    drivers,
    formulaBreakdown
  };
  const reasonBullets = drivers
    .filter((driver) => driver.impact !== "Low")
    .map((driver) => `${driver.label}: ${driver.detail}`);
  const inventorySku: InventorySku = {
    skuId: sku.skuId,
    productName: sku.productName,
    category: sku.category,
    price: sku.sellingPrice,
    channelStock: sku.channelStock,
    committedStock: sku.committedStock,
    totalAvailableStock,
    salesVelocity: velocity7,
    velocityTrend,
    daysOfCover,
    supplierId: sku.primarySupplierId,
    supplierName: supplierInfo.name,
    leadTime: supplierInfo.averageLeadTime,
    festivalProximity: event ? `${event.name} in ${daysBetween(DEMO_TODAY, event.startDate)} days · ${demandMultiplier}x` : `${demandMultiplier}x demand multiplier`,
    channelDemandSplit: split,
    salesHistory: recordsInWindow(records, 90).map((record) => ({ date: record.date, units: record.unitsSold, revenue: record.revenue }))
  };
  return {
    ...inventorySku,
    brand: sku.brand,
    sellingPrice: sku.sellingPrice,
    costPrice: sku.costPrice,
    currentStock: sku.currentStock,
    reorderPoint: sku.reorderPoint,
    safetyStock: sku.safetyStock,
    status: sku.status,
    salesVelocity7d: velocity7,
    salesVelocity28d: velocity28,
    daysCover: daysOfCover,
    supplierInfo,
    riskScore,
    riskLevel: level,
    riskColor: riskColor(level),
    riskDrivers: highDrivers.length ? highDrivers : drivers.slice(0, 2).map((driver) => driver.label),
    reasonBullets,
    recommendationPriority: priority(level),
    revenueAtRisk,
    revenueAtRiskFormatted: compactRupee(revenueAtRisk),
    stockoutUnits,
    expectedStockoutDate,
    expectedStockoutLabel,
    riskExplanation,
    riskReason: riskExplanation.summary
  };
};

export const getInventory = () => {
  const cached = getCache<EnrichedRiskSku[]>("risk:inventory");
  if (cached) return cached;
  return setCache("risk:inventory", dataStore.getAllSkus().map(enrichSku), 60_000);
};
export const getInventoryList = () => getInventory().map(toInventoryListSku);
export const getRisks = () => [...getInventory()].sort((a, b) => b.riskScore - a.riskScore);
export const getRiskList = () => getRisks().map(toRiskListSku);
export const getRiskBySku = (skuId: string) => getInventory().find((sku) => sku.skuId === skuId);
export const getRiskExplanationBySku = (skuId: string) => getRiskBySku(skuId);
