export const detectCopilotIntent = (request) => {
    const question = request.question.toLowerCase();
    const includeSkuIntelligence = (tools) => request.context?.skuId ? [...tools, "getSkuIntelligence"] : tools;
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
