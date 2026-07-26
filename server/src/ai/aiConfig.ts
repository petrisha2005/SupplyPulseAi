const defaultModel = "gemini-3.5-flash";
const defaultTemperature = 0;
const defaultMaxOutputTokens = 4_096;
const defaultTimeoutMs = 12_000;
const defaultRetryCount = 1;
const minimumTimeoutMs = 1_000;
const minimumMaxOutputTokens = 128;

export type AIMode = "fallback" | "gemini";

export interface AIConfiguration {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  retryCount: number;
  aiMode: AIMode;
}

const configuredNumber = (value: string | undefined, fallback: number, minimum: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(minimum, parsed) : fallback;
};

export const getAIConfiguration = (): AIConfiguration => ({
  model: process.env.GEMINI_MODEL?.trim() || defaultModel,
  temperature: configuredNumber(process.env.GEMINI_TEMPERATURE, defaultTemperature, 0),
  maxOutputTokens: configuredNumber(process.env.GEMINI_MAX_OUTPUT_TOKENS, defaultMaxOutputTokens, minimumMaxOutputTokens),
  timeoutMs: configuredNumber(process.env.GEMINI_TIMEOUT_MS, defaultTimeoutMs, minimumTimeoutMs),
  retryCount: configuredNumber(process.env.GEMINI_RETRY_COUNT, defaultRetryCount, 0),
  aiMode: process.env.ENABLE_GEMINI === "true" && Boolean(getGeminiApiKey()) ? "gemini" : "fallback"
});

export const aiConfig = {
  get model() { return getAIConfiguration().model; },
  get temperature() { return getAIConfiguration().temperature; },
  get maxOutputTokens() { return getAIConfiguration().maxOutputTokens; },
  get timeoutMs() { return getAIConfiguration().timeoutMs; },
  get retryCount() { return getAIConfiguration().retryCount; },
  get aiMode() { return getAIConfiguration().aiMode; }
};

export const getGeminiApiKey = (): string | undefined => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return apiKey && apiKey !== "YOUR_API_KEY_HERE" ? apiKey : undefined;
};
