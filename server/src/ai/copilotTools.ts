import type { AlertItem, ForecastResponse, Recommendation, Supplier } from "@supplypulse/shared";
import { getAlerts } from "../services/alertEngine.js";
import { getForecastForSku } from "../services/forecastEngine.js";
import { getRecommendationBySku, getRecommendations } from "../services/recommendationEngine.js";
import { getExecutiveSummaryReport } from "../services/reportEngine.js";
import { getRiskExplanationBySku, getRiskList } from "../services/riskEngine.js";
import { getSupplierDependencies, getSupplierScorecards, supplierSummaryText } from "../services/supplierEngine.js";
import type { EvidenceItem } from "./copilotSchemas.js";

export interface CopilotToolResult<T> {
  tool: string;
  data: T;
  evidence: EvidenceItem[];
}

const riskEvidence = (sku: { skuId: string; productName: string; riskReason?: string }): EvidenceItem => ({
  source: "Risk Engine",
  type: "sku-risk",
  id: sku.skuId,
  summary: sku.riskReason ?? `${sku.productName} risk assessment.`
});

const forecastEvidence = (forecast: ForecastResponse): EvidenceItem => ({
  source: "Forecast Engine",
  type: "demand-forecast",
  id: forecast.skuId,
  summary: forecast.forecastExplanation?.summary ?? `Demand forecast generated for ${forecast.productName}.`
});

const supplierEvidence = (supplier: Supplier): EvidenceItem => ({
  source: "Supplier Engine",
  type: "supplier-risk",
  id: supplier.supplierId ?? supplier.id,
  summary: supplier.supplierInsight ?? supplierSummaryText(supplier)
});

const recommendationEvidence = (recommendation: Recommendation): EvidenceItem => ({
  source: "Recommendation Engine",
  type: "reorder-recommendation",
  id: recommendation.recommendationId ?? recommendation.skuId,
  summary: recommendation.reasoning
});

const alertEvidence = (alert: AlertItem): EvidenceItem => ({
  source: "Alert Engine",
  type: "operational-alert",
  id: alert.alertId ?? alert.id,
  summary: alert.title ?? alert.message
});

export const getDailyRiskOverview = async (): Promise<CopilotToolResult<{
  summary: string;
  dashboard: ReturnType<typeof getExecutiveSummaryReport>["dashboardSummary"];
  topRiskSkus: ReturnType<typeof getRiskList>;
  pendingAlerts: AlertItem[];
}>> => {
  const report = getExecutiveSummaryReport();
  const topRiskSkus = getRiskList().slice(0, 8);
  const pendingAlerts = getAlerts({ status: "Pending", limit: 10 });
  return {
    tool: "getDailyRiskOverview",
    data: {
      summary: report.executiveSummaryText,
      dashboard: report.dashboardSummary,
      topRiskSkus,
      pendingAlerts
    },
    evidence: [
      ...topRiskSkus.map(riskEvidence),
      ...pendingAlerts.map(alertEvidence)
    ]
  };
};

export const getSkuIntelligence = async (skuId: string): Promise<CopilotToolResult<{
  risk: NonNullable<ReturnType<typeof getRiskExplanationBySku>>;
  forecast?: ForecastResponse;
  recommendation?: Recommendation;
  supplier?: ReturnType<typeof getSupplierDependencies>;
}> | undefined> => {
  const risk = getRiskExplanationBySku(skuId);
  if (!risk) return undefined;
  const forecast = getForecastForSku(skuId);
  const recommendation = getRecommendationBySku(skuId);
  const supplier = getSupplierDependencies(risk.supplierId);
  return {
    tool: "getSkuIntelligence",
    data: { risk, forecast, recommendation, supplier },
    evidence: [
      riskEvidence(risk),
      ...(forecast ? [forecastEvidence(forecast)] : []),
      ...(recommendation ? [recommendationEvidence(recommendation)] : []),
      ...(supplier ? [supplierEvidence(supplier.supplier)] : [])
    ]
  };
};

export const getDemandForecast = async (skuId: string): Promise<CopilotToolResult<ForecastResponse> | undefined> => {
  const forecast = getForecastForSku(skuId);
  if (!forecast) return undefined;
  return {
    tool: "getDemandForecast",
    data: forecast,
    evidence: [forecastEvidence(forecast)]
  };
};

export const analyzeSupplierRisk = async (supplierId?: string): Promise<CopilotToolResult<{
  supplier: Supplier;
  dependencies?: NonNullable<ReturnType<typeof getSupplierDependencies>>;
  alternatives: Supplier[];
}> | undefined> => {
  const suppliers = getSupplierScorecards();
  const supplier = supplierId
    ? suppliers.find((item) => item.supplierId === supplierId || item.id === supplierId)
    : suppliers[0];
  if (!supplier) return undefined;
  const dependencies = getSupplierDependencies(supplier.supplierId ?? supplier.id);
  const alternatives = suppliers
    .filter((item) => (item.supplierId ?? item.id) !== (supplier.supplierId ?? supplier.id))
    .slice(0, 3);
  return {
    tool: "analyzeSupplierRisk",
    data: { supplier, dependencies, alternatives },
    evidence: [
      supplierEvidence(supplier),
      ...alternatives.map(supplierEvidence)
    ]
  };
};

export const getReorderActionPlan = async (): Promise<CopilotToolResult<{
  recommendations: Recommendation[];
}>> => {
  const recommendations = getRecommendations({ limit: 5 });
  return {
    tool: "getReorderActionPlan",
    data: { recommendations },
    evidence: recommendations.map(recommendationEvidence)
  };
};
