import type { AlertItem, ForecastResponse, MorningBriefContent, MorningBriefContext, MorningBriefHealth, MorningBriefPriority, MorningBriefResponse, MorningBriefSeverity, Recommendation, SkuInvestigationEvidence, SkuInvestigationResponse } from "@supplypulse/shared";
import type { EnrichedRiskSku } from "../services/riskEngine.js";
import type { SupplierDependenciesResponse } from "@supplypulse/shared";

export interface RiskInvestigationRequest {
  skuId: string;
}

export interface RiskInvestigationContext {
  risk: EnrichedRiskSku;
  forecast?: ForecastResponse;
  supplierDependencies?: SupplierDependenciesResponse;
  recommendation?: Recommendation;
  alerts: AlertItem[];
}

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
] as const;

export type RiskInvestigationEvidenceKey = typeof riskInvestigationEvidenceKeys[number];

export interface GeminiRiskInvestigation {
  summary: string;
  recommendedAction: string;
  evidenceKeys: RiskInvestigationEvidenceKey[];
  limitations: string[];
}

export interface RiskInvestigationResponse {
  skuId: string;
  source: "gemini" | "deterministic-fallback";
  investigation: GeminiRiskInvestigation;
  evidence: Array<{ key: RiskInvestigationEvidenceKey; label: string }>;
  context: RiskInvestigationContext;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

const asTrimmedString = (value: unknown) => typeof value === "string" ? value.trim() : "";

export const parseRiskInvestigationRequest = (body: unknown): RiskInvestigationRequest | undefined => {
  if (!isRecord(body)) return undefined;
  const skuId = asTrimmedString(body.skuId);
  return skuId ? { skuId } : undefined;
};

export interface SkuInvestigationRequest {
  skuId: string;
  question: string;
}

export const parseSkuInvestigationRequest = (body: unknown): SkuInvestigationRequest | undefined => {
  if (!isRecord(body)) return undefined;
  const skuId = asTrimmedString(body.skuId);
  const question = asTrimmedString(body.question);
  if (!skuId || !question || question.length > 500) return undefined;
  return { skuId, question };
};

const hasNumericCharacters = (value: string) => /\d/.test(value);

export const parseGeminiRiskInvestigation = (value: unknown): GeminiRiskInvestigation | undefined => {
  if (!isRecord(value)) return undefined;
  const summary = asTrimmedString(value.summary);
  const recommendedAction = asTrimmedString(value.recommendedAction);
  const evidenceKeys = Array.isArray(value.evidenceKeys) ? value.evidenceKeys.filter((key): key is RiskInvestigationEvidenceKey =>
    typeof key === "string" && riskInvestigationEvidenceKeys.includes(key as RiskInvestigationEvidenceKey)
  ) : [];
  const limitations = Array.isArray(value.limitations) ? value.limitations.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];

  // Numeric facts are rendered from deterministic context only. This prevents the
  // model from introducing an uncited quantity, score, date, or currency amount.
  if (!summary || !recommendedAction || hasNumericCharacters(summary) || hasNumericCharacters(recommendedAction) || limitations.some(hasNumericCharacters)) return undefined;

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
} as const;

const morningBriefHealthValues: MorningBriefHealth[] = ["Healthy", "Watch", "At Risk"];
const morningBriefSeverityValues: MorningBriefSeverity[] = ["low", "medium", "high", "critical"];

const parseMorningBriefPriority = (value: unknown): MorningBriefPriority | undefined => {
  if (!isRecord(value)) return undefined;
  const title = asTrimmedString(value.title);
  const reason = asTrimmedString(value.reason);
  const recommendedAction = asTrimmedString(value.recommendedAction);
  const severity = value.severity;
  if (!title || !reason || !recommendedAction || hasNumericCharacters(title) || hasNumericCharacters(reason) || hasNumericCharacters(recommendedAction) || !morningBriefSeverityValues.includes(severity as MorningBriefSeverity)) return undefined;
  return { title, reason, recommendedAction, severity: severity as MorningBriefSeverity };
};

const parseBriefTextList = (value: unknown, maxItems: number) => {
  if (!Array.isArray(value) || value.length > maxItems) return undefined;
  const items = value.map(asTrimmedString);
  return items.every((item) => item && !hasNumericCharacters(item)) ? items : undefined;
};

export const parseGeminiMorningBrief = (value: unknown): MorningBriefContent | undefined => {
  if (!isRecord(value) || !morningBriefHealthValues.includes(value.overallHealth as MorningBriefHealth)) return undefined;
  const summary = asTrimmedString(value.summary);
  const priorities = Array.isArray(value.priorities) ? value.priorities.map(parseMorningBriefPriority) : [];
  const opportunities = parseBriefTextList(value.opportunities, 5);
  const watchItems = parseBriefTextList(value.watchItems, 5);
  const limitations = parseBriefTextList(value.limitations, 5);
  if (!summary || hasNumericCharacters(summary) || priorities.length < 1 || priorities.length > 3 || priorities.some((priority) => !priority) || !opportunities || !watchItems || !limitations) return undefined;
  return {
    overallHealth: value.overallHealth as MorningBriefHealth,
    summary,
    priorities: priorities as MorningBriefPriority[],
    opportunities,
    watchItems,
    limitations
  };
};

export type { MorningBriefContext, MorningBriefResponse };

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
} as const;

const skuInvestigationEvidenceSources = ["Risk Engine", "Forecast Engine", "Supplier Engine", "Recommendation Engine"] as const;
type SkuInvestigationEvidenceSource = typeof skuInvestigationEvidenceSources[number];

export interface GeminiSkuInvestigation {
  answer: string;
  reasoning: string[];
  recommendedActions: string[];
  confidence: "High" | "Medium" | "Low";
  limitations: string[];
  evidenceSources: SkuInvestigationEvidenceSource[];
}

export const parseGeminiSkuInvestigation = (value: unknown): GeminiSkuInvestigation | undefined => {
  if (!isRecord(value)) return undefined;
  const answer = asTrimmedString(value.answer);
  const reasoning = parseBriefTextList(value.reasoning, 5);
  const recommendedActions = parseBriefTextList(value.recommendedActions, 5);
  const limitations = parseBriefTextList(value.limitations, 5);
  const confidence = value.confidence;
  const evidenceSources = Array.isArray(value.evidenceSources) ? value.evidenceSources.filter((source): source is SkuInvestigationEvidenceSource =>
    typeof source === "string" && skuInvestigationEvidenceSources.includes(source as SkuInvestigationEvidenceSource)
  ) : [];
  if (!answer || hasNumericCharacters(answer) || !reasoning || !recommendedActions || !limitations || !["High", "Medium", "Low"].includes(confidence as string)) return undefined;
  return { answer, reasoning, recommendedActions, confidence: confidence as GeminiSkuInvestigation["confidence"], limitations, evidenceSources: [...new Set(evidenceSources)] };
};

export type { SkuInvestigationEvidence, SkuInvestigationResponse };

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
} as const;
