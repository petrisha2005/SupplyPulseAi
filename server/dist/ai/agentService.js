import { generateMorningBriefWithGemini, investigateSkuWithGemini, investigateWithGemini } from "./geminiClient.js";
import { riskInvestigationEvidenceKeys } from "./schemas.js";
import { getMorningBriefContext, getRiskInvestigationContext, getSkuInvestigationContext } from "./supplyPulseTools.js";
const evidenceLabels = {
    risk_score: "Deterministic risk score",
    days_of_cover: "Deterministic days of cover",
    velocity_trend: "Deterministic sales velocity trend",
    festival_demand: "Deterministic event demand signal",
    supplier_pressure: "Deterministic supplier pressure",
    committed_stock: "Deterministic committed-stock pressure",
    channel_concentration: "Deterministic channel concentration",
    forecast: "Deterministic demand forecast",
    supplier_dependencies: "Deterministic supplier dependencies",
    reorder_recommendation: "Deterministic reorder recommendation",
    alerts: "Current deterministic alerts"
};
const fallbackInvestigation = (context) => ({
    summary: context.risk.riskExplanation.summary,
    recommendedAction: context.recommendation?.recommendedAction ?? context.risk.recommendationPriority,
    evidenceKeys: riskInvestigationEvidenceKeys.filter((key) => {
        if (key === "forecast")
            return Boolean(context.forecast);
        if (key === "supplier_dependencies")
            return Boolean(context.supplierDependencies);
        if (key === "reorder_recommendation")
            return Boolean(context.recommendation);
        if (key === "alerts")
            return context.alerts.length > 0;
        return true;
    }),
    limitations: ["Gemini is disabled or unavailable; this explanation is generated from deterministic SupplyPulse engines."]
});
export const investigateRisk = async (skuId) => {
    const context = getRiskInvestigationContext(skuId);
    if (!context)
        return undefined;
    const geminiInvestigation = await investigateWithGemini(context).catch(() => undefined);
    const investigation = geminiInvestigation ?? fallbackInvestigation(context);
    const source = geminiInvestigation ? "gemini" : "deterministic-fallback";
    return {
        skuId,
        source,
        investigation,
        evidence: investigation.evidenceKeys.map((key) => ({ key, label: evidenceLabels[key] })),
        context
    };
};
const fallbackMorningBrief = (context) => {
    const priorities = context.topRiskSkus.slice(0, 3).map((sku) => {
        const recommendation = context.recommendations.find((item) => item.skuId === sku.skuId);
        return {
            title: `${sku.productName} — ${sku.riskLevel} risk`,
            reason: sku.riskReason,
            recommendedAction: recommendation?.recommendedAction ?? sku.recommendationPriority ?? "Review reorder plan",
            severity: sku.riskLevel === "Critical" ? "critical" : sku.riskLevel === "High" ? "high" : sku.riskLevel === "Medium" ? "medium" : "low"
        };
    });
    const overallHealth = context.pipeline.healthLabel === "Healthy" && !priorities.some((priority) => priority.severity === "critical")
        ? "Healthy"
        : priorities.some((priority) => priority.severity === "critical") ? "At Risk" : "Watch";
    return {
        overallHealth,
        summary: `SupplyPulse has ${context.dashboard.actionNeededCount ?? 0} SKUs requiring action. ${context.pipeline.pipelineLabel} is ${context.pipeline.healthLabel?.toLowerCase() ?? context.pipeline.status}.`,
        priorities,
        opportunities: context.recommendations.slice(0, 2).map((recommendation) => recommendation.recommendedAction ?? `Review the reorder plan for ${recommendation.productName}.`),
        watchItems: [
            ...context.activeAlerts.slice(0, 2).map((alert) => alert.title ?? alert.message),
            ...context.suppliers.filter((supplier) => ["Risky", "Critical"].includes(supplier.supplierRiskLevel ?? "")).slice(0, 1).map((supplier) => `${supplier.name}: ${supplier.supplierInsight ?? "Review supplier service health."}`)
        ].slice(0, 3),
        limitations: ["This brief uses deterministic SupplyPulse data and does not include live external marketplace, ERP, or supplier confirmations."]
    };
};
export const generateMorningBrief = async () => {
    const context = getMorningBriefContext();
    const geminiBrief = await generateMorningBriefWithGemini(context).catch(() => undefined);
    return {
        source: geminiBrief ? "gemini" : "deterministic-fallback",
        brief: geminiBrief ?? fallbackMorningBrief(context),
        context
    };
};
const investigationEvidence = (context) => {
    const evidence = [{ source: "Risk Engine", entity: context.risk.skuId }];
    if (context.forecast)
        evidence.push({ source: "Forecast Engine", entity: context.risk.skuId });
    if (context.supplierDependencies)
        evidence.push({ source: "Supplier Engine", entity: context.supplierDependencies.supplier.supplierId ?? context.risk.supplierId });
    if (context.recommendation)
        evidence.push({ source: "Recommendation Engine", entity: context.recommendation.skuId });
    return evidence;
};
const fallbackSkuInvestigation = (context, question) => {
    const normalizedQuestion = question.toLowerCase();
    const isForecastQuestion = normalizedQuestion.includes("forecast");
    const isSupplierQuestion = normalizedQuestion.includes("supplier") || normalizedQuestion.includes("delay");
    const isActionQuestion = normalizedQuestion.includes("what should") || normalizedQuestion.includes("next");
    const forecast = context.forecast;
    const recommendation = context.recommendation;
    const supplier = context.supplierDependencies?.supplier;
    const answer = isForecastQuestion && forecast?.forecastExplanation
        ? forecast.forecastExplanation.summary
        : isSupplierQuestion && recommendation?.recommendedSupplier
            ? `${recommendation.recommendedSupplier.name} is the deterministic recommendation because ${recommendation.recommendedSupplier.reason}`
            : isActionQuestion && recommendation?.recommendedAction
                ? recommendation.recommendedAction
                : context.risk.riskExplanation.summary;
    const reasoning = isForecastQuestion && forecast?.forecastExplanation
        ? [forecast.forecastExplanation.trendReason, forecast.forecastExplanation.eventReason, forecast.forecastExplanation.confidenceReason]
        : isSupplierQuestion && supplier
            ? [supplier.supplierInsight ?? "Review supplier service health.", supplier.recommendedUsage ? `Recommended usage: ${supplier.recommendedUsage}.` : "", ...(recommendation?.reasonBullets ?? [])].filter(Boolean)
            : context.risk.reasonBullets.length ? context.risk.reasonBullets : context.risk.riskExplanation.drivers.map((driver) => `${driver.label}: ${driver.detail}`);
    return {
        answer,
        reasoning: reasoning.slice(0, 5),
        recommendedActions: (recommendation?.reasonBullets ?? [recommendation?.recommendedAction ?? context.risk.recommendationPriority]).slice(0, 5),
        confidence: forecast?.confidenceLabel ?? "Medium",
        limitations: ["This explanation is based on deterministic SupplyPulse data and does not include live external marketplace, ERP, or supplier confirmations."]
    };
};
export const investigateSku = async (skuId, question) => {
    const context = getSkuInvestigationContext(skuId);
    if (!context)
        return undefined;
    const geminiInvestigation = await investigateSkuWithGemini(context, question).catch(() => undefined);
    const fallback = fallbackSkuInvestigation(context, question);
    return {
        skuId,
        source: geminiInvestigation ? "gemini" : "deterministic-fallback",
        answer: geminiInvestigation?.answer ?? fallback.answer,
        reasoning: geminiInvestigation?.reasoning ?? fallback.reasoning,
        recommendedActions: geminiInvestigation?.recommendedActions ?? fallback.recommendedActions,
        confidence: geminiInvestigation?.confidence ?? fallback.confidence,
        limitations: geminiInvestigation?.limitations ?? fallback.limitations,
        evidence: investigationEvidence(context)
    };
};
