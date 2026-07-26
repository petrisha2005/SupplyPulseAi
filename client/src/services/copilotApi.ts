const API_BASE = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5050";

export type ExecutiveSeverity = "critical" | "high" | "medium" | "low";

export interface ExecutiveInsight {
  title: string;
  severity: ExecutiveSeverity;
  situation: string;
  businessImpact: string;
  recommendedAction: string;
  urgency: "immediate" | "today" | "this_week";
  evidenceIds: string[];
}

export interface EvidenceItem {
  source: string;
  type: string;
  id?: string;
  summary: string;
}

export interface CopilotResponse {
  answer: string;
  actions: Array<{
    priority: string;
    title: string;
    reasoning: string;
    expectedImpact?: string;
  }>;
  confidence?: number;
  limitations?: string[];
  evidence: EvidenceItem[];
  generatedBy: "gemini" | "fallback";
  executiveBriefing?: {
    summary: string;
    keyRisks: ExecutiveInsight[];
    immediateActions: string[];
  };
  metadata?: {
    aiMode?: "fallback" | "gemini";
    confidenceScore?: number;
    groundingScore?: number;
  };
}

export interface CopilotHealth {
  status: "healthy";
  aiMode: "fallback" | "gemini";
  metrics: {
    requestCount: number;
    geminiSuccessCount: number;
    fallbackCount: number;
    toolCallCount: number;
    averageLatencyMs: number;
  };
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  if (!response.ok) throw new Error(`AI request failed (${response.status})`);
  return response.json() as Promise<T>;
};

export const askCopilot = (question: string): Promise<CopilotResponse> =>
  request<CopilotResponse>("/api/ai/copilot", {
    method: "POST",
    body: JSON.stringify({ question })
  });

export const getCopilotHealth = (): Promise<CopilotHealth> => request<CopilotHealth>("/api/ai/health");
