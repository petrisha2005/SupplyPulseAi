export const riskInvestigationEvidenceKeys = [
    "risk_score",
    "days_of_cover",
    "velocity_trend",
    "festival_demand",
    "supplier_pressure",
    "committed_stock",
    "channel_concentration",
    "forecast",
    "supplier_dependencies",
    "reorder_recommendation",
    "alerts"
];
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const asTrimmedString = (value) => typeof value === "string" ? value.trim() : "";
export const parseRiskInvestigationRequest = (body) => {
    if (!isRecord(body))
        return undefined;
    const skuId = asTrimmedString(body.skuId);
    return skuId ? { skuId } : undefined;
};
export const parseSkuInvestigationRequest = (body) => {
    if (!isRecord(body))
        return undefined;
    const skuId = asTrimmedString(body.skuId);
    const question = asTrimmedString(body.question);
    if (!skuId || !question || question.length > 500)
        return undefined;
    return { skuId, question };
};
const hasNumericCharacters = (value) => /\d/.test(value);
export const parseGeminiRiskInvestigation = (value) => {
    if (!isRecord(value))
        return undefined;
    const summary = asTrimmedString(value.summary);
    const recommendedAction = asTrimmedString(value.recommendedAction);
    const evidenceKeys = Array.isArray(value.evidenceKeys) ? value.evidenceKeys.filter((key) => typeof key === "string" && riskInvestigationEvidenceKeys.includes(key)) : [];
    const limitations = Array.isArray(value.limitations) ? value.limitations.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];
    // Numeric facts are rendered from deterministic context only. This prevents the
    // model from introducing an uncited quantity, score, date, or currency amount.
    if (!summary || !recommendedAction || hasNumericCharacters(summary) || hasNumericCharacters(recommendedAction) || limitations.some(hasNumericCharacters))
        return undefined;
    return {
        summary,
        recommendedAction,
        evidenceKeys: [...new Set(evidenceKeys)],
        limitations
    };
};
export const geminiRiskInvestigationSchema = {
    type: "object",
    additionalProperties: false,
    required: ["summary", "recommendedAction", "evidenceKeys", "limitations"],
    properties: {
        summary: { type: "string" },
        recommendedAction: { type: "string" },
        evidenceKeys: {
            type: "array",
            items: { type: "string", enum: [...riskInvestigationEvidenceKeys] },
            maxItems: riskInvestigationEvidenceKeys.length
        },
        limitations: {
            type: "array",
            items: { type: "string" },
            maxItems: 5
        }
    }
};
const morningBriefHealthValues = ["Healthy", "Watch", "At Risk"];
const morningBriefSeverityValues = ["low", "medium", "high", "critical"];
const parseMorningBriefPriority = (value) => {
    if (!isRecord(value))
        return undefined;
    const title = asTrimmedString(value.title);
    const reason = asTrimmedString(value.reason);
    const recommendedAction = asTrimmedString(value.recommendedAction);
    const severity = value.severity;
    if (!title || !reason || !recommendedAction || hasNumericCharacters(title) || hasNumericCharacters(reason) || hasNumericCharacters(recommendedAction) || !morningBriefSeverityValues.includes(severity))
        return undefined;
    return { title, reason, recommendedAction, severity: severity };
};
const parseBriefTextList = (value, maxItems) => {
    if (!Array.isArray(value) || value.length > maxItems)
        return undefined;
    const items = value.map(asTrimmedString);
    return items.every((item) => item && !hasNumericCharacters(item)) ? items : undefined;
};
export const parseGeminiMorningBrief = (value) => {
    if (!isRecord(value) || !morningBriefHealthValues.includes(value.overallHealth))
        return undefined;
    const summary = asTrimmedString(value.summary);
    const priorities = Array.isArray(value.priorities) ? value.priorities.map(parseMorningBriefPriority) : [];
    const opportunities = parseBriefTextList(value.opportunities, 5);
    const watchItems = parseBriefTextList(value.watchItems, 5);
    const limitations = parseBriefTextList(value.limitations, 5);
    if (!summary || hasNumericCharacters(summary) || priorities.length < 1 || priorities.length > 3 || priorities.some((priority) => !priority) || !opportunities || !watchItems || !limitations)
        return undefined;
    return {
        overallHealth: value.overallHealth,
        summary,
        priorities: priorities,
        opportunities,
        watchItems,
        limitations
    };
};
export const geminiMorningBriefSchema = {
    type: "object",
    additionalProperties: false,
    required: ["overallHealth", "summary", "priorities", "opportunities", "watchItems", "limitations"],
    properties: {
        overallHealth: { type: "string", enum: morningBriefHealthValues },
        summary: { type: "string" },
        priorities: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "reason", "recommendedAction", "severity"],
                properties: {
                    title: { type: "string" },
                    reason: { type: "string" },
                    recommendedAction: { type: "string" },
                    severity: { type: "string", enum: morningBriefSeverityValues }
                }
            }
        },
        opportunities: { type: "array", maxItems: 5, items: { type: "string" } },
        watchItems: { type: "array", maxItems: 5, items: { type: "string" } },
        limitations: { type: "array", maxItems: 5, items: { type: "string" } }
    }
};
const skuInvestigationEvidenceSources = ["Risk Engine", "Forecast Engine", "Supplier Engine", "Recommendation Engine"];
export const parseGeminiSkuInvestigation = (value) => {
    if (!isRecord(value))
        return undefined;
    const answer = asTrimmedString(value.answer);
    const reasoning = parseBriefTextList(value.reasoning, 5);
    const recommendedActions = parseBriefTextList(value.recommendedActions, 5);
    const limitations = parseBriefTextList(value.limitations, 5);
    const confidence = value.confidence;
    const evidenceSources = Array.isArray(value.evidenceSources) ? value.evidenceSources.filter((source) => typeof source === "string" && skuInvestigationEvidenceSources.includes(source)) : [];
    if (!answer || hasNumericCharacters(answer) || !reasoning || !recommendedActions || !limitations || !["High", "Medium", "Low"].includes(confidence))
        return undefined;
    return { answer, reasoning, recommendedActions, confidence: confidence, limitations, evidenceSources: [...new Set(evidenceSources)] };
};
export const geminiSkuInvestigationSchema = {
    type: "object",
    additionalProperties: false,
    required: ["answer", "reasoning", "recommendedActions", "confidence", "limitations", "evidenceSources"],
    properties: {
        answer: { type: "string" },
        reasoning: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
        recommendedActions: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
        confidence: { type: "string", enum: ["High", "Medium", "Low"] },
        limitations: { type: "array", maxItems: 5, items: { type: "string" } },
        evidenceSources: { type: "array", maxItems: 4, items: { type: "string", enum: [...skuInvestigationEvidenceSources] } }
    }
};
