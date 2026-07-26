import type { CopilotResponse, EvidenceItem } from "./copilotSchemas.js";

export interface CopilotEvaluationInput {
  answer: string;
  evidence: EvidenceItem[];
  executiveBriefing?: CopilotResponse["executiveBriefing"];
}

export interface CopilotEvaluation {
  confidenceScore: number;
  evidenceCoverage: number;
  groundingScore: number;
  issues: string[];
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export const evaluateCopilotResponse = ({ answer, evidence, executiveBriefing }: CopilotEvaluationInput): CopilotEvaluation => {
  const issues: string[] = [];
  if (!evidence.length) {
    return {
      confidenceScore: 0,
      evidenceCoverage: 0,
      groundingScore: 0,
      issues: ["No SupplyPulse evidence was available to ground this response."]
    };
  }

  const normalizedAnswer = answer.toLowerCase();
  const referencedEvidenceIds = new Set<string>();
  for (const evidenceItem of evidence) {
    if (evidenceItem.id && normalizedAnswer.includes(evidenceItem.id.toLowerCase())) referencedEvidenceIds.add(evidenceItem.id);
    if (normalizedAnswer.includes(evidenceItem.source.toLowerCase()) && evidenceItem.id) referencedEvidenceIds.add(evidenceItem.id);
  }
  for (const risk of executiveBriefing?.keyRisks ?? []) {
    for (const evidenceId of risk.evidenceIds) referencedEvidenceIds.add(evidenceId);
  }

  const evidenceIds = evidence.map((item) => item.id).filter((id): id is string => Boolean(id));
  const evidenceCoverage = evidenceIds.length ? clamp(referencedEvidenceIds.size / evidenceIds.length) : 0;
  const citedRisks = executiveBriefing?.keyRisks.filter((risk) => risk.evidenceIds.length > 0).length ?? 0;
  const riskCoverage = executiveBriefing?.keyRisks.length ? citedRisks / executiveBriefing.keyRisks.length : 0;
  const groundingScore = clamp((evidenceCoverage + riskCoverage) / 2);
  const confidenceScore = clamp((evidenceCoverage + groundingScore) / 2);

  if (!evidenceIds.length) issues.push("Response evidence does not include stable identifiers for citation coverage.");
  if (!executiveBriefing) issues.push("Executive briefing was not generated; response uses basic evidence presentation.");
  if (evidenceCoverage < 1) issues.push("Some available evidence was not explicitly referenced by the response.");

  return { confidenceScore, evidenceCoverage, groundingScore, issues };
};
