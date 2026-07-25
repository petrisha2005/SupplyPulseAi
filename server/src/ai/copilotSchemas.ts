export interface CopilotRequest {
  question: string;
  context?: {
    skuId?: string;
    supplierId?: string;
    marketplace?: string;
  };
}

export interface EvidenceItem {
  source: string;
  type: string;
  id?: string;
  summary: string;
  timestamp?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface CopilotAction {
  priority: string;
  title: string;
  reasoning: string;
  expectedImpact?: string;
  evidence: EvidenceItem[];
}

export interface CopilotMetadata {
  intent?: string;
  toolsUsed?: string[];
  executionTimeMs?: number;
  aiMode?: "fallback" | "gemini";
  reasoningLevel?: "basic" | "executive";
}

export interface CopilotResponse {
  answer: string;
  actions: CopilotAction[];
  confidence?: number;
  limitations?: string[];
  evidence: EvidenceItem[];
  generatedBy: "gemini" | "fallback";
  executiveBriefing?: {
    summary: string;
    keyRisks: ExecutiveInsight[];
    immediateActions: string[];
  };
  metadata?: CopilotMetadata;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseCopilotRequest = (body: unknown): CopilotRequest | undefined => {
  if (!isRecord(body) || typeof body.question !== "string") return undefined;
  const question = body.question.trim();
  if (!question || question.length > 500) return undefined;
  if (body.context !== undefined && !isRecord(body.context)) return undefined;

  const context = body.context ? {
    skuId: typeof body.context.skuId === "string" && body.context.skuId.trim() ? body.context.skuId.trim() : undefined,
    supplierId: typeof body.context.supplierId === "string" && body.context.supplierId.trim() ? body.context.supplierId.trim() : undefined,
    marketplace: typeof body.context.marketplace === "string" && body.context.marketplace.trim() ? body.context.marketplace.trim() : undefined
  } : undefined;

  return { question, ...(context ? { context } : {}) };
};
import type { ExecutiveInsight } from "./executiveSchemas.js";
