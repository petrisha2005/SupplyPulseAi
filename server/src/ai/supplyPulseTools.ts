import { getAlerts } from "../services/alertEngine.js";
import { getForecastForSku } from "../services/forecastEngine.js";
import { getPipelineStatus } from "../services/pipelineEngine.js";
import { getRecommendationBySku } from "../services/recommendationEngine.js";
import { getRecommendations } from "../services/recommendationEngine.js";
import { getExecutiveSummaryReport } from "../services/reportEngine.js";
import { getRiskExplanationBySku } from "../services/riskEngine.js";
import { getSupplierDependencies, getSupplierScorecards } from "../services/supplierEngine.js";
import type { MorningBriefContext, RiskInvestigationContext } from "./schemas.js";

/**
 * Read-only adapter for agent context. The deterministic engines remain the
 * source of truth; this module deliberately does not access dataStore or mutate
 * alerts, inventory, suppliers, or recommendations.
 */
export const getRiskInvestigationContext = (skuId: string): RiskInvestigationContext | undefined => {
  const risk = getRiskExplanationBySku(skuId);
  if (!risk) return undefined;

  return {
    risk,
    forecast: getForecastForSku(skuId),
    supplierDependencies: getSupplierDependencies(risk.supplierId),
    recommendation: getRecommendationBySku(skuId),
    alerts: getAlerts({ skuId, limit: 10 })
  };
};

export const getSkuInvestigationContext = getRiskInvestigationContext;

/**
 * Collects existing service outputs without reimplementing their calculations.
 * These deterministic values are the full factual context for the Morning Brief.
 */
export const getMorningBriefContext = (): MorningBriefContext => {
  const report = getExecutiveSummaryReport();
  return {
    dashboard: report.dashboardSummary,
    topRiskSkus: report.topRiskSkus,
    forecastSummary: report.forecastSummary,
    suppliers: getSupplierScorecards(),
    activeAlerts: getAlerts({ status: "Pending", limit: 20 }),
    recommendations: getRecommendations({ limit: 10 }),
    pipeline: getPipelineStatus()
  };
};
