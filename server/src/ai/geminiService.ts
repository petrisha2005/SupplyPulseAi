import type { EvidenceItem } from "./copilotSchemas.js";
import { getAIConfiguration } from "./aiConfig.js";
import { type GeminiReasoningInput, type GeminiReasoningOutput, validateGeminiReasoningInput, validateGeminiReasoningOutput } from "./aiGuardrails.js";
import { getGeminiClient } from "./geminiClient.js";
import { SUPPLYPULSE_SYSTEM_PROMPT } from "./systemPrompt.js";

export interface GeminiReasoningResponse {
  answer: string;
  confidence?: number;
  citations?: EvidenceItem[];
  reasoning?: string[];
}

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "confidence", "citations", "reasoning"],
  properties: {
    answer: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    citations: { type: "array", items: { type: "string" } },
    reasoning: { type: "array", items: { type: "string" }, maxItems: 5 }
  }
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseReasoningOutput = (value: unknown): GeminiReasoningOutput | undefined => {
  if (!isRecord(value) || typeof value.answer !== "string" || !value.answer.trim()) return undefined;
  const confidence = typeof value.confidence === "number" ? value.confidence : undefined;
  const citations = Array.isArray(value.citations) && value.citations.every((item) => typeof item === "string")
    ? value.citations as string[]
    : undefined;
  const reasoning = Array.isArray(value.reasoning) && value.reasoning.every((item) => typeof item === "string")
    ? value.reasoning as string[]
    : undefined;
  return { answer: value.answer.trim(), confidence, citations, reasoning };
};

const reasoningPrompt = (input: GeminiReasoningInput) => `${SUPPLYPULSE_SYSTEM_PROMPT}

User question:
${input.question}

Approved evidence:
${JSON.stringify(input.evidence)}

Approved tool outputs:
${JSON.stringify(input.toolOutputs)}`;

const withTimeout = <T>(request: Promise<T>, timeoutMs: number): Promise<T> =>
  Promise.race([
    request,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Gemini request timed out")), timeoutMs))
  ]);

export const reasonWithGemini = async (input: GeminiReasoningInput): Promise<GeminiReasoningResponse | undefined> => {
  if (!validateGeminiReasoningInput(input)) return undefined;
  const client = getGeminiClient();
  if (!client) return undefined;

  const configuration = getAIConfiguration();
  for (let attempt = 0; attempt <= configuration.retryCount; attempt += 1) {
    try {
      const response = await withTimeout(client.models.generateContent({
        model: configuration.model,
        contents: reasoningPrompt(input),
        config: {
          temperature: configuration.temperature,
          maxOutputTokens: configuration.maxOutputTokens,
          responseMimeType: "application/json",
          responseJsonSchema: responseSchema
        }
      }), configuration.timeoutMs);
      if (!response.text) return undefined;

      const output = parseReasoningOutput(JSON.parse(response.text));
      if (!output || !validateGeminiReasoningOutput(output, input.evidence)) return undefined;
      const citedEvidence = input.evidence.filter((item) => output.citations?.includes(item.id ?? ""));
      return {
        answer: output.answer,
        confidence: output.confidence,
        citations: citedEvidence,
        reasoning: output.reasoning
      };
    } catch {
      if (attempt === configuration.retryCount) return undefined;
    }
  }
  return undefined;
};
