const prohibitedOperationPatterns = [
    /\b(delete|update|insert|drop|alter)\s+(from|into|table|database)\b/i,
    /\bexecute\s+sql\b/i,
    /\bmodify\s+(inventory|supplier|stock)\b/i,
    /\b(create|submit|send)\s+(a\s+)?purchase\s+order\b/i,
    /\breorder(ed|ing)?\s+(products?|inventory|stock)\b/i
];
export const isApprovedEvidence = (evidence) => Boolean(evidence.source.trim() && evidence.type.trim() && evidence.summary.trim());
export const validateGeminiReasoningInput = (input) => Boolean(input.question.trim() && input.evidence.every(isApprovedEvidence));
export const containsProhibitedOperation = (text) => prohibitedOperationPatterns.some((pattern) => pattern.test(text));
export const validateGeminiReasoningOutput = (output, evidence) => {
    if (!output.answer.trim() || containsProhibitedOperation(output.answer))
        return false;
    if (output.reasoning?.some(containsProhibitedOperation))
        return false;
    if (output.confidence !== undefined && (!Number.isFinite(output.confidence) || output.confidence < 0 || output.confidence > 1))
        return false;
    const evidenceIds = new Set(evidence.map((item) => item.id).filter((id) => Boolean(id)));
    return (output.citations ?? []).every((citation) => evidenceIds.has(citation));
};
