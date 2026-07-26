export const SAFE_AI_UNAVAILABLE_MESSAGE = "AI reasoning temporarily unavailable. SupplyPulse fallback intelligence is active.";
export const normalizeAIError = (_error) => SAFE_AI_UNAVAILABLE_MESSAGE;
export const withAITimeout = (request, timeoutMs) => Promise.race([
    request,
    new Promise((_, reject) => setTimeout(() => reject(new Error("AI reasoning timed out")), timeoutMs))
]);
export const withAIRetry = async (operation, retryCount) => {
    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        try {
            return await operation();
        }
        catch (error) {
            normalizeAIError(error);
            if (attempt === retryCount)
                return undefined;
        }
    }
    return undefined;
};
