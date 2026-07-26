export const SAFE_AI_UNAVAILABLE_MESSAGE = "AI reasoning temporarily unavailable. SupplyPulse fallback intelligence is active.";

export const normalizeAIError = (_error: unknown): string => SAFE_AI_UNAVAILABLE_MESSAGE;

export const withAITimeout = <T>(request: Promise<T>, timeoutMs: number): Promise<T> =>
  Promise.race([
    request,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AI reasoning timed out")), timeoutMs))
  ]);

export const withAIRetry = async <T>(
  operation: () => Promise<T>,
  retryCount: number
): Promise<T | undefined> => {
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error("Gemini API failure:", error);
      normalizeAIError(error);
      if (attempt === retryCount) return undefined;
    }
  }
  return undefined;
};
