import { executiveBriefingSchema, parseExecutiveBriefing } from "./executiveSchemas.js";
import { getAIConfiguration } from "./aiConfig.js";
import { validateGeminiReasoningInput, validateGeminiReasoningOutput } from "./aiGuardrails.js";
import { getGeminiClient } from "./geminiClient.js";
import { getGeminiToolDefinitions } from "./geminiTools.js";
import { withAIRetry, withAITimeout } from "./aiReliability.js";
import { SUPPLYPULSE_SYSTEM_PROMPT } from "./systemPrompt.js";
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
};
const executiveResponseSchema = {
    type: "object",
    additionalProperties: false,
    required: ["answer", "confidence", "citations", "reasoning", "executiveBriefing"],
    properties: {
        answer: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        citations: { type: "array", items: { type: "string" } },
        reasoning: { type: "array", items: { type: "string" }, maxItems: 5 },
        executiveBriefing: executiveBriefingSchema
    }
};
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
export const parseGeminiReasoningOutput = (value) => {
    if (!isRecord(value) || typeof value.answer !== "string" || !value.answer.trim())
        return undefined;
    const confidence = typeof value.confidence === "number" ? value.confidence : undefined;
    const citations = Array.isArray(value.citations) && value.citations.every((item) => typeof item === "string")
        ? value.citations
        : undefined;
    const reasoning = Array.isArray(value.reasoning) && value.reasoning.every((item) => typeof item === "string")
        ? value.reasoning
        : undefined;
    return { answer: value.answer.trim(), confidence, citations, reasoning };
};
const parseGeminiExecutiveReasoningOutput = (value, evidence) => {
    if (!isRecord(value))
        return undefined;
    const reasoning = parseGeminiReasoningOutput(value);
    const supportedEvidenceIds = new Set(evidence.map((item) => item.id).filter((id) => Boolean(id)));
    const executiveBriefing = parseExecutiveBriefing(value.executiveBriefing, supportedEvidenceIds);
    return reasoning && executiveBriefing ? { reasoning, executiveBriefing } : undefined;
};
const reasoningPrompt = (input) => `${SUPPLYPULSE_SYSTEM_PROMPT}

User question:
${input.question}

Approved evidence:
${JSON.stringify(input.evidence)}

Approved tool outputs:
${JSON.stringify(input.toolOutputs)}`;
const generateWithRetry = async (request) => {
    const configuration = getAIConfiguration();
    return withAIRetry(() => withAITimeout(request(), configuration.timeoutMs), configuration.retryCount);
};
const toGeminiFunctionCall = (call) => typeof call.name === "string" && call.name.trim()
    ? { id: call.id, name: call.name, arguments: call.args ?? {} }
    : undefined;
const toolSelectionPrompt = (question, context) => `User question:
${question}

Optional application context:
${JSON.stringify(context ?? {})}

Use approved tools when deterministic SupplyPulse evidence is needed. Do not answer with unsupported facts.`;
export const requestGeminiToolCalls = async (question, context) => {
    const client = getGeminiClient();
    if (!client)
        return undefined;
    const configuration = getAIConfiguration();
    const response = await generateWithRetry(() => client.models.generateContent({
        model: configuration.model,
        contents: toolSelectionPrompt(question, context),
        config: {
            systemInstruction: SUPPLYPULSE_SYSTEM_PROMPT,
            temperature: configuration.temperature,
            maxOutputTokens: configuration.maxOutputTokens,
            tools: [{ functionDeclarations: getGeminiToolDefinitions() }]
        }
    }));
    if (!response)
        return undefined;
    return {
        text: response.text,
        functionCalls: (response.functionCalls ?? []).map(toGeminiFunctionCall).filter((call) => Boolean(call))
    };
};
export const generateGeminiToolResultAnswer = async ({ question, functionCalls, executions, evidence, executiveContext }) => {
    const client = getGeminiClient();
    if (!client || !validateGeminiReasoningInput({ question, evidence, toolOutputs: executions }))
        return undefined;
    const configuration = getAIConfiguration();
    const contents = [
        { role: "user", parts: [{ text: `${toolSelectionPrompt(question)}\n\nExecutive decision context:\n${JSON.stringify(executiveContext)}` }] },
        { role: "model", parts: functionCalls.map((call) => ({ functionCall: { id: call.id, name: call.name, args: call.arguments } })) },
        {
            role: "user",
            parts: executions.map(({ call, result }) => ({
                functionResponse: {
                    id: call.id,
                    name: call.name,
                    response: result.ok
                        ? { output: { data: result.data, evidence: result.evidence } }
                        : { error: result.error ?? "Approved tool execution failed." }
                }
            }))
        }
    ];
    const response = await generateWithRetry(() => client.models.generateContent({
        model: configuration.model,
        contents,
        config: {
            systemInstruction: SUPPLYPULSE_SYSTEM_PROMPT,
            temperature: configuration.temperature,
            maxOutputTokens: configuration.maxOutputTokens,
            responseMimeType: "application/json",
            responseJsonSchema: executiveResponseSchema
        }
    }));
    if (!response?.text)
        return undefined;
    try {
        const output = parseGeminiExecutiveReasoningOutput(JSON.parse(response.text), evidence);
        if (!output || !validateGeminiReasoningOutput(output.reasoning, evidence))
            return undefined;
        return {
            answer: output.reasoning.answer,
            confidence: output.reasoning.confidence,
            citations: evidence.filter((item) => output.reasoning.citations?.includes(item.id ?? "")),
            reasoning: output.reasoning.reasoning,
            executiveBriefing: output.executiveBriefing
        };
    }
    catch {
        return undefined;
    }
};
export const reasonWithGemini = async (input) => {
    if (!validateGeminiReasoningInput(input))
        return undefined;
    const client = getGeminiClient();
    if (!client)
        return undefined;
    const configuration = getAIConfiguration();
    const response = await generateWithRetry(() => client.models.generateContent({
        model: configuration.model,
        contents: reasoningPrompt(input),
        config: {
            temperature: configuration.temperature,
            maxOutputTokens: configuration.maxOutputTokens,
            responseMimeType: "application/json",
            responseJsonSchema: responseSchema
        }
    }));
    if (!response?.text)
        return undefined;
    try {
        const output = parseGeminiReasoningOutput(JSON.parse(response.text));
        if (!output || !validateGeminiReasoningOutput(output, input.evidence))
            return undefined;
        return {
            answer: output.answer,
            confidence: output.confidence,
            citations: input.evidence.filter((item) => output.citations?.includes(item.id ?? "")),
            reasoning: output.reasoning
        };
    }
    catch {
        return undefined;
    }
};
