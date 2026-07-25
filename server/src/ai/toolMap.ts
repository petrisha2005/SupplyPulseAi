import {
  analyzeSupplierRisk,
  getDailyRiskOverview,
  getDemandForecast,
  getReorderActionPlan,
  getSkuIntelligence,
  type CopilotToolResult
} from "./copilotTools.js";
import type { CopilotToolName } from "./toolRegistry.js";

export type MappedCopilotTool = (argumentsValue: Record<string, unknown>) => Promise<CopilotToolResult<unknown> | undefined>;

export const toolMap: Record<CopilotToolName, MappedCopilotTool> = {
  getDailyRiskOverview: async () => getDailyRiskOverview(),
  getSkuIntelligence: async (argumentsValue) => getSkuIntelligence(argumentsValue.skuId as string),
  getDemandForecast: async (argumentsValue) => getDemandForecast(argumentsValue.skuId as string),
  analyzeSupplierRisk: async (argumentsValue) => analyzeSupplierRisk(argumentsValue.supplierId as string),
  getReorderActionPlan: async () => getReorderActionPlan()
};
