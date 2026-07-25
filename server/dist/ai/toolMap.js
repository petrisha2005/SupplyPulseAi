import { analyzeSupplierRisk, getDailyRiskOverview, getDemandForecast, getReorderActionPlan, getSkuIntelligence } from "./copilotTools.js";
export const toolMap = {
    getDailyRiskOverview: async () => getDailyRiskOverview(),
    getSkuIntelligence: async (argumentsValue) => getSkuIntelligence(argumentsValue.skuId),
    getDemandForecast: async (argumentsValue) => getDemandForecast(argumentsValue.skuId),
    analyzeSupplierRisk: async (argumentsValue) => analyzeSupplierRisk(argumentsValue.supplierId),
    getReorderActionPlan: async () => getReorderActionPlan()
};
