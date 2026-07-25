import type { Recommendation } from "@supplypulse/shared";
import type { CopilotAction, CopilotRequest, CopilotResponse, EvidenceItem } from "./copilotSchemas.js";
import { getAIConfiguration } from "./aiConfig.js";
import { detectCopilotIntent } from "./copilotIntent.js";
import { orchestrateGemini } from "./geminiOrchestrator.js";
import { analyzeSupplierRisk, getDailyRiskOverview, getDemandForecast, getReorderActionPlan, getSkuIntelligence } from "./copilotTools.js";
import { getCopilotToolDefinition, type CopilotToolName } from "./toolRegistry.js";

const toAction = (recommendation: Recommendation): CopilotAction => ({
  priority: recommendation.urgency ?? recommendation.riskLevel ?? "Review",
  title: recommendation.recommendedAction ?? `Review ${recommendation.productName}`,
  reasoning: recommendation.reasoning,
  expectedImpact: recommendation.revenueProtected
    ? `Estimated revenue protected: ₹${Math.round(recommendation.revenueProtected).toLocaleString("en-IN")}.`
    : undefined,
  evidence: [{
    source: "Recommendation Engine",
    type: "reorder-recommendation",
    id: recommendation.recommendationId ?? recommendation.skuId,
    summary: recommendation.reasoning
  }]
});

interface ToolExecution {
  summary?: string;
  actions?: CopilotAction[];
  evidence: EvidenceItem[];
}

const executeTool = async (name: CopilotToolName, request: CopilotRequest): Promise<ToolExecution> => {
  if (name === "getDailyRiskOverview") {
    const result = await getDailyRiskOverview();
    return { summary: result.data.summary, evidence: result.evidence };
  }

  if (name === "getReorderActionPlan") {
    const result = await getReorderActionPlan();
    return { actions: result.data.recommendations.slice(0, 3).map(toAction), evidence: result.evidence };
  }

  if (name === "analyzeSupplierRisk") {
    const result = await analyzeSupplierRisk(request.context?.supplierId);
    return result ? {
      summary: result.data.supplier.supplierInsight ?? "Supplier risk analysis is available in the supporting evidence.",
      evidence: result.evidence
    } : { evidence: [] };
  }

  if (name === "getSkuIntelligence") {
    const skuId = request.context?.skuId;
    const result = skuId ? await getSkuIntelligence(skuId) : undefined;
    return result ? {
      summary: result.data.risk.riskExplanation.summary,
      actions: result.data.recommendation ? [toAction(result.data.recommendation)] : [],
      evidence: result.evidence
    } : { evidence: [] };
  }

  const skuId = request.context?.skuId ?? (await getDailyRiskOverview()).data.topRiskSkus[0]?.skuId;
  const result = skuId ? await getDemandForecast(skuId) : undefined;
  return result ? {
    summary: result.data.forecastExplanation?.summary ?? `Demand forecast generated for ${result.data.productName}.`,
    evidence: result.evidence
  } : { evidence: [] };
};

export const answerCopilotQuestion = async (request: CopilotRequest): Promise<CopilotResponse> => {
  const startedAt = Date.now();
  const intent = detectCopilotIntent(request);
  const configuration = getAIConfiguration();

  if (configuration.aiMode === "gemini") {
    const geminiResponse = await orchestrateGemini(request);
    if (geminiResponse) {
      return {
        answer: geminiResponse.answer,
        actions: geminiResponse.actions,
        confidence: geminiResponse.confidence,
        evidence: geminiResponse.evidence,
        generatedBy: "gemini",
        executiveBriefing: geminiResponse.executiveBriefing,
        metadata: {
          intent: intent.intent,
          toolsUsed: geminiResponse.toolsUsed,
          executionTimeMs: Date.now() - startedAt,
          aiMode: "gemini",
          reasoningLevel: "executive"
        }
      };
    }
  }

  const evidence: EvidenceItem[] = [];
  const summaries: string[] = [];
  const actions: CopilotAction[] = [];
  const toolsUsed: CopilotToolName[] = [];

  for (const toolName of intent.requiredTools) {
    if (!getCopilotToolDefinition(toolName)) continue;
    const result = await executeTool(toolName, request);
    toolsUsed.push(toolName);
    evidence.push(...result.evidence);
    if (result.summary) summaries.push(result.summary);
    if (result.actions) actions.push(...result.actions);
  }

  const uniqueEvidence = evidence.filter((item, index, values) =>
    values.findIndex((candidate) => candidate.source === item.source && candidate.type === item.type && candidate.id === item.id) === index
  );

  return {
    answer: summaries.length
      ? summaries.join(" ")
      : actions.length
        ? "SupplyPulse prepared deterministic reorder actions from the current operational data."
        : "SupplyPulse could not find a deterministic response for this question.",
    actions: actions.filter((action, index, values) => values.findIndex((candidate) => candidate.title === action.title) === index),
    limitations: ["This Phase 1 response is generated from deterministic SupplyPulse services; Gemini reasoning is not enabled for this endpoint yet."],
    evidence: uniqueEvidence,
    generatedBy: "fallback",
    metadata: {
      intent: intent.intent,
      toolsUsed,
      executionTimeMs: Date.now() - startedAt,
      aiMode: "fallback",
      reasoningLevel: "basic"
    }
  };
};
