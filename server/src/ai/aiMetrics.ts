export interface AIMetrics {
  requestCount: number;
  geminiSuccessCount: number;
  fallbackCount: number;
  toolCallCount: number;
  averageLatencyMs: number;
}

let requestCount = 0;
let geminiSuccessCount = 0;
let fallbackCount = 0;
let toolCallCount = 0;
let totalLatencyMs = 0;

export const recordRequest = (latencyMs: number): void => {
  requestCount += 1;
  totalLatencyMs += Math.max(0, latencyMs);
};

export const recordGeminiSuccess = (): void => {
  geminiSuccessCount += 1;
};

export const recordFallback = (): void => {
  fallbackCount += 1;
};

export const recordToolCall = (count = 1): void => {
  toolCallCount += Math.max(0, count);
};

export const getMetrics = (): AIMetrics => ({
  requestCount,
  geminiSuccessCount,
  fallbackCount,
  toolCallCount,
  averageLatencyMs: requestCount ? Math.round((totalLatencyMs / requestCount) * 100) / 100 : 0
});
