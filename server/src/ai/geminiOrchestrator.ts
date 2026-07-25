import type { CopilotRequest, EvidenceItem } from "./copilotSchemas.js";
import { containsProhibitedOperation, validateGeminiReasoningOutput } from "./aiGuardrails.js";
import { generateGeminiToolResultAnswer, requestGeminiToolCalls, type GeminiFunctionCall } from "./geminiService.js";
import { executeGeminiTool, type GeminiToolExecutionResult } from "./toolExecutor.js";

export interface GeminiOrchestrationResponse {
  answer: string;
  actions: [];
  evidence: EvidenceItem[];
  confidence?: number;
  reasoning?: string[];
  generatedBy: "gemini";
  toolsUsed: string[];
}

const uniqueEvidence = (evidence: EvidenceItem[]) => evidence.filter((item, index, values) =>
  values.findIndex((candidate) => candidate.source === item.source && candidate.type === item.type && candidate.id === item.id) === index
);

const executeRequestedTools = async (calls: GeminiFunctionCall[]) => {
  const executions: Array<{ call: GeminiFunctionCall; result: GeminiToolExecutionResult }> = [];
  for (const call of calls) {
    executions.push({
      call,
      result: await executeGeminiTool({ toolName: call.name, arguments: call.arguments })
    });
  }
  return executions;
};

export const orchestrateGemini = async (request: CopilotRequest): Promise<GeminiOrchestrationResponse | undefined> => {
  const initial = await requestGeminiToolCalls(request.question, request.context);
  if (!initial) return undefined;

  if (!initial.functionCalls.length) {
    const answer = initial.text?.trim();
    if (!answer || containsProhibitedOperation(answer) || !validateGeminiReasoningOutput({ answer, citations: [] }, [])) return undefined;
    return {
      answer,
      actions: [],
      evidence: [],
      generatedBy: "gemini",
      toolsUsed: []
    };
  }

  const executions = await executeRequestedTools(initial.functionCalls);
  const evidence = uniqueEvidence(executions.flatMap(({ result }) => result.ok ? result.evidence : []));
  const final = await generateGeminiToolResultAnswer({
    question: request.question,
    functionCalls: initial.functionCalls,
    executions,
    evidence
  });
  if (!final) return undefined;

  return {
    answer: final.answer,
    actions: [],
    evidence: final.citations?.length ? final.citations : evidence,
    confidence: final.confidence,
    reasoning: final.reasoning,
    generatedBy: "gemini",
    toolsUsed: executions.filter(({ result }) => result.ok).map(({ result }) => result.tool)
  };
};
