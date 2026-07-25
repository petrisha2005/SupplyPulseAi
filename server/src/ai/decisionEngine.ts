import type { EvidenceItem } from "./copilotSchemas.js";

export interface DecisionIntelligenceInput {
  question: string;
  toolResults: unknown[];
  evidence: EvidenceItem[];
}

export interface DecisionEvidenceContext {
  source: string;
  type: string;
  id?: string;
  summary: string;
}

export interface DecisionIntelligenceContext {
  priorities: DecisionEvidenceContext[];
  businessContext: DecisionEvidenceContext[];
  evidenceSummary: DecisionEvidenceContext[];
}

const evidencePriority: Record<string, number> = {
  "operational-alert": 0,
  "sku-risk": 1,
  "demand-forecast": 2,
  "supplier-risk": 3,
  "reorder-recommendation": 4
};

const toDecisionEvidence = (evidence: EvidenceItem): DecisionEvidenceContext => ({
  source: evidence.source,
  type: evidence.type,
  id: evidence.id,
  summary: evidence.summary
});

export const buildDecisionIntelligence = ({ evidence }: DecisionIntelligenceInput): DecisionIntelligenceContext => {
  const orderedEvidence = [...evidence]
    .sort((left, right) => (evidencePriority[left.type] ?? Number.MAX_SAFE_INTEGER) - (evidencePriority[right.type] ?? Number.MAX_SAFE_INTEGER))
    .map(toDecisionEvidence);

  return {
    priorities: orderedEvidence.slice(0, 5),
    businessContext: orderedEvidence.filter((item) => item.type !== "operational-alert").slice(0, 8),
    evidenceSummary: orderedEvidence
  };
};
