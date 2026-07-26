export const executiveSeverities = ["critical", "high", "medium", "low"] as const;
export const executiveUrgencies = ["immediate", "today", "this_week"] as const;

export type ExecutiveSeverity = typeof executiveSeverities[number];
export type ExecutiveUrgency = typeof executiveUrgencies[number];

export interface ExecutiveInsight {
  title: string;
  severity: ExecutiveSeverity;
  situation: string;
  businessImpact: string;
  recommendedAction: string;
  urgency: ExecutiveUrgency;
  evidenceIds: string[];
}

export interface ExecutiveBriefing {
  summary: string;
  keyRisks: ExecutiveInsight[];
  opportunities: string[];
  immediateActions: string[];
  overallConfidence: number;
}

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
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toText = (value: unknown) => typeof value === "string" ? value.trim() : "";

const parseTextList = (value: unknown, maxItems: number): string[] | undefined => {
  if (!Array.isArray(value) || value.length > maxItems) return undefined;
  const items = value.map(toText);
  return items.every(Boolean) ? items : undefined;
};

const parseInsight = (value: unknown, evidenceIds: Set<string>): ExecutiveInsight | undefined => {
  if (!isRecord(value)) return undefined;
  const title = toText(value.title);
  const situation = toText(value.situation);
  const businessImpact = toText(value.businessImpact);
  const recommendedAction = toText(value.recommendedAction);
  const severity = value.severity;
  const urgency = value.urgency;
  const citedEvidenceIds = parseTextList(value.evidenceIds, 10);
  if (!title || !situation || !businessImpact || !recommendedAction || !citedEvidenceIds?.length) return undefined;
  if (!executiveSeverities.includes(severity as ExecutiveSeverity) || !executiveUrgencies.includes(urgency as ExecutiveUrgency)) return undefined;
  if (!citedEvidenceIds.every((id) => evidenceIds.has(id))) return undefined;
  return {
    title,
    severity: severity as ExecutiveSeverity,
    situation,
    businessImpact,
    recommendedAction,
    urgency: urgency as ExecutiveUrgency,
    evidenceIds: [...new Set(citedEvidenceIds)]
  };
};

export const parseExecutiveBriefing = (value: unknown, supportedEvidenceIds: Set<string>): ExecutiveBriefing | undefined => {
  if (!isRecord(value)) return undefined;
  const summary = toText(value.summary);
  const keyRisks = Array.isArray(value.keyRisks) ? value.keyRisks.map((item) => parseInsight(item, supportedEvidenceIds)) : [];
  const opportunities = parseTextList(value.opportunities, 5);
  const immediateActions = parseTextList(value.immediateActions, 5);
  const overallConfidence = typeof value.overallConfidence === "number" ? value.overallConfidence : undefined;
  if (!summary || !opportunities || !immediateActions || overallConfidence === undefined || !Number.isFinite(overallConfidence) || overallConfidence < 0 || overallConfidence > 1) return undefined;
  if (keyRisks.length > 5 || keyRisks.some((risk) => !risk)) return undefined;
  return {
    summary,
    keyRisks: keyRisks as ExecutiveInsight[],
    opportunities,
    immediateActions,
    overallConfidence
  };
};
