import type { Channel, ForecastCompareResponse, ForecastResponse, ForecastSummaryResponse, SaleEvent, SalesPoint, SalesRecord, SeedSku } from "@supplypulse/shared";
import { addDays, daysBetween, DEMO_TODAY, nowIso } from "../utils/dates.js";
import { round } from "../utils/format.js";
import { getCache, setCache } from "./cache.js";
import { dataStore } from "./dataStore.js";
import { getRiskBySku } from "./riskEngine.js";
import { toLegacySupplier } from "./supplierEngine.js";

const publicMarketplaceChannels = new Set<Channel>(["Amazon", "Shopify", "Meesho", "Flipkart"]);
const channels = (): Channel[] => dataStore.getChannels().filter((channel) => publicMarketplaceChannels.has(channel));

const netUnits = (record: SalesRecord) => Math.max(0, record.unitsSold - record.returns);

const recordsInWindow = (records: SalesRecord[], days: number) => {
  const start = addDays(DEMO_TODAY, -(days - 1));
  return records.filter((record) => record.date >= start && record.date <= DEMO_TODAY);
};

const sumUnits = (records: SalesRecord[]) => records.reduce((sum, record) => sum + netUnits(record), 0);

const averageUnits = (records: SalesRecord[], days: number) => round(sumUnits(records) / Math.max(1, days), 2);

const dateKey = (date: string) => new Date(`${date}T00:00:00.000Z`).getUTCDay();

const groupDailySales = (records: SalesRecord[]): SalesPoint[] => {
  const byDate = new Map<string, { units: number; revenue: number }>();
  for (const record of records) {
    const current = byDate.get(record.date) ?? { units: 0, revenue: 0 };
    current.units += netUnits(record);
    current.revenue += record.revenue;
    byDate.set(record.date, current);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, units: Math.round(value.units), revenue: Math.round(value.revenue) }));
};

const standardDeviation = (values: number[]) => {
  if (!values.length) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const upcomingEventForSku = (sku: SeedSku): SaleEvent | undefined => {
  const modifier = dataStore.getDemandModifier();
  const simulated = modifier.multiplier > 1 && (!modifier.category || modifier.category === sku.category)
    ? {
        eventId: "SIM-FLASH",
        name: "Simulated flash sale",
        startDate: DEMO_TODAY,
        endDate: addDays(DEMO_TODAY, 3),
        affectedCategories: [sku.category],
        affectedChannels: modifier.channel ? [modifier.channel] : channels(),
        demandMultiplier: modifier.multiplier,
        priority: "high" as const
      }
    : undefined;
  const seeded = dataStore.getAllEvents()
    .filter((event) => event.startDate >= DEMO_TODAY && event.startDate <= addDays(DEMO_TODAY, 30) && event.affectedCategories.includes(sku.category))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (simulated && (!seeded || simulated.demandMultiplier >= seeded.demandMultiplier)) return simulated;
  return seeded;
};

const eventMultiplierForDay = (event: SaleEvent | undefined, forecastDate: string) => {
  if (!event) return 1;
  const daysUntilStart = daysBetween(DEMO_TODAY, event.startDate);
  const daysFromStart = daysBetween(event.startDate, forecastDate);
  if (daysFromStart >= 0 && forecastDate <= event.endDate) return event.demandMultiplier;
  if (daysFromStart < 0) {
    const proximity = Math.max(0, 1 - Math.abs(daysFromStart) / 30);
    return round(1 + (event.demandMultiplier - 1) * proximity * (daysUntilStart <= 7 ? 0.75 : 0.55), 2);
  }
  const coolOff = Math.max(0, 1 - daysFromStart / 10);
  return round(1 + (event.demandMultiplier - 1) * coolOff * 0.35, 2);
};

const cap = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const trendDirection = (trendRatio: number): ForecastResponse["trendDirection"] => {
  if (trendRatio >= 1.08) return "Rising";
  if (trendRatio <= 0.92) return "Falling";
  return "Stable";
};

const confidenceLabel = (score: number): "High" | "Medium" | "Low" => {
  if (score >= 78) return "High";
  if (score >= 60) return "Medium";
  return "Low";
};

const confidenceReasons = ({
  score,
  completeness,
  volatilityRatio,
  trendRatio,
  event
}: {
  score: number;
  completeness: number;
  volatilityRatio: number;
  trendRatio: number;
  event?: SaleEvent;
}) => {
  const reasons = [
    `${Math.round(completeness * 100)}% of the 90-day sales history is available.`,
    volatilityRatio > 0.45 ? "Recent demand is volatile, so the forecast range is wider." : "Recent daily demand is stable enough for a reliable baseline.",
    Math.abs(trendRatio - 1) > 0.25 ? "The 7-day trend is moving quickly versus the 28-day baseline." : "Trend movement is within a controlled range."
  ];
  if (event) reasons.push(`${event.name} adds event uncertainty for affected channels.`);
  reasons.push(`Overall confidence is ${confidenceLabel(score).toLowerCase()} at ${score}%.`);
  return reasons;
};

const calculateConfidence = ({
  historyDays,
  last28DailyUnits,
  trendRatio,
  event
}: {
  historyDays: number;
  last28DailyUnits: number[];
  trendRatio: number;
  event?: SaleEvent;
}) => {
  const completeness = cap(historyDays / 90, 0, 1);
  const mean = last28DailyUnits.reduce((sum, value) => sum + value, 0) / Math.max(1, last28DailyUnits.length);
  const volatilityRatio = mean > 0 ? standardDeviation(last28DailyUnits) / mean : 1;
  const trendInstability = Math.min(1, Math.abs(trendRatio - 1));
  const eventPenalty = event ? (event.demandMultiplier >= 1.8 ? 10 : 6) : 0;
  const score = Math.round(cap(55 + completeness * 35 - volatilityRatio * 22 - trendInstability * 12 - eventPenalty, 35, 95));
  return {
    confidenceScore: score,
    confidenceLabel: confidenceLabel(score),
    confidenceReasons: confidenceReasons({ score, completeness, volatilityRatio, trendRatio, event })
  };
};

const channelDemandSplit = (records: SalesRecord[], baselineRecords: SalesRecord[]) => {
  const recentByChannel = Object.fromEntries(channels().map((channel) => [channel, 0])) as Record<Channel, number>;
  const baselineByChannel = Object.fromEntries(channels().map((channel) => [channel, 0])) as Record<Channel, number>;
  for (const record of records) recentByChannel[record.channel] += netUnits(record);
  for (const record of baselineRecords) baselineByChannel[record.channel] += netUnits(record);
  const totalRecent = Object.values(recentByChannel).reduce((sum, value) => sum + value, 0) || 1;
  return channels().map((channel) => {
    const recentAvg = recentByChannel[channel] / 7;
    const baselineAvg = baselineByChannel[channel] / 28;
    const trendPct = baselineAvg > 0 ? Math.round(((recentAvg - baselineAvg) / baselineAvg) * 100) : 0;
    return {
      channel,
      sharePct: Math.round((recentByChannel[channel] / totalRecent) * 100),
      avgUnitsPerDay: round(recentAvg, 1),
      trendPct
    };
  }).sort((a, b) => b.sharePct - a.sharePct);
};

const sameWeekdayAverage = (dailyHistory: SalesPoint[], targetDate: string, fallback: number) => {
  const weekday = dateKey(targetDate);
  const matches = dailyHistory.filter((point) => point.date < targetDate && dateKey(point.date) === weekday).slice(-8);
  if (!matches.length) return fallback;
  return round(matches.reduce((sum, point) => sum + point.units, 0) / matches.length, 2);
};

export const getForecastForSku = (skuId: string): ForecastResponse | undefined => {
  const cached = getCache<ForecastResponse>(`forecast:${skuId}`);
  if (cached) return cached;
  const sku = dataStore.getSkuById(skuId);
  if (!sku) return undefined;
  const riskSku = getRiskBySku(skuId);
  const supplier = toLegacySupplier(sku.primarySupplierId);
  const records = dataStore.getSalesHistory(skuId).sort((a, b) => a.date.localeCompare(b.date));
  const last90 = recordsInWindow(records, 90);
  const last28 = recordsInWindow(records, 28);
  const last7 = recordsInWindow(records, 7);
  const dailyHistory = groupDailySales(last90);
  const recent7dAvg = averageUnits(last7, 7);
  const baseline28dAvg = averageUnits(last28, 28);
  const trendRatio = recent7dAvg / Math.max(1, baseline28dAvg);
  const direction = trendDirection(trendRatio);
  const trendAdjustment = round(cap(1 + (trendRatio - 1) * 0.45, 0.82, 1.22), 2);
  const event = upcomingEventForSku(sku);
  const confidence = calculateConfidence({
    historyDays: dailyHistory.length,
    last28DailyUnits: groupDailySales(last28).map((point) => point.units),
    trendRatio,
    event
  });
  const productPrice = sku.sellingPrice;
  const forecastNext30Days = Array.from({ length: 30 }, (_, index) => {
    const date = addDays(DEMO_TODAY, index + 1);
    const sameWeekdayAvg = sameWeekdayAverage(dailyHistory, date, baseline28dAvg || recent7dAvg || 1);
    const baseDemand = recent7dAvg * 0.5 + baseline28dAvg * 0.3 + sameWeekdayAvg * 0.2;
    const eventMultiplier = eventMultiplierForDay(event, date);
    const safeSpikeCap = eventMultiplier >= 1.75 ? 3.2 : 2.15;
    const units = Math.max(0, Math.round(cap(baseDemand * trendAdjustment * eventMultiplier, 0, Math.max(1, baseline28dAvg) * safeSpikeCap)));
    return { date, units, revenue: units * productPrice };
  });
  const forecastNext7Days = forecastNext30Days.slice(0, 7);
  const totalForecastDemand7d = forecastNext7Days.reduce((sum, point) => sum + point.units, 0);
  const totalForecastDemand30d = forecastNext30Days.reduce((sum, point) => sum + point.units, 0);
  const avgDailyForecast = round(totalForecastDemand30d / 30, 1);
  const firstDate = addDays(DEMO_TODAY, 1);
  const firstSameWeekdayAvg = sameWeekdayAverage(dailyHistory, firstDate, baseline28dAvg || recent7dAvg || 1);
  const eventMultiplier = eventMultiplierForDay(event, firstDate);
  const topChannel = channelDemandSplit(last7, last28)[0];
  const historicalDailySales = dailyHistory;
  const currentStock = Math.max(0, sku.currentStock - sku.committedStock);
  const daysUntilStockout = avgDailyForecast > 0 ? Math.floor(currentStock / avgDailyForecast) : 999;
  const reorderWindow = daysUntilStockout <= supplier.averageLeadTime
    ? "Reorder now"
    : daysUntilStockout <= supplier.averageLeadTime + 3
      ? "Reorder this week"
      : `Safe for ${Math.min(daysUntilStockout, 30)} days`;
  const summaryTrendPct = Math.round((trendRatio - 1) * 100);
  const eventReason = event
    ? `${event.name} starts in ${daysBetween(DEMO_TODAY, event.startDate)} days and applies up to ${event.demandMultiplier}x demand for ${sku.category}.`
    : "No category-level festival event affects this SKU in the next 30 days.";
  const trendReason = `7-day sales average ${recent7dAvg} units/day versus a 28-day baseline of ${baseline28dAvg} units/day (${summaryTrendPct >= 0 ? "+" : ""}${summaryTrendPct}%).`;
  const confidenceReason = confidence.confidenceReasons.join(" ");
  const forecastExplanation = {
    summary: `Demand is forecast to ${direction === "Rising" ? "rise" : direction === "Falling" ? "soften" : "stay stable"} because 7-day sales are ${Math.abs(summaryTrendPct)}% ${summaryTrendPct >= 0 ? "above" : "below"} the 28-day baseline${event ? ` and ${event.name} adds a ${event.demandMultiplier}x multiplier for ${sku.category}` : ""}.`,
    trendReason,
    eventReason,
    confidenceReason,
    formulaBreakdown: {
      recent7dAvg,
      baseline28dAvg,
      sameWeekdayAvg: firstSameWeekdayAvg,
      trendAdjustment,
      eventMultiplier,
      finalAvgDailyForecast: avgDailyForecast
    }
  };
  const channelSplit = channelDemandSplit(last7, last28);
  const revenueAtRiskBase = riskSku?.revenueAtRisk ?? Math.max(0, Math.round((totalForecastDemand30d - currentStock) * productPrice));
  return setCache(`forecast:${skuId}`, {
    skuId: sku.skuId,
    productName: sku.productName,
    category: sku.category,
    supplierName: supplier.name,
    brand: sku.brand,
    generatedAt: nowIso(),
    confidenceScore: confidence.confidenceScore,
    confidenceLabel: confidence.confidenceLabel,
    confidenceReasons: confidence.confidenceReasons,
    festivalImpactMultiplier: event?.demandMultiplier ?? 1,
    festivalImpact: event ? {
      eventName: event.name,
      daysAway: daysBetween(DEMO_TODAY, event.startDate),
      multiplier: event.demandMultiplier,
      affectedChannels: event.affectedChannels
    } : undefined,
    trendDirection: direction,
    historicalDailySales,
    forecastNext7Days,
    forecastNext30Days,
    totalForecastDemand7d,
    totalForecastDemand30d,
    avgDailyForecast,
    reorderWindow,
    channelDemandSplit: channelSplit,
    forecastExplanation,
    historical: historicalDailySales,
    next7DaysDemand: forecastNext7Days,
    next30DaysDemand: forecastNext30Days,
    channelDemand: channelSplit.map((channel) => ({ channel: channel.channel, demand: Math.round((channel.sharePct / 100) * totalForecastDemand30d) })),
    revenueAtRiskSeries: forecastNext30Days.slice(0, 14).map((point, index) => ({
      date: point.date,
      revenueAtRisk: Math.round(Math.max(0, revenueAtRiskBase - index * point.revenue * 0.18))
    }))
  }, 60_000);
};

export const getForecast = getForecastForSku;

const toForecastSummaryItem = (forecast: ForecastResponse): ForecastResponse => {
  const {
    historicalDailySales: _historicalDailySales,
    forecastNext7Days: _forecastNext7Days,
    forecastNext30Days: _forecastNext30Days,
    historical: _historical,
    next7DaysDemand: _next7DaysDemand,
    next30DaysDemand: _next30DaysDemand,
    revenueAtRiskSeries: _revenueAtRiskSeries,
    forecastExplanation: _forecastExplanation,
    confidenceReasons: _confidenceReasons,
    ...summary
  } = forecast;
  return summary;
};

export const getForecastSummary = (): ForecastSummaryResponse => {
  const cached = getCache<ForecastSummaryResponse>("forecast:summary");
  if (cached) return cached;
  const forecasts = dataStore.getAllSkus()
    .map((sku) => getForecastForSku(sku.skuId))
    .filter((forecast): forecast is ForecastResponse => Boolean(forecast));
  const summaryForecasts = forecasts.map(toForecastSummaryItem);
  return setCache("forecast:summary", {
    totalForecastDemand7d: forecasts.reduce((sum, forecast) => sum + (forecast.totalForecastDemand7d ?? 0), 0),
    totalForecastDemand30d: forecasts.reduce((sum, forecast) => sum + (forecast.totalForecastDemand30d ?? 0), 0),
    risingSkuCount: forecasts.filter((forecast) => forecast.trendDirection === "Rising").length,
    fallingSkuCount: forecasts.filter((forecast) => forecast.trendDirection === "Falling").length,
    highConfidenceCount: forecasts.filter((forecast) => forecast.confidenceLabel === "High").length,
    eventImpactedSkuCount: forecasts.filter((forecast) => (forecast.festivalImpact?.multiplier ?? 1) > 1).length,
    topForecastedSkus: [...summaryForecasts].sort((a, b) => (b.totalForecastDemand30d ?? 0) - (a.totalForecastDemand30d ?? 0)).slice(0, 6),
    topRisingSkus: [...summaryForecasts].sort((a, b) => ((b.totalForecastDemand7d ?? 0) / Math.max(1, b.totalForecastDemand30d ?? 1)) - ((a.totalForecastDemand7d ?? 0) / Math.max(1, a.totalForecastDemand30d ?? 1))).slice(0, 6),
    forecastGeneratedAt: nowIso()
  }, 60_000);
};

export const compareForecasts = (skuIds: string[]): ForecastCompareResponse => ({
  skuIds,
  forecasts: skuIds
    .map((skuId) => getForecastForSku(skuId))
    .filter((forecast): forecast is ForecastResponse => Boolean(forecast)),
  generatedAt: nowIso()
});
