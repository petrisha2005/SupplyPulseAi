import { getAIConfiguration } from "./aiConfig.js";
import { evaluateCopilotResponse } from "./aiEvaluation.js";
import { recordFallback, recordGeminiSuccess, recordRequest, recordToolCall } from "./aiMetrics.js";
import { detectCopilotIntent } from "./copilotIntent.js";
import { orchestrateGemini } from "./geminiOrchestrator.js";
import { analyzeSupplierRisk, getDailyRiskOverview, getDemandForecast, getReorderActionPlan, getSkuIntelligence } from "./copilotTools.js";
import { getCopilotToolDefinition } from "./toolRegistry.js";
const toAction = (recommendation) => ({
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
const finalizeCopilotResponse = (response) => {
    const evaluation = evaluateCopilotResponse({
        answer: response.answer,
        evidence: response.evidence,
        executiveBriefing: response.executiveBriefing
    });
    const metadata = {
        ...response.metadata,
        confidenceScore: evaluation.confidenceScore,
        groundingScore: evaluation.groundingScore
    };
    const limitations = [...new Set([...(response.limitations ?? []), ...evaluation.issues])];
    const executionTimeMs = metadata.executionTimeMs ?? 0;
    recordRequest(executionTimeMs);
    if (response.generatedBy === "gemini")
        recordGeminiSuccess();
    else
        recordFallback();
    recordToolCall(metadata.toolsUsed?.length ?? 0);
    return {
        ...response,
        ...(limitations.length ? { limitations } : {}),
        metadata
    };
};
const executeTool = async (name, request) => {
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
export const answerCopilotQuestion = async (request) => {
    const startedAt = Date.now();
    const intent = detectCopilotIntent(request);
    const configuration = getAIConfiguration();
    if (configuration.aiMode === "gemini") {
        const geminiResponse = await orchestrateGemini(request);
        if (geminiResponse) {
            return finalizeCopilotResponse({
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
            });
        }
    }
    const evidence = [];
    const summaries = [];
    const actions = [];
    const toolsUsed = [];
    for (const toolName of intent.requiredTools) {
        if (!getCopilotToolDefinition(toolName))
            continue;
        const result = await executeTool(toolName, request);
        toolsUsed.push(toolName);
        evidence.push(...result.evidence);
        if (result.summary)
            summaries.push(result.summary);
        if (result.actions)
            actions.push(...result.actions);
    }
    const uniqueEvidence = evidence.filter((item, index, values) => values.findIndex((candidate) => candidate.source === item.source && candidate.type === item.type && candidate.id === item.id) === index);
    return finalizeCopilotResponse({
        answer: summaries.length
            ? summaries.join(" ")
            : actions.length
                ? "SupplyPulse prepared deterministic reorder actions from the current operational data."
                : "SupplyPulse could not find a deterministic response for this question.",
        actions: actions.filter((action, index, values) => values.findIndex((candidate) => candidate.title === action.title) === index),
        limitations: ["Gemini reasoning was unavailable for this request, so SupplyPulse returned deterministic intelligence."],
        evidence: uniqueEvidence,
        generatedBy: "fallback",
        metadata: {
            intent: intent.intent,
            toolsUsed,
            executionTimeMs: Date.now() - startedAt,
            aiMode: "fallback",
            reasoningLevel: "basic"
        }
    });
};
