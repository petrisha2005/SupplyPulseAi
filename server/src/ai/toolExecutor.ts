import type { EvidenceItem } from "./copilotSchemas.js";
import { toolMap } from "./toolMap.js";
import { validateToolRequest } from "./toolValidation.js";

export interface GeminiToolExecutionRequest {
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface GeminiToolExecutionSuccess {
  ok: true;
  tool: string;
  data: unknown;
  evidence: EvidenceItem[];
}

export interface GeminiToolExecutionFailure {
  ok: false;
  tool: string;
  error: string;
}

export type GeminiToolExecutionResult = GeminiToolExecutionSuccess | GeminiToolExecutionFailure;

export const executeGeminiTool = async (request: GeminiToolExecutionRequest): Promise<GeminiToolExecutionResult> => {
  const validation = validateToolRequest({ tool: request.toolName, arguments: request.arguments });
  if (!validation.valid || !validation.tool) {
    return {
      ok: false,
      tool: request.toolName,
      error: validation.errors?.join(" ") ?? "Invalid tool request."
    };
  }

  const tool = toolMap[validation.tool];
  if (!tool) return { ok: false, tool: request.toolName, error: "Registered tool has no executable mapping." };

  try {
    const result = await tool(request.arguments);
    return result
      ? { ok: true, tool: result.tool, data: result.data, evidence: result.evidence }
      : { ok: false, tool: validation.tool, error: "No deterministic result was found for the approved tool request." };
  } catch {
    return { ok: false, tool: validation.tool, error: "Approved tool execution failed safely." };
  }
};
