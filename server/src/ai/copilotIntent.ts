import type { CopilotRequest } from "./copilotSchemas.js";
import type { CopilotToolName } from "./toolRegistry.js";

export type CopilotIntent =
  | "inventory_risk_analysis"
  | "supplier_analysis"
  | "demand_forecast"
  | "reorder_planning"
  | "executive_overview";

export interface CopilotIntentResult {
  intent: CopilotIntent;
  requiredTools: CopilotToolName[];
}

export const detectCopilotIntent = (request: CopilotRequest): CopilotIntentResult => {
  const question = request.question.toLowerCase();
  const includeSkuIntelligence = (tools: CopilotToolName[]): CopilotToolName[] =>
    request.context?.skuId ? [...tools, "getSkuIntelligence"] : tools;

  if (question.includes("supplier")) {
    return {
      intent: "supplier_analysis",
      requiredTools: includeSkuIntelligence(["analyzeSupplierRisk"])
    };
  }

  if (question.includes("forecast") || question.includes("demand")) {
    return {
      intent: "demand_forecast",
      requiredTools: includeSkuIntelligence(["getDemandForecast"])
    };
  }

  if (question.includes("stockout") || question.includes("risk") || question.includes("prevent")) {
    return {
      intent: "inventory_risk_analysis",
      requiredTools: includeSkuIntelligence(["getDailyRiskOverview", "getReorderActionPlan"])
    };
  }

  if (question.includes("reorder") || question.includes("order") || question.includes("what should i do")) {
    return {
      intent: "reorder_planning",
      requiredTools: includeSkuIntelligence(["getReorderActionPlan"])
    };
  }

  return {
    intent: "executive_overview",
    requiredTools: includeSkuIntelligence(["getDailyRiskOverview"])
  };
};
