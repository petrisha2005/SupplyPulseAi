export const copilotToolNames = [
    "getDailyRiskOverview",
    "getSkuIntelligence",
    "getDemandForecast",
    "analyzeSupplierRisk",
    "getReorderActionPlan"
];
export const copilotToolRegistry = [
    {
        name: "getDailyRiskOverview",
        description: "Provides current supply chain health including stockout risks, pending alerts, and inventory issues.",
        category: "risk"
    },
    {
        name: "getSkuIntelligence",
        description: "Provides combined risk, demand forecast, supplier dependency, and reorder evidence for one SKU.",
        category: "sku"
    },
    {
        name: "getDemandForecast",
        description: "Provides demand forecast, trend, confidence, event impact, and channel demand for one SKU.",
        category: "forecast"
    },
    {
        name: "analyzeSupplierRisk",
        description: "Provides supplier risk, critical SKU dependencies, and alternative supplier evidence.",
        category: "supplier"
    },
    {
        name: "getReorderActionPlan",
        description: "Provides prioritized deterministic reorder recommendations, urgency, supplier choice, and expected impact.",
        category: "recommendation"
    }
];
export const getCopilotToolDefinition = (name) => copilotToolRegistry.find((tool) => tool.name === name);
