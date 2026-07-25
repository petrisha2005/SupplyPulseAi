export const executiveSeverities = ["critical", "high", "medium", "low"];
export const executiveUrgencies = ["immediate", "today", "this_week"];
export const executiveBriefingSchema = {
    type: "object",
    additionalProperties: false,
    required: ["summary", "keyRisks", "opportunities", "immediateActions", "overallConfidence"],
    properties: {
        summary: { type: "string" },
        keyRisks: {
            type: "array",
            maxItems: 5,
            items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "severity", "situation", "businessImpact", "recommendedAction", "urgency", "evidenceIds"],
                properties: {
                    title: { type: "string" },
                    severity: { type: "string", enum: executiveSeverities },
                    situation: { type: "string" },
                    businessImpact: { type: "string" },
                    recommendedAction: { type: "string" },
                    urgency: { type: "string", enum: executiveUrgencies },
                    evidenceIds: { type: "array", minItems: 1, items: { type: "string" } }
                }
            }
        },
        opportunities: { type: "array", maxItems: 5, items: { type: "string" } },
        immediateActions: { type: "array", maxItems: 5, items: { type: "string" } },
        overallConfidence: { type: "number", minimum: 0, maximum: 1 }
    }
};
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const toText = (value) => typeof value === "string" ? value.trim() : "";
const parseTextList = (value, maxItems) => {
    if (!Array.isArray(value) || value.length > maxItems)
        return undefined;
    const items = value.map(toText);
    return items.every(Boolean) ? items : undefined;
};
const parseInsight = (value, evidenceIds) => {
    if (!isRecord(value))
        return undefined;
    const title = toText(value.title);
    const situation = toText(value.situation);
    const businessImpact = toText(value.businessImpact);
    const recommendedAction = toText(value.recommendedAction);
    const severity = value.severity;
    const urgency = value.urgency;
    const citedEvidenceIds = parseTextList(value.evidenceIds, 10);
    if (!title || !situation || !businessImpact || !recommendedAction || !citedEvidenceIds?.length)
        return undefined;
    if (!executiveSeverities.includes(severity) || !executiveUrgencies.includes(urgency))
        return undefined;
    if (!citedEvidenceIds.every((id) => evidenceIds.has(id)))
        return undefined;
    return {
        title,
        severity: severity,
        situation,
        businessImpact,
        recommendedAction,
        urgency: urgency,
        evidenceIds: [...new Set(citedEvidenceIds)]
    };
};
export const parseExecutiveBriefing = (value, supportedEvidenceIds) => {
    if (!isRecord(value))
        return undefined;
    const summary = toText(value.summary);
    const keyRisks = Array.isArray(value.keyRisks) ? value.keyRisks.map((item) => parseInsight(item, supportedEvidenceIds)) : [];
    const opportunities = parseTextList(value.opportunities, 5);
    const immediateActions = parseTextList(value.immediateActions, 5);
    const overallConfidence = typeof value.overallConfidence === "number" ? value.overallConfidence : undefined;
    if (!summary || !opportunities || !immediateActions || overallConfidence === undefined || !Number.isFinite(overallConfidence) || overallConfidence < 0 || overallConfidence > 1)
        return undefined;
    if (keyRisks.length > 5 || keyRisks.some((risk) => !risk))
        return undefined;
    return {
        summary,
        keyRisks: keyRisks,
        opportunities,
        immediateActions,
        overallConfidence
    };
};
