import type {
  AlertItem,
  DashboardResponse,
  ExecutiveReportResponse,
  FestivalEvent,
  ForecastCompareResponse,
  ForecastResponse,
  ForecastSummaryResponse,
  InventorySku,
  PipelineRun,
  Recommendation,
  PipelineStatus,
  PurchaseOrderResponse,
  RiskExplainResponse,
  RiskSku,
  Supplier,
  SupplierCompareResponse,
  SupplierDependenciesResponse
} from "@supplypulse/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5050";
const GET_TTL_MS = 30_000;
const getCache = new Map<string, { expiresAt: number; promise: Promise<unknown> }>();

export function invalidateApiCache() {
  getCache.clear();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const cacheKey = `${method}:${path}`;
  if (method === "GET") {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.promise as Promise<T>;
    if (cached) getCache.delete(cacheKey);
  } else {
    invalidateApiCache();
  }

  const promise = fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init
  }).then(async (response) => {
    if (!response.ok) throw new Error(`API ${response.status}: ${path}`);
    return response.json() as Promise<T>;
  });

  if (method === "GET") getCache.set(cacheKey, { promise, expiresAt: Date.now() + GET_TTL_MS });
  return promise.catch((error) => {
    if (method === "GET") getCache.delete(cacheKey);
    throw error;
  });
}

export const api = {
  dashboard: () => request<DashboardResponse>("/api/dashboard"),
  inventory: () => request<Array<RiskSku & InventorySku>>("/api/inventory"),
  risks: () => request<RiskSku[]>("/api/risks"),
  riskExplanation: (skuId: string) => request<RiskExplainResponse>(`/api/risks/${skuId}/explain`),
  forecast: (skuId: string) => request<ForecastResponse>(`/api/forecast/${skuId}`),
  forecastSummary: () => request<ForecastSummaryResponse>("/api/forecast/summary"),
  forecastCompare: (skuIds: string[]) => request<ForecastCompareResponse>(`/api/forecast/compare?skuIds=${encodeURIComponent(skuIds.join(","))}`),
  recommendations: (params?: { riskLevel?: string; category?: string; supplierId?: string; urgency?: string; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.riskLevel && params.riskLevel !== "All") search.set("riskLevel", params.riskLevel);
    if (params?.category && params.category !== "All") search.set("category", params.category);
    if (params?.supplierId && params.supplierId !== "All") search.set("supplierId", params.supplierId);
    if (params?.urgency && params.urgency !== "All") search.set("urgency", params.urgency);
    if (params?.limit) search.set("limit", String(params.limit));
    return request<Recommendation[]>(`/api/recommendations${search.size ? `?${search.toString()}` : ""}`);
  },
  recommendation: (skuId: string) => request<Recommendation>(`/api/recommendations/${skuId}`),
  suppliers: () => request<Supplier[]>("/api/suppliers"),
  supplierDependencies: (supplierId: string) => request<SupplierDependenciesResponse>(`/api/suppliers/${supplierId}/dependencies`),
  supplierCompare: (ids: string[]) => request<SupplierCompareResponse>(`/api/suppliers/compare?ids=${encodeURIComponent(ids.join(","))}`),
  events: () => request<FestivalEvent[]>("/api/events"),
  alerts: (params?: { severity?: string; status?: string; type?: string; skuId?: string; supplierId?: string; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.severity && params.severity !== "All") search.set("severity", params.severity);
    if (params?.status && params.status !== "All") search.set("status", params.status);
    if (params?.type && params.type !== "All") search.set("type", params.type);
    if (params?.skuId) search.set("skuId", params.skuId);
    if (params?.supplierId) search.set("supplierId", params.supplierId);
    if (params?.limit) search.set("limit", String(params.limit));
    return request<AlertItem[]>(`/api/alerts${search.size ? `?${search.toString()}` : ""}`);
  },
  generateAlerts: () => request<{ generatedCount: number; alerts: AlertItem[] }>("/api/alerts/generate", { method: "POST" }),
  updateAlertStatus: (alertId: string, status: "Pending" | "Actioned" | "Dismissed") => request<AlertItem>(`/api/alerts/${alertId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  pipelineStatus: () => request<PipelineStatus>("/api/pipeline/status"),
  pipelineRuns: () => request<PipelineRun[]>("/api/pipeline/runs"),
  runPipeline: () => request<PipelineRun>("/api/pipeline/run", { method: "POST" }),
  flashSale: () => request<{ enabled: boolean }>("/api/simulate/flash-sale", { method: "POST" }),
  supplierDelay: (supplierId?: string) => request<{ enabled: boolean }>("/api/simulate/supplier-delay", { method: "POST", body: JSON.stringify(supplierId ? { supplierId } : {}) }),
  channelMismatch: () => request<{ enabled: boolean }>("/api/simulate/channel-mismatch", { method: "POST" }),
  stockout: (skuId: string) => request<{ enabled: boolean }>("/api/simulate/stockout", { method: "POST", body: JSON.stringify({ skuId }) }),
  benchmark: () => request<{ mode: "CPU" | "GPU" }>("/api/simulate/benchmark", { method: "POST" }),
  reset: () => request<{ ok: boolean }>("/api/simulate/reset", { method: "POST" }),
  generatePo: (skuId: string, options?: { supplierId?: string; quantity?: number }) => request<PurchaseOrderResponse>("/api/recommendations/generate-po", { method: "POST", body: JSON.stringify({ skuId, ...options }) }),
  executiveReport: () => request<ExecutiveReportResponse>("/api/reports/executive-summary")
};

export const rupee = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export const compactRupee = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${Math.round(value / 1000)}K`;
  return rupee(value);
};
