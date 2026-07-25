import { getGeminiToolDefinition } from "./geminiTools.js";
import { getCopilotToolDefinition } from "./toolRegistry.js";
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isRegisteredToolName = (value) => Boolean(getCopilotToolDefinition(value));
const parameterSchemaFor = (tool) => getGeminiToolDefinition(tool)?.parametersJsonSchema;
export const validateToolArguments = (tool, argumentsValue) => {
    const schema = parameterSchemaFor(tool);
    if (!schema)
        return { valid: false, tool, errors: ["Tool parameter schema is unavailable."] };
    if (!isRecord(argumentsValue))
        return { valid: false, tool, errors: ["Tool arguments must be an object."] };
    const requiredArguments = schema.required ?? [];
    const missingArguments = requiredArguments.filter((argument) => typeof argumentsValue[argument] !== "string" || !argumentsValue[argument].trim());
    if (missingArguments.length)
        return { valid: false, tool, errors: [`Missing required arguments: ${missingArguments.join(", ")}.`] };
    if (schema.additionalProperties === false) {
        const allowedArguments = new Set(Object.keys(schema.properties ?? {}));
        const unknownArguments = Object.keys(argumentsValue).filter((argument) => !allowedArguments.has(argument));
        if (unknownArguments.length)
            return { valid: false, tool, errors: [`Unsupported arguments: ${unknownArguments.join(", ")}.`] };
    }
    return { valid: true, tool };
};
export const validateToolRequest = (request) => {
    if (!isRecord(request) || typeof request.tool !== "string" || !request.tool.trim()) {
        return { valid: false, errors: ["Tool request must include a tool name."] };
    }
    if (!isRegisteredToolName(request.tool)) {
        return { valid: false, errors: [`Unregistered tool: ${request.tool}.`] };
    }
    return validateToolArguments(request.tool, request.arguments ?? {});
};
