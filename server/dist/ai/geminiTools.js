import { copilotToolRegistry } from "./toolRegistry.js";
const noArgumentsSchema = {
    type: "object",
    additionalProperties: false,
    properties: {}
};
const identifierArgumentSchema = (propertyName, description) => ({
    type: "object",
    additionalProperties: false,
    required: [propertyName],
    properties: {
        [propertyName]: {
            type: "string",
            description
        }
    }
});
const parameterSchemas = {
    getDailyRiskOverview: noArgumentsSchema,
    getSkuIntelligence: identifierArgumentSchema("skuId", "Unique SKU identifier"),
    getDemandForecast: identifierArgumentSchema("skuId", "Unique SKU identifier"),
    analyzeSupplierRisk: identifierArgumentSchema("supplierId", "Supplier identifier"),
    getReorderActionPlan: noArgumentsSchema
};
export const getGeminiToolDefinitions = () => copilotToolRegistry.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parametersJsonSchema: parameterSchemas[tool.name]
}));
export const getGeminiToolDefinition = (name) => getGeminiToolDefinitions().find((tool) => tool.name === name);
