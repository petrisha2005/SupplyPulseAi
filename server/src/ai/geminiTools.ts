import type { FunctionDeclaration } from "@google/genai";
import { copilotToolRegistry, type CopilotToolName } from "./toolRegistry.js";

const noArgumentsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {}
} as const;

const identifierArgumentSchema = (propertyName: "skuId" | "supplierId", description: string) => ({
  type: "object",
  additionalProperties: false,
  required: [propertyName],
  properties: {
    [propertyName]: {
      type: "string",
      description
    }
  }
} as const);

const parameterSchemas: Record<CopilotToolName, unknown> = {
  getDailyRiskOverview: noArgumentsSchema,
  getSkuIntelligence: identifierArgumentSchema("skuId", "Unique SKU identifier"),
  getDemandForecast: identifierArgumentSchema("skuId", "Unique SKU identifier"),
  analyzeSupplierRisk: identifierArgumentSchema("supplierId", "Supplier identifier"),
  getReorderActionPlan: noArgumentsSchema
};

export const getGeminiToolDefinitions = (): FunctionDeclaration[] =>
  copilotToolRegistry.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parametersJsonSchema: parameterSchemas[tool.name]
  }));

export const getGeminiToolDefinition = (name: CopilotToolName): FunctionDeclaration | undefined =>
  getGeminiToolDefinitions().find((tool) => tool.name === name);
