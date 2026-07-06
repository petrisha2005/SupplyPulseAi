import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  Copy,
  Cpu,
  FileDown,
  FileText,
  Gauge,
  HelpCircle,
  Home,
  Moon,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Sun,
  Truck,
  X
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { AlertItem, DashboardResponse, FestivalEvent, ForecastResponse, PipelineRun, PipelineStatus, PurchaseOrderResponse, Recommendation, RiskSku, Supplier, SupplierCompareResponse, SupplierDependenciesResponse } from "@supplypulse/shared";
import { api, compactRupee, rupee } from "./lib/api";
import { Badge, Card, Empty, Loading, Stat } from "./components/ui";
import { Dashboard as MorningDashboard } from "./pages/Dashboard";
import { Landing } from "./pages/Landing";
import { getVisibleMarketplaceChannels, MultiChannelBadge } from "./components/ChannelBadge";
import { formatStockCover, getStockCoverHint, stockCoverToneClass } from "./utils/formatters";

type Page = "landing" | "dashboard" | "inventory" | "risks" | "forecast" | "recommendations" | "suppliers" | "events" | "acceleration" | "pipeline" | "alerts" | "reports";

const nav: Array<{ id: Page; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "risks", label: "Risk Scores", icon: AlertTriangle },
  { id: "forecast", label: "Forecasting", icon: BarChart3 },
  { id: "recommendations", label: "AI Reorder", icon: Sparkles },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "events", label: "Sale Calendar", icon: CalendarDays },
  { id: "acceleration", label: "Acceleration", icon: Cpu },
  { id: "pipeline", label: "Pipeline", icon: Activity },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "reports", label: "Reports", icon: FileDown }
];

const pageCopy: Record<Exclude<Page, "landing">, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Monitor stockout risk, revenue exposure, and today's reorder priorities." },
  inventory: { title: "Inventory", subtitle: "Inspect SKU coverage, channel stock, supplier lead times, and live risk status." },
  risks: { title: "Risk Scores", subtitle: "Prioritize SKUs by explainable stockout risk and revenue exposure." },
  forecast: { title: "Forecasting", subtitle: "Predict SKU demand using sales history, channel trends, and sale-event multipliers." },
  recommendations: { title: "AI Reorder", subtitle: "Turn risk signals into supplier-ready reorder actions and draft purchase orders." },
  suppliers: { title: "Suppliers", subtitle: "Compare supplier reliability, dependency exposure, and delay impact." },
  events: { title: "Sale Calendar", subtitle: "Track festival and campaign multipliers before demand spikes hit inventory." },
  acceleration: { title: "Acceleration", subtitle: "Compare CPU and GPU pipeline speed for faster morning decisions." },
  pipeline: { title: "Pipeline", subtitle: "Review ingestion, fusion, forecast, risk scoring, and alert generation status." },
  alerts: { title: "Alerts", subtitle: "Triage critical stockout, supplier, and channel mismatch alerts." },
  reports: { title: "Reports", subtitle: "Export a clean executive view of risk, reorder actions, suppliers, and pipeline performance." }
};

const riskColors: Record<string, string> = { Low: "#0F9F8A", Medium: "#D97706", High: "#D97706", Critical: "#DC2626" };

function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    setData(null);
    setError("");
    loader().then((value) => mounted && setData(value)).catch((err) => mounted && setError(err instanceof Error ? err.message : "Unable to load SupplyPulse data."));
    return () => {
      mounted = false;
    };
  }, deps);
  return { data, error };
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export function App() {
  const [page, setPage] = useState<Page>("landing");
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const Active = useMemo(() => pages[page], [page]);
  const currentPageCopy = page === "landing" ? null : pageCopy[page];

  if (page === "landing") {
    return <Landing setPage={setPage} />;
  }

  return (
    <div className="app-shell min-h-screen bg-[#F7F1E8] text-[#1F160F] dark:bg-[#1F160F] dark:text-[#FFFDF8]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(15,159,138,0.14),rgba(247,241,232,0)_64%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(15,159,138,0.14),rgba(31,22,15,0)_64%)]" />
      </div>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 p-4 lg:block">
        <div className="h-full rounded-[1.75rem] border border-[#E5D8C8]/85 bg-[#FFFDF8]/78 p-4 shadow-2xl shadow-[#2A1A12]/10 backdrop-blur-2xl dark:border-white/10 dark:bg-[#2A1A12]/75">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#1F160F] text-lg font-black text-[#FFFDF8] shadow-xl shadow-[#2A1A12]/20 [transform:rotateX(12deg)_rotateY(-16deg)]">SP</div>
          <div>
            <h1 className="font-black">SupplyPulse AI</h1>
            <p className="text-xs font-semibold text-[#6B5B4A] dark:text-[#DED0BD]">Inventory risk cockpit</p>
          </div>
        </div>
        <nav className="space-y-1.5">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} className={`flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-left text-sm font-bold transition ${page === item.id ? "bg-[#DDF8F1] text-[#0D9488] shadow-lg shadow-teal-900/10 ring-1 ring-teal-200/70 dark:bg-teal-950 dark:text-teal-100 dark:ring-teal-800" : "text-[#6B5B4A] hover:bg-[#FFFDF8]/75 hover:text-[#1F160F] dark:text-[#DED0BD] dark:hover:bg-[#2A1A12]"}`}>
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
        </div>
      </aside>
      <main className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-10 px-4 py-4 backdrop-blur sm:px-6">
          <div className="rounded-[1.5rem] border border-[#E5D8C8]/85 bg-[#FFFDF8]/78 px-4 py-4 shadow-xl shadow-[#2A1A12]/10 backdrop-blur-2xl dark:border-white/10 dark:bg-[#2A1A12]/80">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <select className="rounded-full border border-[#DED0BD] bg-[#FFFDF8]/80 px-3 py-2 text-sm font-bold text-[#1F160F] shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:hidden" value={page} onChange={(event) => setPage(event.target.value as Page)}>
              {nav.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">SUPPLYPULSE AI</p>
              <h2 className="mt-1 text-2xl font-black tracking-normal text-[#1F160F] dark:text-white">{currentPageCopy?.title}</h2>
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[#6B5B4A] dark:text-[#DED0BD]">{currentPageCopy?.subtitle}</p>
            </div>
            <button title="Toggle theme" onClick={() => setDark(!dark)} className="rounded-full border border-[#DED0BD] bg-[#FFFDF8]/70 p-2.5 text-[#1F160F] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#DDF8F1] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          </div>
        </header>
        <div className="px-4 pb-8 pt-2 sm:px-6">
          <Active notify={notify} setPage={setPage} />
        </div>
      </main>
      {toast && <div className="fixed bottom-5 right-5 z-30 rounded-2xl bg-[#1F160F] px-4 py-3 text-sm font-bold text-[#FFFDF8] shadow-2xl shadow-[#2A1A12]/25 dark:bg-white dark:text-slate-950">{toast}</div>}
    </div>
  );
}

function DashboardPage() {
  const { data, error } = useLoad(api.dashboard);
  if (error) return <Empty text={error} />;
  if (!data) return <Loading />;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Total SKUs" value={data.totalSkus} />
        <Stat label="High-risk SKUs" value={data.highRiskSkus} tone="red" />
        <Stat label="Revenue at risk" value={rupee(data.revenueAtRisk)} tone="orange" />
        <Stat label="Forecast accuracy" value={`${data.forecastAccuracy}%`} tone="green" />
        <Stat label="Next refresh" value={`${Math.round(data.nextRefreshSeconds / 60)} min`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <h3 className="font-bold">Pipeline status</h3>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{data.pipelineStatus}</p>
          <p className="mt-2 text-sm text-slate-500">Last refresh: {new Date(data.lastRefreshTime).toLocaleString()}</p>
        </Card>
        <Card>
          <h3 className="mb-4 font-bold">Risk distribution</h3>
          <ChartBox>
            <PieChart>
              <Pie data={data.riskDistribution} dataKey="count" nameKey="level" outerRadius={96} label>
                {data.riskDistribution.map((item) => <Cell key={item.level} fill={riskColors[item.level]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartBox>
        </Card>
      </div>
    </div>
  );
}

function InventoryPage() {
  const { data, error } = useLoad(api.inventory);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [risk, setRisk] = useState("All");
  const [supplier, setSupplier] = useState("All");
  if (error) return <Empty text={`Inventory unavailable. ${error}`} />;
  if (!data) return <Loading />;
  const filtered = data.filter((sku) =>
    (category === "All" || sku.category === category) &&
    (risk === "All" || sku.riskLevel === risk) &&
    (supplier === "All" || sku.supplierName === supplier) &&
    `${sku.skuId} ${sku.productName}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="space-y-4">
      <Filters query={query} setQuery={setQuery} category={category} setCategory={setCategory} risk={risk} setRisk={setRisk} supplier={supplier} setSupplier={setSupplier} data={data} />
      <Table rows={filtered} />
    </div>
  );
}

function RisksPage() {
  const { data, error } = useLoad(api.risks);
  if (error) return <Empty text={`Risk scores unavailable. ${error}`} />;
  if (!data) return <Loading />;
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <Card>
        <h3 className="mb-4 font-bold">Risk heatmap</h3>
        <div className="grid grid-cols-5 gap-2">
          {data.map((sku) => <button key={sku.skuId} title={`${sku.skuId} ${sku.riskScore}`} className="h-12 rounded-md text-xs font-bold text-white" style={{ backgroundColor: riskColors[sku.riskLevel] }}>{sku.riskScore}</button>)}
        </div>
      </Card>
      <Card>
        <h3 className="mb-4 font-bold">Top 10 at-risk SKUs</h3>
        <div className="space-y-3">
          {data.slice(0, 10).map((sku) => (
            <div key={sku.skuId} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-semibold">{sku.productName}</p><p className="text-xs text-slate-500">{sku.skuId}</p></div>
                <Badge level={sku.riskLevel}>{sku.riskLevel} {sku.riskScore}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{sku.riskReason}</p>
              <p className="mt-1 text-sm font-semibold text-orange-600">Revenue at risk: {rupee(sku.revenueAtRisk)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ForecastPage() {
  const inventory = useLoad(api.inventory);
  const summary = useLoad(api.forecastSummary);
  const [skuId, setSkuId] = useState("");
  const [query, setQuery] = useState("");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastError, setForecastError] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareForecasts, setCompareForecasts] = useState<ForecastResponse[]>([]);
  useEffect(() => {
    if (inventory.data?.length && !skuId) setSkuId(inventory.data[0].skuId);
  }, [inventory.data, skuId]);

  useEffect(() => {
    if (!skuId) return;
    let mounted = true;
    setForecast(null);
    setForecastError("");
    api.forecast(skuId)
      .then((value) => mounted && setForecast(value))
      .catch((err) => mounted && setForecastError(err instanceof Error ? err.message : "Unable to load forecast"));
    return () => {
      mounted = false;
    };
  }, [skuId]);

  useEffect(() => {
    if (!compareIds.length) {
      setCompareForecasts([]);
      return;
    }
    let mounted = true;
    api.forecastCompare(compareIds)
      .then((value) => mounted && setCompareForecasts(value.forecasts))
      .catch(() => mounted && setCompareForecasts([]));
    return () => {
      mounted = false;
    };
  }, [compareIds]);

  if (inventory.error || summary.error) return <Empty text={`Forecast data unavailable. ${inventory.error || summary.error}`} />;
  if (!inventory.data || !summary.data || (!forecast && !forecastError)) return <Loading />;
  if (forecastError || !forecast) return <Empty text={forecastError || "Forecast unavailable."} />;

  const filteredSkus = inventory.data.filter((sku) => `${sku.skuId} ${sku.productName} ${sku.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 60);
  const historicalSeries = (forecast.historicalDailySales ?? forecast.historical ?? []).slice(-30).map((point) => ({ date: point.date, historical: point.units }));
  const forecastSeries = (forecast.forecastNext30Days ?? forecast.next30DaysDemand ?? []).map((point) => ({ date: point.date, forecast: point.units }));
  const combined = [...historicalSeries, ...forecastSeries];
  const channelSplit = forecast.channelDemandSplit ?? (forecast.channelDemand ?? []).map((item) => ({
    channel: item.channel,
    sharePct: Math.round((item.demand / Math.max(1, forecast.totalForecastDemand30d ?? item.demand)) * 100),
    avgUnitsPerDay: Math.round(item.demand / 30),
    trendPct: 0
  }));
  const explanation = forecast.forecastExplanation;
  const selectedCompare = new Set(compareIds);
  const toggleCompare = (id: string) => {
    setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  };
  const confidenceTone = forecast.confidenceLabel === "High" ? "green" : forecast.confidenceLabel === "Low" ? "orange" : undefined;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="7-day forecast demand" value={summary.data.totalForecastDemand7d.toLocaleString("en-IN")} />
        <Stat label="30-day forecast demand" value={summary.data.totalForecastDemand30d.toLocaleString("en-IN")} tone="orange" />
        <Stat label="Rising SKUs" value={summary.data.risingSkuCount} tone="green" />
        <Stat label="Event impacted SKUs" value={summary.data.eventImpactedSkuCount} tone="orange" />
      </div>

      <Card className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h3 className="font-bold">Forecast Explorer</h3>
          <p className="mt-1 text-sm text-slate-500">Search SKUs, inspect 30-day demand, and compare up to 3 forecast profiles.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
          <label className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SKU, product, category" className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <select value={skuId} onChange={(event) => setSkuId(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
            {filteredSkus.map((sku) => <option key={sku.skuId} value={sku.skuId}>{sku.skuId} - {sku.productName}</option>)}
          </select>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Stat label="Selected 7-day demand" value={(forecast.totalForecastDemand7d ?? 0).toLocaleString("en-IN")} />
        <Stat label="Selected 30-day demand" value={(forecast.totalForecastDemand30d ?? 0).toLocaleString("en-IN")} />
        <Stat label="Avg daily forecast" value={`${forecast.avgDailyForecast ?? 0} units`} />
        <Stat label="Confidence" value={`${forecast.confidenceScore}% ${forecast.confidenceLabel ?? ""}`} tone={confidenceTone} />
        <Stat label="Reorder window" value={forecast.reorderWindow ?? "Monitor"} tone={forecast.reorderWindow === "Reorder now" ? "orange" : undefined} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold">Historical vs forecast</h3>
              <p className="text-sm text-slate-500">{forecast.productName} · {forecast.skuId}</p>
            </div>
            <Badge level={forecast.trendDirection === "Rising" ? "High" : forecast.trendDirection === "Falling" ? "Medium" : "Low"}>{forecast.trendDirection ?? "Stable"}</Badge>
          </div>
          <ChartBox>
            <LineChart data={combined}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" hide />
              <YAxis />
              <Tooltip />
              <Line dataKey="historical" stroke="#0f766e" dot={false} strokeWidth={2} />
              <Line dataKey="forecast" stroke="#f97316" dot={false} strokeWidth={2} />
            </LineChart>
          </ChartBox>
        </Card>
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">Channel demand split</h3>
            {forecast.festivalImpact && <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-200">{forecast.festivalImpact.eventName} · {forecast.festivalImpact.multiplier}x</span>}
          </div>
          <ChartBox>
            <BarChart data={channelSplit}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="channel" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgUnitsPerDay" fill="#0f766e" name="Avg units/day" />
            </BarChart>
          </ChartBox>
        </Card>
        <Card>
          <h3 className="mb-4 font-bold">Forecast explanation</h3>
          <p className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-900 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-100">{explanation?.summary ?? "Forecast explanation unavailable."}</p>
          {explanation && (
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p><span className="font-semibold">7-day avg:</span> {explanation.formulaBreakdown.recent7dAvg} units/day</p>
              <p><span className="font-semibold">28-day baseline:</span> {explanation.formulaBreakdown.baseline28dAvg} units/day</p>
              <p><span className="font-semibold">Weekday avg:</span> {explanation.formulaBreakdown.sameWeekdayAvg} units/day</p>
              <p><span className="font-semibold">Trend adjustment:</span> {explanation.formulaBreakdown.trendAdjustment}x</p>
              <p><span className="font-semibold">Event multiplier:</span> {explanation.formulaBreakdown.eventMultiplier}x</p>
              <p><span className="font-semibold">Final daily forecast:</span> {explanation.formulaBreakdown.finalAvgDailyForecast} units</p>
            </div>
          )}
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{explanation?.confidenceReason}</p>
        </Card>
        <Card>
          <h3 className="mb-4 font-bold">Compare SKUs</h3>
          <div className="flex flex-wrap gap-2">
            {filteredSkus.slice(0, 12).map((sku) => (
              <button key={sku.skuId} onClick={() => toggleCompare(sku.skuId)} disabled={!selectedCompare.has(sku.skuId) && compareIds.length >= 3} className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${selectedCompare.has(sku.skuId) ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-100" : "border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>
                {sku.skuId}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {compareForecasts.length ? compareForecasts.map((item) => (
              <div key={item.skuId} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{item.productName}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">{item.confidenceScore}%</span>
                </div>
                <p className="mt-1 text-slate-500">{item.skuId} · {item.trendDirection} · {item.totalForecastDemand30d} units / 30d</p>
              </div>
            )) : <Empty text="Select up to 3 SKUs to compare." />}
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <h3 className="mb-4 font-bold">Revenue at risk projection</h3>
          <ChartBox>
            <AreaChart data={forecast.revenueAtRiskSeries ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area dataKey="revenueAtRisk" stroke="#ef4444" fill="#fecaca" />
            </AreaChart>
          </ChartBox>
        </Card>
      </div>
    </div>
  );
}

function RecommendationsPage({ notify, setPage }: { notify: (message: string) => void; setPage: (page: Page) => void }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [urgency, setUrgency] = useState("All");
  const [category, setCategory] = useState("All");
  const [supplierId, setSupplierId] = useState("All");
  const [riskLevel, setRiskLevel] = useState("All");
  const [expandedSkuId, setExpandedSkuId] = useState("");
  const [po, setPo] = useState<PurchaseOrderResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    api.recommendations({ urgency, category, supplierId, riskLevel })
      .then((value) => mounted && setRecommendations(value))
      .catch((err) => mounted && setError(err instanceof Error ? err.message : "Unable to load recommendations."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [urgency, category, supplierId, riskLevel]);

  if (loading) return <Loading />;
  if (error) return <Empty text={`Recommendations unavailable. ${error}`} />;

  const urgentCount = recommendations.filter((rec) => rec.urgency === "Immediate" || rec.urgencyLevel === "Critical").length;
  const revenueProtected = recommendations.reduce((sum, rec) => sum + (rec.revenueProtected ?? rec.revenueSavedEstimate), 0);
  const totalPoValue = recommendations.reduce((sum, rec) => sum + (rec.estimatedPOValue ?? 0), 0);
  const suppliers = Array.from(new Map(recommendations.map((rec) => [rec.recommendedSupplier?.supplierId ?? rec.bestSupplier, rec.recommendedSupplier])).entries());
  const categories = ["All", ...Array.from(new Set(recommendations.map((rec) => rec.category).filter(Boolean))) as string[]];
  const supplierOptions = ["All", ...suppliers.map(([id]) => id)];

  const draftPo = async (rec: Recommendation) => {
    const result = await api.generatePo(rec.skuId);
    setPo(result);
    notify(`Draft ${result.poNumber} generated`);
  };

  const copyText = async (text: string, message: string) => {
    await copyToClipboard(text);
    notify(message);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Urgent recommendations" value={urgentCount} tone="orange" />
        <Stat label="Revenue protected" value={compactRupee(revenueProtected)} tone="green" />
        <Stat label="Total PO value" value={compactRupee(totalPoValue)} />
        <Stat label="Suppliers involved" value={suppliers.length} />
      </div>

      <Card className="grid gap-3 md:grid-cols-4">
        <Select value={urgency} onChange={setUrgency} options={["All", "Immediate", "Within 24 hours", "This week", "Monitor"]} />
        <Select value={category} onChange={setCategory} options={categories} />
        <Select value={supplierId} onChange={setSupplierId} options={supplierOptions} />
        <Select value={riskLevel} onChange={setRiskLevel} options={["All", "Low", "Medium", "High", "Critical"]} />
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {recommendations.map((rec) => {
          const isExpanded = expandedSkuId === rec.skuId;
          const supplier = rec.recommendedSupplier;
          return (
            <Card key={rec.recommendationId ?? rec.skuId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{rec.productName}</h3>
                  <p className="text-sm text-slate-500">{rec.skuId} · {rec.category}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge level={rec.urgencyLevel}>{rec.urgency ?? rec.urgencyLevel}</Badge>
                  <Badge level={rec.riskLevel ?? rec.urgencyLevel}>Risk {rec.riskScore ?? "-"}</Badge>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p><span className="font-semibold">Quantity:</span> {rec.recommendedQuantity} units</p>
                <p><span className="font-semibold">Supplier:</span> {supplier?.name ?? rec.bestSupplier}</p>
                <p><span className="font-semibold">Deadline:</span> {rec.reorderDeadlineLabel ?? "This week"}</p>
                <p><span className="font-semibold">Revenue protected:</span> <span className="text-emerald-600 dark:text-emerald-300">{compactRupee(rec.revenueProtected ?? rec.revenueSavedEstimate)}</span></p>
              </div>
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-200">{rec.reasoning}</p>
              {isExpanded && (
                <div className="mt-4 grid gap-3 text-sm lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="font-bold">Why this recommendation</p>
                    <ul className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
                      {(rec.reasonBullets ?? []).map((reason) => <li key={reason}>• {reason}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="font-bold">Supplier ranking</p>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">{supplier?.reason}</p>
                    {rec.alternateSupplier && <p className="mt-2 text-slate-600 dark:text-slate-300">Backup: {rec.alternateSupplier.name} · {rec.alternateSupplier.avgLeadDays} days · {rec.alternateSupplier.reliabilityScore}% reliability</p>}
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => draftPo(rec)} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-500"><FileText size={15} /> Draft PO</button>
                <button onClick={() => copyText(rec.whatsappMessage, "WhatsApp supplier message copied")} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Copy size={15} /> Copy WhatsApp</button>
                <button onClick={() => setPage("inventory")} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">View SKU</button>
                <button onClick={() => setExpandedSkuId(isExpanded ? "" : rec.skuId)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><HelpCircle size={15} /> Explain</button>
              </div>
            </Card>
          );
        })}
      </div>

      {!recommendations.length && <Empty text="No recommendations match these filters." />}
      {po && <PoDraftModal po={po} onClose={() => setPo(null)} onCopy={copyText} />}
    </div>
  );
}

function PoDraftModal({ po, onClose, onCopy }: { po: PurchaseOrderResponse; onClose: () => void; onCopy: (text: string, message: string) => void }) {
  const draft = po.purchaseOrderDraft;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">{po.poNumber}</p>
            <h3 className="text-xl font-bold">{draft.title}</h3>
            <p className="text-sm text-slate-500">{draft.supplierName} · {draft.supplierCity}</p>
          </div>
          <button onClick={onClose} className="rounded-md border border-slate-200 px-3 py-1 text-sm font-semibold dark:border-slate-700">Close</button>
        </div>
        <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <p><span className="font-semibold">SKU:</span> {draft.skuId}</p>
          <p><span className="font-semibold">Product:</span> {draft.productName}</p>
          <p><span className="font-semibold">Quantity:</span> {draft.quantity} units</p>
          <p><span className="font-semibold">Unit cost:</span> {rupee(draft.unitCost)}</p>
          <p><span className="font-semibold">Estimated total:</span> {rupee(draft.estimatedTotalValue)}</p>
          <p><span className="font-semibold">Deadline:</span> {draft.requestedDispatchDeadline}</p>
        </div>
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 dark:bg-slate-950">{draft.note}</p>
        <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-500">WhatsApp-ready message</p>
          <p className="mt-2 text-sm leading-6">{po.whatsappMessage}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => onCopy(po.copyReadyText, "Purchase order draft copied")} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"><Copy size={15} /> Copy PO</button>
          <button onClick={() => onCopy(po.whatsappMessage, "WhatsApp message copied")} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Copy size={15} /> Copy WhatsApp</button>
        </div>
      </section>
    </div>
  );
}

function SuppliersPage({ notify, setPage }: { notify: (message: string) => void; setPage: (page: Page) => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dependencies, setDependencies] = useState<SupplierDependenciesResponse | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<SupplierCompareResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    setError("");
    try {
      setSuppliers(await api.suppliers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
  }, []);

  useEffect(() => {
    if (!compareIds.length) {
      setComparison(null);
      return;
    }
    let mounted = true;
    api.supplierCompare(compareIds).then((value) => mounted && setComparison(value)).catch(() => mounted && setComparison(null));
    return () => {
      mounted = false;
    };
  }, [compareIds]);

  if (loading) return <Loading />;
  if (error) return <Empty text={`Supplier scorecards unavailable. ${error}`} />;

  const riskyCount = suppliers.filter((supplier) => ["Risky", "Critical"].includes(supplier.supplierRiskLevel ?? "")).length;
  const avgOnTime = suppliers.length ? Math.round(suppliers.reduce((sum, supplier) => sum + (supplier.onTimeDeliveryPct ?? 0), 0) / suppliers.length) : 0;
  const revenueLinked = suppliers.reduce((sum, supplier) => sum + (supplier.totalRevenueAtRiskLinked ?? 0), 0);
  const toggleCompare = (supplier: Supplier) => {
    const id = supplier.supplierId ?? supplier.id;
    setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  };
  const viewDependencies = async (supplier: Supplier) => {
    const id = supplier.supplierId ?? supplier.id;
    setDependencies(await api.supplierDependencies(id));
  };
  const simulateDelay = async (supplier: Supplier) => {
    setBusy(true);
    try {
      await api.supplierDelay(supplier.supplierId ?? supplier.id);
      await loadSuppliers();
      notify(`${supplier.name} delay simulated. Supplier scorecards refreshed.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total suppliers" value={suppliers.length} />
        <Stat label="Risky suppliers" value={riskyCount} tone={riskyCount ? "orange" : "green"} />
        <Stat label="Avg on-time delivery" value={`${avgOnTime}%`} tone={avgOnTime >= 90 ? "green" : "orange"} />
        <Stat label="Revenue linked to suppliers" value={compactRupee(revenueLinked)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-4">
          {suppliers.map((supplier) => {
            const id = supplier.supplierId ?? supplier.id;
            const selected = compareIds.includes(id);
            const badgeLevel = supplier.supplierRiskLevel === "Critical" ? "Critical" : supplier.supplierRiskLevel === "Risky" ? "High" : supplier.supplierRiskLevel === "Watch" ? "Medium" : "Low";
            return (
              <Card key={id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{supplier.name}</h3>
                    <p className="text-sm text-slate-500">{supplier.city} · {supplier.productsSupplied.join(", ")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge level={badgeLevel}>{supplier.supplierRiskLevel ?? "Healthy"} {supplier.supplierRiskScore ?? 0}</Badge>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{supplier.serviceHealthLabel}</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                  <InfoLine label="Lead time" value={`${supplier.avgLeadDays ?? supplier.averageLeadTime} days`} />
                  <InfoLine label="On-time" value={`${supplier.onTimeDeliveryPct ?? 0}%`} />
                  <InfoLine label="Reliability" value={`${supplier.reliabilityScore}%`} />
                  <InfoLine label="Last delay" value={`${supplier.lastDelayDays ?? 0} days`} />
                  <InfoLine label="Critical SKUs" value={supplier.criticalSkusDependent ?? 0} />
                  <InfoLine label="High-risk SKUs" value={supplier.highRiskSkusDependent ?? 0} />
                  <InfoLine label="Revenue linked" value={compactRupee(supplier.totalRevenueAtRiskLinked ?? 0)} />
                  <InfoLine label="Best use" value={supplier.recommendedUsage ?? "Planned replenishment"} />
                </div>
                <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-200">{supplier.supplierInsight}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => viewDependencies(supplier)} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">View dependencies</button>
                  <button onClick={() => toggleCompare(supplier)} className={`rounded-md border px-3 py-2 text-sm font-bold ${selected ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-100" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"}`}>{selected ? "Remove compare" : "Compare"}</button>
                  <button onClick={() => simulateDelay(supplier)} disabled={busy} className="rounded-md border border-orange-200 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50 disabled:cursor-wait disabled:opacity-60 dark:border-orange-900 dark:text-orange-300 dark:hover:bg-orange-950">Simulate delay</button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card>
          <h3 className="font-bold">Supplier comparison</h3>
          <p className="mt-1 text-sm text-slate-500">Select up to 3 suppliers to compare lead time, reliability, cost, and risk.</p>
          {comparison ? (
            <div className="mt-4 space-y-3">
              {comparison.suppliers.map((supplier) => (
                <div key={supplier.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{supplier.name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">Risk {supplier.supplierRiskScore}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                    <p>Lead: {supplier.avgLeadDays} days</p>
                    <p>On-time: {supplier.onTimeDeliveryPct}%</p>
                    <p>Reliability: {supplier.reliabilityScore}%</p>
                    <p>Cost: {supplier.costRating}/5</p>
                  </div>
                  <p className="mt-2 font-semibold text-teal-700 dark:text-teal-300">{supplier.recommendedUsage}</p>
                </div>
              ))}
              <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100">
                <p><span className="font-bold">Urgent reorder:</span> {comparison.bestForUrgentReorder?.name}</p>
                <p><span className="font-bold">Lowest cost:</span> {comparison.lowestCostSupplier?.name}</p>
                <p><span className="font-bold">Highest reliability:</span> {comparison.highestReliabilitySupplier?.name}</p>
              </div>
            </div>
          ) : <Empty text="Choose suppliers to compare." />}
        </Card>
      </div>

      {dependencies && <SupplierDependenciesModal dependencies={dependencies} onClose={() => setDependencies(null)} onViewSku={() => setPage("inventory")} onGeneratePo={async (skuId, supplierId) => { const po = await api.generatePo(skuId, { supplierId }); notify(`Draft ${po.poNumber} generated`); }} />}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function SupplierDependenciesModal({
  dependencies,
  onClose,
  onViewSku,
  onGeneratePo
}: {
  dependencies: SupplierDependenciesResponse;
  onClose: () => void;
  onViewSku: () => void;
  onGeneratePo: (skuId: string, supplierId: string) => void;
}) {
  const supplierId = dependencies.supplier.supplierId ?? dependencies.supplier.id;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <section className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Supplier dependencies</p>
            <h3 className="text-xl font-bold">{dependencies.supplier.name}</h3>
            <p className="text-sm text-slate-500">{dependencies.supplier.city} · Risk {dependencies.supplier.supplierRiskScore} · {dependencies.supplier.serviceHealthLabel}</p>
          </div>
          <button title="Close panel" onClick={onClose} className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <InfoLine label="Revenue at risk" value={compactRupee(dependencies.totalDependencyRevenueAtRisk)} />
          <InfoLine label="Critical dependencies" value={dependencies.criticalDependencyCount} />
          <InfoLine label="Recommended usage" value={dependencies.supplier.recommendedUsage ?? "Planned replenishment"} />
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr>{["SKU", "Risk", "Revenue at risk", "Stockout", "Recommended qty", "Actions"].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr></thead>
            <tbody>
              {dependencies.skus.map((sku) => (
                <tr key={sku.skuId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-3"><p className="font-bold">{sku.productName}</p><p className="text-xs text-slate-500">{sku.skuId} · {sku.category}</p></td>
                  <td className="px-3 py-3"><Badge level={sku.riskLevel}>{sku.riskLevel} {sku.riskScore}</Badge></td>
                  <td className="px-3 py-3 font-semibold">{compactRupee(sku.revenueAtRisk)}</td>
                  <td className="px-3 py-3">{sku.expectedStockoutLabel ?? sku.expectedStockoutDate ?? "Not projected"}</td>
                  <td className="px-3 py-3">{sku.recommendedQuantity ?? 0} units</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button onClick={onViewSku} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold dark:border-slate-700">View SKU</button>
                      <button onClick={() => onGeneratePo(sku.skuId, supplierId)} className="rounded-md bg-teal-600 px-2 py-1 text-xs font-bold text-white">Generate PO</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function EventsPage() {
  const { data, error } = useLoad(api.events);
  if (error) return <Empty text={`Sale calendar unavailable. ${error}`} />;
  if (!data) return <Loading />;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.map((event) => <Card key={event.id}><h3 className="font-bold">{event.name}</h3><p className="mt-1 text-sm text-slate-500">{event.date} · {event.daysAway} days away</p><p className="mt-3 text-2xl font-bold text-orange-600">{event.multiplier}x demand</p><p className="mt-2 text-sm">{event.channels.join(", ")}</p></Card>)}</div>;
}

function AccelerationPage() {
  const runtimeReduction = Math.round(((47.3 - 4.2) / 47.3) * 100);
  const pipelineSteps = ["Marketplace data", "Data cleaning", "Inventory fusion", "Forecasting", "Risk scoring", "AI reorder", "Alerts/report"];
  const matterCards = [
    {
      title: "Faster refresh cycles",
      metric: "30-minute refresh ready",
      text: "Risk scores can refresh frequently without slowing the dashboard, so teams can review fresh inventory decisions before supplier calls."
    },
    {
      title: "Faster flash-sale response",
      metric: "Demand spikes to alerts",
      text: "Demand spikes can trigger reorder alerts before stock runs out, giving the operations team time to order, transfer, or switch suppliers."
    },
    {
      title: "Scales to larger catalogs",
      metric: "Thousands of SKUs",
      text: "The same pipeline can support thousands of SKUs and historical sales records without turning the morning dashboard into a waiting room."
    }
  ];
  const architectureSteps = ["Marketplace data", "GPU-accelerated processing", "Forecast update", "Risk scoring", "Reorder recommendation", "Alerts/report"];

  return (
    <div className="acceleration-page space-y-5">
      <section className="accel-hero overflow-hidden rounded-[1.7rem] border border-[#E5D8C8] bg-[#FFFDF8] p-6 shadow-2xl shadow-[#2A1A12]/10">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#0D9488]">SUPPLYPULSE AI</p>
            <h1 className="mt-2 text-4xl font-black tracking-normal text-[#1F160F]">Acceleration Engine</h1>
            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#6B5B4A]">GPU-accelerated pipeline simulation for faster SKU risk scoring, demand forecasting, and reorder decisions.</p>
            <span className="accel-pulse mt-5 inline-flex items-center gap-2 rounded-full border border-[#DDF8F1] bg-[#E6FFFA] px-4 py-2 text-sm font-black text-[#0D9488]"><Sparkles size={16} /> 11.3x faster decision loop</span>
          </div>
          <div className="rounded-[1.4rem] border border-[#DDF8F1] bg-[#E6FFFA] p-5 shadow-xl shadow-teal-900/10">
            <p className="text-xs font-black uppercase tracking-wide text-[#0D9488]">Morning decision window</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#FFFDF8] p-4"><p className="text-xs font-black uppercase text-[#7A6A58]">CPU baseline</p><p className="mt-1 text-3xl font-black text-[#D97706]">47.3s</p></div>
              <div className="rounded-2xl bg-[#1F160F] p-4 text-[#FFFDF8]"><p className="text-xs font-black uppercase text-teal-100">GPU run</p><p className="mt-1 text-3xl font-black text-teal-200">4.2s</p></div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-[#1F160F]">Acceleration keeps stockout scoring inside the supplier call window instead of waiting on stale morning exports.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <AccelerationMetric icon={<Activity size={18} />} label="CPU pipeline" value="47.3s" subtext="pandas + Spark baseline" />
        <AccelerationMetric icon={<Cpu size={18} />} label="GPU pipeline" value="4.2s" subtext="RAPIDS + Spark RAPIDS" tone="teal" />
        <AccelerationMetric icon={<RefreshCw size={18} />} label="Speedup factor" value="11.3x" subtext="faster risk refresh" tone="amber" />
        <AccelerationMetric icon={<AlertTriangle size={18} />} label="Time to insight" value="38s" subtext="vs 6+ min manual flow" tone="teal" />
      </section>

      <section className="rounded-[1.6rem] border border-[#E5D8C8] bg-[#FFFDF8] p-5 shadow-xl shadow-[#2A1A12]/10">
        <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <ComparisonPanel title="CPU / manual workflow" tone="cpu" rows={["47.3s pipeline runtime", "6+ min manual time-to-insight", "Slower refresh cycles", "Delayed stockout detection", "Excel/manual reconciliation"]} />
          <div className="flex flex-col items-center justify-center rounded-[1.4rem] border border-[#E5D8C8] bg-[#FFFBF3] px-6 py-5 text-center">
            <p className="text-xs font-black uppercase text-[#7A6A58]">Time compression</p>
            <p className="mt-2 text-3xl font-black text-[#1F160F]">47.3s -&gt; 4.2s</p>
            <p className="mt-2 rounded-full bg-[#DDF8F1] px-3 py-1 text-sm font-black text-[#0D9488]">11.3x speedup</p>
          </div>
          <ComparisonPanel title="GPU pipeline" tone="gpu" rows={["4.2s pipeline runtime", "38s end-to-end insight", "30-min refresh cycles possible", "Faster risk scoring", "Immediate reorder alerts"]} />
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <BenchmarkBar label="CPU pipeline" value={47.3} max={47.3} tone="cpu" />
          <BenchmarkBar label="GPU pipeline" value={4.2} max={47.3} tone="gpu" />
        </div>
        <p className="mt-3 text-sm font-semibold text-[#6B5B4A]">Runtime reduction is approximately {runtimeReduction}% from CPU baseline to GPU pipeline simulation.</p>
      </section>

      <section className="rounded-[1.6rem] border border-[#E5D8C8] bg-[#FFFDF8] p-5 shadow-xl shadow-[#2A1A12]/10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-[#0D9488]">Pipeline flow</p>
            <h3 className="mt-1 text-2xl font-black tracking-normal text-[#1F160F]">From marketplace signal to reorder alert</h3>
          </div>
          <span className="rounded-full bg-[#DDF8F1] px-3 py-1 text-xs font-black uppercase text-[#0D9488]">GPU path highlighted</span>
        </div>
        <PipelineLane label="CPU path" tone="cpu" steps={pipelineSteps} />
        <PipelineLane label="GPU path" tone="gpu" steps={pipelineSteps} animated />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {matterCards.map((card) => (
          <article key={card.title} className="accel-card rounded-[1.4rem] border border-[#E5D8C8] bg-[#FFFDF8] p-5 shadow-xl shadow-[#2A1A12]/10 transition hover:-translate-y-1">
            <p className="text-xs font-black uppercase text-[#0D9488]">{card.metric}</p>
            <h3 className="mt-2 text-lg font-black text-[#1F160F]">{card.title}</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#6B5B4A]">{card.text}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[1.6rem] border border-[#E5D8C8] bg-[#FFFDF8] p-5 shadow-xl shadow-[#2A1A12]/10">
          <p className="text-xs font-black uppercase text-[#0D9488]">Mini benchmark</p>
          <h3 className="mt-1 text-2xl font-black text-[#1F160F]">Manual waiting becomes operational response.</h3>
          <div className="mt-5 space-y-4">
            <BenchmarkBar label="Manual time-to-insight" value={360} max={360} display="6+ min" tone="cpu" />
            <BenchmarkBar label="SupplyPulse insight" value={38} max={360} display="38s" tone="gpu" />
          </div>
          <p className="mt-4 text-sm font-semibold leading-6 text-[#6B5B4A]">Faster insight matters most when stock cover is already shorter than supplier lead time.</p>
        </div>
        <section className="rounded-[1.6rem] border border-[#E5D8C8] bg-[#FFFDF8] p-5 shadow-xl shadow-[#2A1A12]/10">
          <p className="text-xs font-black uppercase text-[#0D9488]">Acceleration architecture</p>
          <h3 className="mt-1 text-2xl font-black text-[#1F160F]">A simpler path from sales signal to action.</h3>
          <div className="mt-5 grid gap-2 md:grid-cols-6">
            {architectureSteps.map((step, index) => <ArchitectureStep key={step} label={step} index={index} />)}
          </div>
          <p className="mt-5 rounded-2xl border border-[#DDF8F1] bg-[#E6FFFA] p-4 text-sm font-semibold leading-6 text-[#0D9488]">In this prototype, the GPU speedup is shown as a benchmark simulation. In production, this pipeline can be connected to RAPIDS/Spark RAPIDS on GPU infrastructure.</p>
        </section>
      </section>

      <section className="rounded-[1.2rem] border border-[#E5D8C8] bg-[#FFFBF3] p-4 text-sm font-semibold leading-6 text-[#6B5B4A]">
        <span className="font-black text-[#1F160F]">Prototype note:</span> This demo uses simulated GPU benchmark results to show the intended acceleration architecture. Production deployment would connect the pipeline to RAPIDS, Spark RAPIDS, BigQuery, and GPU infrastructure.
      </section>

      <details className="rounded-[1.2rem] border border-[#E5D8C8] bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6B5B4A] shadow-lg shadow-[#2A1A12]/5">
        <summary className="cursor-pointer font-black text-[#1F160F]">View technical deployment details</summary>
        <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-5">
          {["NVIDIA L4 GPU node", "RAPIDS 24.x", "CUDA 12.x", "Autoscaling GPU pool", "BigQuery + Looker + Gemini integration-ready"].map((item) => (
            <span key={item} className="rounded-xl border border-[#E5D8C8] bg-[#FFFBF3] px-3 py-2">{item}</span>
          ))}
        </div>
      </details>
    </div>
  );
}

function ArchitectureStep({ label, index }: { label: string; index: number }) {
  return (
    <div className="relative rounded-2xl border border-[#DDF8F1] bg-[#E6FFFA] p-3 text-center text-xs font-black text-[#0D9488] shadow-sm">
      {index > 0 && <span className="absolute -left-2 top-1/2 hidden -translate-y-1/2 text-[#0D9488] md:block">-&gt;</span>}
      <span className="mb-1 block text-[0.65rem] text-[#6B5B4A]">{String(index + 1).padStart(2, "0")}</span>
      {label}
    </div>
  );
}

function AccelerationMetric({ icon, label, value, subtext, tone = "brown" }: { icon: ReactNode; label: string; value: string; subtext: string; tone?: "brown" | "teal" | "amber" }) {
  const toneClass = tone === "teal" ? "border-[#DDF8F1] bg-[#E6FFFA] text-[#0D9488]" : tone === "amber" ? "border-amber-100 bg-amber-50 text-[#D97706]" : "border-[#E5D8C8] bg-[#FFFDF8] text-[#1F160F]";
  return (
    <article className={`accel-card rounded-[1.35rem] border p-4 shadow-xl shadow-[#2A1A12]/10 transition hover:-translate-y-1 ${toneClass}`}>
      <div className="flex items-center gap-2 text-current">{icon}<p className="text-xs font-black uppercase">{label}</p></div>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#6B5B4A]">{subtext}</p>
    </article>
  );
}

function ComparisonPanel({ title, rows, tone }: { title: string; rows: string[]; tone: "cpu" | "gpu" }) {
  const isGpu = tone === "gpu";
  return (
    <article className={`rounded-[1.4rem] border p-5 ${isGpu ? "border-[#DDF8F1] bg-[#E6FFFA] shadow-xl shadow-teal-900/10" : "border-amber-100 bg-amber-50/80"}`}>
      <p className={`text-xs font-black uppercase ${isGpu ? "text-[#0D9488]" : "text-[#D97706]"}`}>{title}</p>
      <ul className="mt-4 space-y-2">
        {rows.map((row) => <li key={row} className="flex gap-2 text-sm font-semibold text-[#6B5B4A]"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isGpu ? "bg-[#0F9F8A]" : "bg-[#D97706]"}`} />{row}</li>)}
      </ul>
    </article>
  );
}

function BenchmarkBar({ label, value, max, display, tone }: { label: string; value: number; max: number; display?: string; tone: "cpu" | "gpu" }) {
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  const color = tone === "gpu" ? "bg-[#0F9F8A]" : "bg-[#D97706]";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm font-black text-[#6B5B4A]"><span>{label}</span><span>{display ?? `${value}s`}</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-[#F7F1E8]"><span className={`accel-bar block h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function PipelineLane({ label, steps, tone, animated = false }: { label: string; steps: string[]; tone: "cpu" | "gpu"; animated?: boolean }) {
  const isGpu = tone === "gpu";
  return (
    <div className={`relative mt-5 rounded-[1.35rem] border p-4 ${isGpu ? "border-[#DDF8F1] bg-[#E6FFFA]" : "border-[#E5D8C8] bg-[#FFFBF3]"}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className={`text-xs font-black uppercase ${isGpu ? "text-[#0D9488]" : "text-[#D97706]"}`}>{label}</p>
        <span className="text-xs font-bold text-[#6B5B4A]">{isGpu ? "Parallel refresh" : "Sequential baseline"}</span>
      </div>
      <div className="relative grid gap-2 md:grid-cols-7">
        {animated && <span className="accel-flow-dot hidden md:block" />}
        {steps.map((step, index) => (
          <div key={step} className={`relative rounded-xl border px-3 py-3 text-center text-xs font-black shadow-sm ${isGpu ? "border-[#DDF8F1] bg-[#FFFDF8] text-[#0D9488]" : "border-[#E5D8C8] bg-[#FFFDF8] text-[#6B5B4A]"}`}>
            <span className="mb-1 block text-[0.65rem] text-[#7A6A58]">{String(index + 1).padStart(2, "0")}</span>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelinePage({ notify }: { notify: (message: string) => void }) {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [statusData, runData] = await Promise.all([api.pipelineStatus(), api.pipelineRuns()]);
      setStatus(statusData);
      setRuns(runData);
      setRun((current) => current ?? runData[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load pipeline status.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const execute = async () => {
    setBusy(true);
    try {
      const result = await api.runPipeline();
      setRun(result);
      await load();
      notify(`Pipeline completed: ${result.alertsGenerated ?? 0} alerts refreshed.`);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Empty text={`Pipeline unavailable. ${error}`} />;
  if (!status) return <Loading />;
  const activeRun = run ?? runs[0];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Stat label="Health" value={status.healthLabel ?? "Healthy"} tone={status.healthLabel === "Failed" ? "orange" : status.healthLabel === "Warning" ? "orange" : "green"} />
        <Stat label="GPU duration" value={`${status.gpuDurationSeconds ?? status.durationSeconds}s`} tone="green" />
        <Stat label="CPU baseline" value={`${status.cpuDurationSeconds ?? 47.3}s`} />
        <Stat label="Speedup" value={`${status.speedupFactor ?? 11.3}x`} tone="orange" />
        <Stat label="Rows processed" value={(status.rowsProcessed ?? 0).toLocaleString("en-IN")} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Pipeline status</h3>
            <p className="text-sm text-slate-500">Last run {new Date(status.lastRunTime).toLocaleString()} · next run {new Date(status.nextRunTime).toLocaleTimeString()}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={load} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Refresh status</button>
            <button onClick={execute} disabled={busy} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-500 disabled:cursor-wait disabled:opacity-60"><RefreshCw className="mr-2 inline" size={16} />{busy ? "Running..." : "Run pipeline"}</button>
          </div>
        </div>
      </Card>

      {activeRun ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Stage timeline</h3>
              <p className="text-sm text-slate-500">{activeRun.runId} · {activeRun.durationSeconds ?? status.durationSeconds}s · {activeRun.recommendationsGenerated ?? status.recommendationsGenerated ?? 0} recommendations</p>
            </div>
            <Badge level={activeRun.status === "completed" ? "Low" : "High"}>{activeRun.status}</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {(activeRun.stages ?? []).map((stage, index) => (
              <div key={`${stage.name}-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800 md:grid-cols-[220px_1fr_120px]">
                <div><p className="font-bold">{index + 1}. {stage.name}</p><p className="text-xs text-slate-500">{stage.status}</p></div>
                <p className="text-slate-600 dark:text-slate-300">{stage.message}</p>
                <p className="font-semibold text-teal-700 dark:text-teal-300">{stage.durationMs}ms</p>
              </div>
            ))}
          </div>
        </Card>
      ) : <Empty text="Run the pipeline to generate stage history." />}

      <Card>
        <h3 className="font-bold">Run history</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr>{["Run", "Status", "Rows", "Alerts", "Recommendations", "Duration"].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr></thead>
            <tbody>{runs.map((item) => <tr key={item.runId} className="border-t border-slate-100 dark:border-slate-800"><td className="px-3 py-3 font-semibold">{item.runId}</td><td className="px-3 py-3">{item.status}</td><td className="px-3 py-3">{item.rowsProcessed.toLocaleString("en-IN")}</td><td className="px-3 py-3">{item.alertsGenerated ?? 0}</td><td className="px-3 py-3">{item.recommendationsGenerated ?? 0}</td><td className="px-3 py-3">{item.durationSeconds ?? 0}s</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AlertsPage({ notify, setPage }: { notify: (message: string) => void; setPage: (page: Page) => void }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [severity, setSeverity] = useState("All");
  const [status, setStatus] = useState("Pending");
  const [type, setType] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setAlerts(await api.alerts({ severity, status, type, limit: 80 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [severity, status, type]);

  const updateStatus = async (alert: AlertItem, nextStatus: "Actioned" | "Dismissed") => {
    await api.updateAlertStatus(alert.alertId ?? alert.id, nextStatus);
    notify(`Alert marked ${nextStatus.toLowerCase()}.`);
    await load();
  };

  const regenerate = async () => {
    const result = await api.generateAlerts();
    notify(`${result.generatedCount} new alert signals generated.`);
    await load();
  };

  if (loading) return <Loading />;
  if (error) return <Empty text={`Alerts unavailable. ${error}`} />;

  const filtered = alerts.filter((alert) => `${alert.title ?? ""} ${alert.message} ${alert.skuId ?? alert.sku} ${alert.supplierName ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const pending = alerts.filter((alert) => (alert.status ?? "Pending") === "Pending").length;
  const critical = alerts.filter((alert) => String(alert.severity) === "Critical").length;
  const revenueAtRisk = alerts.reduce((sum, alert) => sum + (alert.revenueAtRisk ?? 0), 0);
  const actioned = alerts.filter((alert) => alert.status === "Actioned").length;
  const alertTypes = ["All", "STOCKOUT_RISK", "SUPPLIER_DELAY", "FESTIVAL_SPIKE", "REORDER_DEADLINE", "CHANNEL_MISMATCH", "PIPELINE_COMPLETED", "PIPELINE_FAILED", "REVENUE_AT_RISK"];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Pending alerts" value={pending} tone={pending ? "orange" : "green"} />
        <Stat label="Critical alerts" value={critical} tone={critical ? "orange" : "green"} />
        <Stat label="Revenue at risk" value={compactRupee(revenueAtRisk)} />
        <Stat label="Alerts actioned today" value={actioned} tone="green" />
      </div>

      <Card className="grid gap-3 md:grid-cols-5">
        <Select value={severity} onChange={setSeverity} options={["All", "Low", "Medium", "High", "Critical"]} />
        <Select value={status} onChange={setStatus} options={["All", "Pending", "Actioned", "Dismissed"]} />
        <Select value={type} onChange={setType} options={alertTypes} />
        <label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SKU or supplier" className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 dark:border-slate-700 dark:bg-slate-950" /></label>
        <button onClick={regenerate} className="rounded-md bg-teal-600 px-3 py-2 text-sm font-bold text-white hover:bg-teal-500">Regenerate alerts</button>
      </Card>

      <div className="space-y-3">
        {filtered.map((alert, index) => {
          const level = String(alert.severity) === "Critical" ? "Critical" : String(alert.severity) === "High" ? "High" : String(alert.severity) === "Medium" ? "Medium" : "Low";
          return (
            <Card key={`${alert.alertId ?? alert.id}-${alert.type ?? "alert"}-${alert.skuId ?? alert.sku ?? "system"}-${index}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><Badge level={level as RiskSku["riskLevel"]}>{String(alert.severity)}</Badge><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{alert.type}</span><span className="text-xs font-semibold text-slate-500">{alert.status ?? "Pending"}</span></div>
                  <h3 className="mt-3 font-bold">{alert.title ?? alert.message}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{alert.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{alert.skuId || alert.sku || alert.supplierName || alert.channel || "System"} · {alert.time}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold text-emerald-600 dark:text-emerald-300">{compactRupee(alert.revenueAtRisk ?? 0)}</p>
                  <p className="mt-1 max-w-sm text-slate-600 dark:text-slate-300">{alert.suggestedAction}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => updateStatus(alert, "Actioned")} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">Mark actioned</button>
                <button onClick={() => updateStatus(alert, "Dismissed")} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Dismiss</button>
                <button onClick={() => setPage("recommendations")} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">View recommendation</button>
                <button onClick={() => setPage(alert.supplierId ? "suppliers" : "inventory")} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">View {alert.supplierId ? "supplier" : "SKU"}</button>
              </div>
            </Card>
          );
        })}
        {!filtered.length && <Empty text="No alerts match these filters." />}
      </div>
    </div>
  );
}

function ReportsPage() {
  const report = useLoad(api.executiveReport);
  const [copied, setCopied] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");
  const [pdfError, setPdfError] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  if (report.error) return <Empty text={`Executive report unavailable. ${report.error}`} />;
  if (!report.data) return <Loading />;
  const data = report.data;
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `supplypulse-executive-report-${data.generatedAt.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const copySummary = async () => {
    await copyToClipboard(data.executiveSummaryText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const downloadPdf = async () => {
    const node = reportRef.current;
    if (!node) {
      setPdfError("Report content is not ready yet.");
      return;
    }
    setPdfGenerating(true);
    setPdfError("");
    setPdfMessage("");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);
      await document.fonts?.ready;
      const canvas = await html2canvas(node, {
        backgroundColor: "#FBF7EF",
        scale: Math.min(2, window.devicePixelRatio || 1.5),
        useCORS: true,
        windowWidth: node.scrollWidth
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageContentHeight = pageHeight - margin * 2;
      const imgData = canvas.toDataURL("image/png");
      let heightLeft = imgHeight;
      let y = margin;

      pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageContentHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        y = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageContentHeight;
      }

      const pdfBlob = pdf.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SupplyPulse_AI_Morning_Report_${data.generatedAt.slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setPdfMessage("PDF downloaded.");
      window.setTimeout(() => setPdfMessage(""), 2600);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Unable to generate PDF.");
    } finally {
      setPdfGenerating(false);
    }
  };
  const generated = new Date(data.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const lastRun = new Date(data.pipeline.lastRunTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const totalPoValue = data.recommendations.reduce((sum, rec) => sum + (rec.estimatedPOValue ?? rec.purchaseOrderDraft?.estimatedTotalValue ?? 0), 0);
  const revenueProtected = data.recommendations.reduce((sum, rec) => sum + (rec.revenueProtected ?? rec.revenueSavedEstimate ?? 0), 0);
  const topRiskSkus = data.topRiskSkus.slice(0, 8);
  const priorityRecommendations = data.recommendations.slice(0, 3);
  const remainingRecommendations = data.recommendations.slice(3, 8);
  const topRiskRevenue = topRiskSkus.reduce((sum, sku) => sum + sku.revenueAtRisk, 0);
  const categoryLeaders = topCategoryNames(topRiskSkus);
  const leadCategoryText = categoryLeaders.length ? categoryLeaders.join(" and ") : "priority categories";
  const immediateCount = data.recommendations.filter((rec) => rec.urgency === "Immediate" || rec.urgencyLevel === "Critical").length || priorityRecommendations.length;
  const backupSkuText = data.supplierSummary.alternateSupplierSuggestions.slice(0, 3).map((item) => item.suggestion).join(" ");
  const watchSupplier = data.supplierSummary.alternateSupplierSuggestions[0]?.supplier ?? data.recommendations[0]?.bestSupplier ?? "primary suppliers";
  const maxAlertCount = Math.max(1, ...data.alertSummary.topAlertTypes.map((item) => item.count));
  const riskTotal = Math.max(1, data.riskSummary.criticalSkus + data.riskSummary.highRiskSkus + data.riskSummary.mediumRiskSkus + data.riskSummary.lowRiskSkus);
  const demandMax = Math.max(1, data.forecastSummary.totalForecastDemand30d);

  return (
    <div className="report-page space-y-4 text-[#1F160F] print:bg-white print:text-[#1F160F]">
      <div className="no-print flex flex-wrap items-center justify-end gap-2">
        {(pdfMessage || pdfError) && <span className={`mr-auto rounded-full px-3 py-2 text-xs font-black ${pdfError ? "bg-red-50 text-[#DC2626]" : "bg-[#DDF8F1] text-[#0D9488]"}`}>{pdfError || pdfMessage}</span>}
        <button onClick={() => window.print()} className="inline-flex items-center rounded-md bg-[#1F160F] px-4 py-2 text-sm font-bold text-[#FFFDF8] shadow-lg shadow-[#2A1A12]/15 transition hover:-translate-y-0.5"><Printer className="mr-2" size={16} />Print report</button>
        <button onClick={downloadPdf} disabled={pdfGenerating} className="inline-flex items-center rounded-md border border-[#DDF8F1] bg-[#0F9F8A] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-[#0D9488] disabled:cursor-wait disabled:opacity-70"><FileDown className="mr-2" size={16} />{pdfGenerating ? "Generating PDF..." : "Download PDF"}</button>
        <button onClick={downloadJson} className="inline-flex items-center rounded-md border border-[#DED0BD] bg-[#FFFDF8] px-4 py-2 text-sm font-bold text-[#1F160F] transition hover:-translate-y-0.5 hover:bg-[#DDF8F1]"><FileText className="mr-2" size={16} />Download JSON</button>
        <button onClick={copySummary} className="inline-flex items-center rounded-md border border-[#DED0BD] bg-[#FFFDF8] px-4 py-2 text-sm font-bold text-[#1F160F] transition hover:-translate-y-0.5 hover:bg-[#DDF8F1]"><Copy className="mr-2" size={16} />{copied ? "Copied" : "Copy summary"}</button>
      </div>

      <div ref={reportRef} className="report-export-content space-y-4">
      <section className="report-cover report-section overflow-hidden rounded-[1.35rem] border border-[#DED0BD] bg-[#FFFDF8] p-6 shadow-xl shadow-[#2A1A12]/10">
        <PrintableHeader generated={generated} status={data.pipeline.currentStage ?? data.pipeline.status} />
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_0.85fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#0D9488]">Executive operations report</p>
            <h1 className="mt-2 text-4xl font-black leading-tight tracking-normal text-[#1F160F] print:text-3xl">Morning Stockout Risk Report</h1>
            <p className="mt-4 max-w-4xl text-base font-medium leading-7 text-[#6B5B4A] print:text-sm print:leading-6">{data.executiveSummaryText}</p>
          </div>
          <div className="rounded-2xl border border-[#E5D8C8] bg-[#FFFBF3] p-4 text-sm">
            <InfoLine label="Generated" value={generated} />
            <InfoLine label="Pipeline run" value={data.pipeline.currentStage ?? data.pipeline.status} />
            <InfoLine label="Last run" value={lastRun} />
            <InfoLine label="GPU duration" value={`${data.accelerationSummary.gpuPipelineSeconds}s / ${data.accelerationSummary.speedupFactor}x`} />
          </div>
        </div>
        <div className="report-summary-strip mt-5 grid gap-2 md:grid-cols-4 print:grid-cols-4">
          <ReportMetricCard label="SKUs scanned" value={data.riskSummary.totalSkus} hint="Monitoring inventory across 4 marketplaces" />
          <ReportMetricCard label="Critical SKUs" value={data.riskSummary.criticalSkus} hint="Risk score 80+" tone="red" />
          <ReportMetricCard label="High-risk SKUs" value={data.riskSummary.highRiskSkus} hint="Reorder this week" tone="orange" />
          <ReportMetricCard label="Revenue at risk" value={compactRupee(data.riskSummary.revenueAtRisk)} hint="If reorder slips" tone="red" />
          <ReportMetricCard label="Revenue protected" value={compactRupee(revenueProtected)} hint="Recommended actions" tone="green" />
          <ReportMetricCard label="Recommended PO value" value={compactRupee(totalPoValue)} hint="Draft order value" />
          <ReportMetricCard label="Pending alerts" value={data.alertSummary.pendingAlerts} hint={`${data.alertSummary.criticalAlerts} critical`} tone="orange" />
          <ReportMetricCard label="GPU pipeline" value={`${data.accelerationSummary.gpuPipelineSeconds}s`} hint={data.accelerationSummary.endToEndInsightTime} tone="green" />
        </div>
      </section>

      <section className="report-section grid gap-3 lg:grid-cols-3 print:grid-cols-3">
        <InsightBox title="Highest risk category" text={`${leadCategoryText} dominate today's urgent stockout risk.`} />
        <InsightBox title="Biggest revenue exposure" text={`Top ${topRiskSkus.length} risky SKUs represent ${compactRupee(topRiskRevenue)} protected revenue opportunity.`} />
        <InsightBox title="Operational action" text="Urgent PO confirmation before 6 PM protects the highest-value SKUs." />
      </section>

      <ReportSection title="Today's Decision Snapshot">
        <div className="grid gap-3 lg:grid-cols-3 print:grid-cols-3">
          <ActionCard title="Immediate reorder needed" metric={`${immediateCount} SKUs`} action={`Confirm POs for ${priorityRecommendations.slice(0, 2).map((rec) => rec.skuId).join(", ") || "top critical SKUs"} today.`} tone="red" />
          <ActionCard title="Revenue at risk" metric={compactRupee(data.riskSummary.revenueAtRisk)} action={`Prioritize ${leadCategoryText} before supplier cut-off windows.`} tone="orange" />
          <ActionCard title="Supplier / dispatch watch" metric={watchSupplier} action={backupSkuText || "Keep backup suppliers ready for critical SKUs with short stock cover."} />
        </div>
      </ReportSection>

      <ReportSection title="Risk Breakdown">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="flex h-5 overflow-hidden rounded-full border border-[#E5D8C8] bg-[#FFFBF3]">
              <span className="bg-[#DC2626]" style={{ width: `${(data.riskSummary.criticalSkus / riskTotal) * 100}%` }} />
              <span className="bg-[#D97706]" style={{ width: `${(data.riskSummary.highRiskSkus / riskTotal) * 100}%` }} />
              <span className="bg-[#FBBF24]" style={{ width: `${(data.riskSummary.mediumRiskSkus / riskTotal) * 100}%` }} />
              <span className="bg-[#0F9F8A]" style={{ width: `${(data.riskSummary.lowRiskSkus / riskTotal) * 100}%` }} />
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#6B5B4A]">Risk is concentrated in the first decision window: critical and high-risk SKUs should be cleared before routine replenishment reviews.</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <RiskCount label="Critical" value={data.riskSummary.criticalSkus} tone="red" />
            <RiskCount label="High" value={data.riskSummary.highRiskSkus} tone="orange" />
            <RiskCount label="Medium" value={data.riskSummary.mediumRiskSkus} tone="amber" />
            <RiskCount label="Low" value={data.riskSummary.lowRiskSkus} tone="teal" />
          </div>
        </div>
      </ReportSection>

      <ReportSection title="Top Risky SKUs" eyebrow="Priority inventory exposure">
        <InsightLine>Most urgent risk is concentrated in {leadCategoryText}, with stock cover below supplier lead time.</InsightLine>
        <CompactReportTable headers={["SKU", "Product", "Category", "Risk", "Stock left", "Stockout", "Revenue at risk", "Action"]}>
          {topRiskSkus.map((sku) => (
            <tr key={sku.skuId}>
              <td className="font-black">{sku.skuId}</td>
              <td>{sku.productName}</td>
              <td>{sku.category}</td>
              <td><ReportRiskBadge level={sku.riskLevel} score={sku.riskScore} /></td>
              <td>{formatStockCover(sku.daysOfCover)}</td>
              <td>{sku.expectedStockoutLabel ?? sku.expectedStockoutDate ?? "Review"}</td>
              <td className="font-black text-[#DC2626]">{compactRupee(sku.revenueAtRisk)}</td>
              <td className="text-[#6B5B4A]">{sku.recommendedAction}</td>
            </tr>
          ))}
        </CompactReportTable>
      </ReportSection>

      <ReportSection title="Reorder Action Plan" eyebrow="Supplier-ready actions">
        <div className="grid gap-3 lg:grid-cols-3 print:grid-cols-3">
          {priorityRecommendations.map((rec) => {
            const supplier = rec.recommendedSupplier?.name ?? rec.bestSupplier;
            const revenue = compactRupee(rec.revenueProtected ?? rec.revenueSavedEstimate);
            return (
              <article key={rec.recommendationId ?? rec.skuId} className="report-action-card rounded-2xl border border-[#E5D8C8] bg-[#FFFBF3] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase text-[#0D9488]">{rec.skuId}</p>
                    <h3 className="mt-1 text-base font-black">{rec.productName}</h3>
                  </div>
                  <ReportRiskBadge level={rec.urgencyLevel} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <InfoPanel label="Qty" value={rec.recommendedQuantity.toLocaleString("en-IN")} />
                  <InfoPanel label="Deadline" value={rec.reorderDeadlineLabel ?? rec.urgency ?? "Today"} />
                  <InfoPanel label="PO value" value={compactRupee(rec.estimatedPOValue ?? rec.purchaseOrderDraft?.estimatedTotalValue ?? 0)} />
                  <InfoPanel label="Revenue protected" value={revenue} />
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6B5B4A]">Order {rec.recommendedQuantity.toLocaleString("en-IN")} units from {supplier} today to protect {revenue}.</p>
                <p className="mt-2 text-xs leading-5 text-[#7A6A58]">{rec.reasonBullets?.[0] ?? rec.reasoning}</p>
              </article>
            );
          })}
        </div>
        {!!remainingRecommendations.length && (
          <div className="mt-4">
            <CompactReportTable headers={["SKU", "Supplier", "Qty", "Deadline", "PO value", "Revenue protected"]}>
              {remainingRecommendations.map((rec) => (
                <tr key={rec.recommendationId ?? rec.skuId}>
                  <td className="font-black">{rec.skuId}</td>
                  <td>{rec.recommendedSupplier?.name ?? rec.bestSupplier}</td>
                  <td>{rec.recommendedQuantity.toLocaleString("en-IN")}</td>
                  <td>{rec.reorderDeadlineLabel ?? rec.urgency}</td>
                  <td>{compactRupee(rec.estimatedPOValue ?? rec.purchaseOrderDraft?.estimatedTotalValue ?? 0)}</td>
                  <td>{compactRupee(rec.revenueProtected ?? rec.revenueSavedEstimate)}</td>
                </tr>
              ))}
            </CompactReportTable>
          </div>
        )}
      </ReportSection>

      <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
        <ReportSection title="Supplier Risk & Backup Plan">
          <div className="rounded-2xl border border-[#DDF8F1] bg-[#E6FFFA] p-4">
            <p className="text-xs font-black uppercase text-[#0D9488]">Supplier health status</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#1F160F]">
              {data.supplierSummary.riskySuppliers.length ? `${data.supplierSummary.riskySuppliers.length} suppliers require dispatch attention.` : "No supplier is currently classified as risky, but backup suppliers are recommended for critical SKUs due to short stock cover."}
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {data.supplierSummary.riskySuppliers.slice(0, 3).map((supplier) => (
              <div key={supplier.supplierId ?? supplier.id} className="rounded-xl border border-[#E5D8C8] bg-[#FFFDF8] p-3">
                <div className="flex items-center justify-between gap-3"><p className="font-black">{supplier.name}</p><ReportRiskBadge level={supplier.supplierRiskLevel === "Critical" ? "Critical" : supplier.supplierRiskLevel === "Risky" ? "High" : "Medium"} /></div>
                <p className="mt-1 text-sm text-[#6B5B4A]">{supplier.criticalSkusDependent ?? 0} critical SKU dependencies / {supplier.lastDelayDays ?? 0} delay days / {compactRupee(supplier.totalRevenueAtRiskLinked ?? 0)} linked risk</p>
              </div>
            ))}
            {data.supplierSummary.alternateSupplierSuggestions.slice(0, 5).map((item) => <p key={item.suggestion} className="rounded-xl border border-[#E5D8C8] bg-[#FFFDF8] px-3 py-2 text-sm font-semibold text-[#6B5B4A]">{item.suggestion}</p>)}
          </div>
        </ReportSection>

        <ReportSection title="Forecast Summary">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoPanel label="7-day demand" value={data.forecastSummary.totalForecastDemand7d.toLocaleString("en-IN")} />
            <InfoPanel label="30-day demand" value={data.forecastSummary.totalForecastDemand30d.toLocaleString("en-IN")} />
            <InfoPanel label="Rising SKUs" value={data.forecastSummary.risingSkuCount} />
            <InfoPanel label="Event impacted SKUs" value={data.forecastSummary.eventImpactedSkuCount} />
          </div>
          <div className="mt-4 space-y-3">
            <ReportBar label="7-day demand" value={data.forecastSummary.totalForecastDemand7d} max={demandMax} />
            <ReportBar label="30-day demand" value={data.forecastSummary.totalForecastDemand30d} max={demandMax} />
          </div>
          <p className="mt-4 rounded-xl bg-[#DDF8F1] px-3 py-2 text-sm font-semibold leading-6 text-[#0D9488]">{data.forecastSummary.topEventName ?? "Diwali Sale"} is the largest demand driver, affecting {data.forecastSummary.eventImpactedSkuCount} SKUs with a {(data.forecastSummary.topEventMultiplier ?? 1).toFixed(2)}x multiplier.</p>
        </ReportSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
        <ReportSection title="Alert Summary">
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoPanel label="Pending alerts" value={data.alertSummary.pendingAlerts} />
            <InfoPanel label="Critical alerts" value={data.alertSummary.criticalAlerts} />
            <InfoPanel label="Actioned today" value={data.alertSummary.actionedToday} />
          </div>
          <div className="mt-4 space-y-2">
            {data.alertSummary.topAlertTypes.map((item) => <ReportBar key={item.type} label={formatAlertType(item.type)} value={item.count} max={maxAlertCount} compact />)}
          </div>
        </ReportSection>

        <ReportSection title="Pipeline Benchmark">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoPanel label="CPU/manual pipeline" value={`${data.accelerationSummary.cpuPipelineSeconds}s`} />
            <InfoPanel label="GPU pipeline" value={`${data.accelerationSummary.gpuPipelineSeconds}s`} />
            <InfoPanel label="Speedup" value={`${data.accelerationSummary.speedupFactor}x`} />
            <InfoPanel label="Rows processed" value={data.accelerationSummary.rowsProcessed.toLocaleString("en-IN")} />
          </div>
          <div className="mt-4 grid grid-cols-3 items-center gap-2 text-center text-xs font-black uppercase text-[#6B5B4A]">
            <span className="rounded-xl border border-[#E5D8C8] bg-[#FFFBF3] px-2 py-3">CPU/manual<br />6+ min</span>
            <span className="rounded-xl border border-[#DDF8F1] bg-[#E6FFFA] px-2 py-3 text-[#0D9488]">GPU pipeline<br />{data.accelerationSummary.gpuPipelineSeconds}s</span>
            <span className="rounded-xl border border-[#E5D8C8] bg-[#FFFBF3] px-2 py-3">Morning insight<br />ready</span>
          </div>
          <p className="mt-4 text-sm font-semibold leading-6 text-[#6B5B4A]">GPU acceleration enables fast refresh cycles so stockout risk, forecasts, recommendations, and alerts can be updated before supplier decision windows close.</p>
        </ReportSection>
      </div>

      <ReportSection title="Recommended next actions">
        <ul className="grid gap-2 text-sm font-semibold text-[#6B5B4A] md:grid-cols-2 print:grid-cols-2">
          <ChecklistItem>Confirm PO for top 2 critical SKUs today.</ChecklistItem>
          <ChecklistItem>Validate supplier dispatch for {data.recommendations[0]?.bestSupplier ?? "primary supplier"}.</ChecklistItem>
          <ChecklistItem>Keep backup supplier ready for {leadCategoryText} SKUs.</ChecklistItem>
          <ChecklistItem>Monitor {data.forecastSummary.topEventName ?? "Diwali Sale"} impacted SKUs.</ChecklistItem>
          <ChecklistItem>Run next pipeline refresh before supplier call.</ChecklistItem>
        </ul>
      </ReportSection>
      </div>
    </div>
  );
}

function PrintableHeader({ generated, status }: { generated: string; status: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5D8C8] pb-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#1F160F] text-sm font-black text-[#FFFDF8] shadow-lg shadow-[#2A1A12]/15">SP</span>
        <div>
          <p className="text-base font-black">SupplyPulse AI</p>
          <p className="text-xs font-semibold text-[#6B5B4A]">Inventory risk cockpit</p>
        </div>
      </div>
      <div className="text-right text-xs font-bold uppercase text-[#6B5B4A]">
        <p>{generated}</p>
        <p className="mt-1 text-[#0D9488]">{status}</p>
      </div>
    </div>
  );
}

function ReportMetricCard({ label, value, hint, tone = "default" }: { label: string; value: string | number; hint: string; tone?: "default" | "green" | "orange" | "red" }) {
  const toneClass = tone === "green" ? "text-[#0D9488]" : tone === "orange" ? "text-[#D97706]" : tone === "red" ? "text-[#DC2626]" : "text-[#1F160F]";
  return (
    <div className="rounded-2xl border border-[#E5D8C8] bg-[#FFFDF8]/85 p-3">
      <p className="text-[0.68rem] font-black uppercase tracking-wide text-[#7A6A58]">{label}</p>
      <p className={`mt-1 text-xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#6B5B4A]">{hint}</p>
    </div>
  );
}

function ReportSection({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <section className="report-section rounded-[1.2rem] border border-[#E5D8C8] bg-[#FFFDF8] p-5 shadow-lg shadow-[#2A1A12]/10">
      {eyebrow && <p className="mb-1 text-xs font-black uppercase tracking-wide text-[#0D9488]">{eyebrow}</p>}
      <h2 className="mb-4 text-xl font-black tracking-normal text-[#1F160F] print:text-base">{title}</h2>
      {children}
    </section>
  );
}

function CompactReportTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="compact-report-table overflow-x-auto"><table className="min-w-full text-left"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function InfoPanel({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-[#E5D8C8] bg-[#FFFDF8] p-3"><p className="text-[0.68rem] font-black uppercase tracking-wide text-[#7A6A58]">{label}</p><p className="mt-1 text-base font-black text-[#1F160F]">{value}</p></div>;
}

function InsightBox({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[1.1rem] border border-[#DDF8F1] bg-[#E6FFFA] p-4"><p className="text-xs font-black uppercase text-[#0D9488]">{title}</p><p className="mt-2 text-sm font-semibold leading-6 text-[#1F160F]">{text}</p></div>;
}

function InsightLine({ children }: { children: ReactNode }) {
  return <p className="mb-4 rounded-xl border border-[#DDF8F1] bg-[#E6FFFA] px-3 py-2 text-sm font-semibold leading-6 text-[#0D9488]">{children}</p>;
}

function ActionCard({ title, metric, action, tone = "teal" }: { title: string; metric: string | number; action: string; tone?: "teal" | "orange" | "red" }) {
  const metricClass = tone === "red" ? "text-[#DC2626]" : tone === "orange" ? "text-[#D97706]" : "text-[#0D9488]";
  return <article className="rounded-2xl border border-[#E5D8C8] bg-[#FFFBF3] p-4"><p className="text-xs font-black uppercase text-[#7A6A58]">{title}</p><p className={`mt-2 text-2xl font-black ${metricClass}`}>{metric}</p><p className="mt-2 text-sm font-semibold leading-6 text-[#6B5B4A]">{action}</p></article>;
}

function RiskCount({ label, value, tone }: { label: string; value: number; tone: "red" | "orange" | "amber" | "teal" }) {
  const color = tone === "red" ? "text-[#DC2626] bg-red-50 border-red-100" : tone === "orange" ? "text-[#D97706] bg-amber-50 border-amber-100" : tone === "amber" ? "text-[#B45309] bg-yellow-50 border-yellow-100" : "text-[#0D9488] bg-[#E6FFFA] border-[#DDF8F1]";
  return <div className={`rounded-xl border p-3 text-center ${color}`}><p className="text-xl font-black">{value}</p><p className="text-[0.68rem] font-black uppercase">{label}</p></div>;
}

function ReportRiskBadge({ level, score }: { level: string; score?: number }) {
  const normalized = level === "Critical" ? "Critical" : level === "High" || level === "Risky" ? "High" : level === "Medium" ? "Medium" : "Low";
  const className = normalized === "Critical" ? "bg-red-50 text-[#DC2626] border-red-100" : normalized === "High" ? "bg-amber-50 text-[#D97706] border-amber-100" : normalized === "Medium" ? "bg-yellow-50 text-[#B45309] border-yellow-100" : "bg-[#E6FFFA] text-[#0D9488] border-[#DDF8F1]";
  return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[0.68rem] font-black uppercase ${className}`}>{normalized}{score ? ` ${score}` : ""}</span>;
}

function ReportBar({ label, value, max, compact = false }: { label: string; value: number; max: number; compact?: boolean }) {
  const pct = Math.max(4, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={compact ? "text-sm" : ""}>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black uppercase text-[#6B5B4A]"><span>{label}</span><span>{value.toLocaleString("en-IN")}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F7F1E8]"><span className="block h-full rounded-full bg-[#0F9F8A]" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function ChecklistItem({ children }: { children: ReactNode }) {
  return <li className="flex gap-2 rounded-xl border border-[#E5D8C8] bg-[#FFFBF3] px-3 py-2"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#DDF8F1] text-xs font-black text-[#0D9488]">OK</span><span>{children}</span></li>;
}

function formatAlertType(type: string) {
  const label = type.toLowerCase().split("_").join(" ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function topCategoryNames(skus: RiskSku[]) {
  const counts = skus.reduce<Record<string, number>>((acc, sku) => {
    acc[sku.category] = (acc[sku.category] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([category]) => category);
}

function Filters(props: { query: string; setQuery: (v: string) => void; category: string; setCategory: (v: string) => void; risk: string; setRisk: (v: string) => void; supplier: string; setSupplier: (v: string) => void; data: RiskSku[] }) {
  const categories = ["All", ...Array.from(new Set(props.data.map((sku) => sku.category)))];
  const suppliers = ["All", ...Array.from(new Set(props.data.map((sku) => sku.supplierName)))];
  return (
    <Card className="grid gap-3 md:grid-cols-5">
      <label className="relative md:col-span-2"><Search className="absolute left-3 top-3 text-slate-400" size={16} /><input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="Search SKU or product" className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 dark:border-slate-700 dark:bg-slate-950" /></label>
      <Select value={props.category} onChange={props.setCategory} options={categories} />
      <Select value={props.risk} onChange={props.setRisk} options={["All", "Low", "Medium", "High", "Critical"]} />
      <Select value={props.supplier} onChange={props.setSupplier} options={suppliers} />
    </Card>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">{options.map((option) => <option key={option}>{option}</option>)}</select>;
}

function marketplaceChannels(channelStock: RiskSku["channelStock"]) {
  const sorted = Object.entries(channelStock)
    .filter(([, stock]) => Number(stock) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const visible = getVisibleMarketplaceChannels(sorted.map(([channel]) => channel));
  return visible.map((channel) => [channel, channelStock[channel as keyof typeof channelStock] ?? 0] as [string, number]);
}

function Table({ rows }: { rows: RiskSku[] }) {
  if (!rows.length) return <Empty text="No SKUs match these filters." />;
  return (
    <Card className="overflow-x-auto">
      <table className="min-w-[1180px] w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500"><tr>{["SKU", "Product", "Category", "Channels", "Top stock", "Committed", "Available", "Velocity", "Stock left", "Supplier", "Lead", "Festival", "Risk"].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr></thead>
        <tbody>{rows.map((sku) => {
          const stockChannels = marketplaceChannels(sku.channelStock);
          const topStock = stockChannels[0];
          return (
            <tr key={sku.skuId} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-3 font-semibold">{sku.skuId}</td>
              <td className="px-3 py-3">{sku.productName}</td>
              <td className="px-3 py-3">{sku.category}</td>
              <td className="px-3 py-3"><MultiChannelBadge channels={stockChannels.map(([channel]) => channel)} /></td>
              <td className="px-3 py-3 font-semibold">{topStock ? `${topStock[0]} · ${topStock[1]}` : "No stock"}</td>
              <td className="px-3 py-3">{sku.committedStock}</td>
              <td className="px-3 py-3">{sku.totalAvailableStock}</td>
              <td className="px-3 py-3">{sku.salesVelocity}/day</td>
              <td className="px-3 py-3" title={getStockCoverHint(sku.daysOfCover)}>
                <span className={`font-semibold ${stockCoverToneClass(sku.daysOfCover)}`}>{formatStockCover(sku.daysOfCover)}</span>
              </td>
              <td className="px-3 py-3">{sku.supplierName}</td>
              <td className="px-3 py-3">{sku.leadTime} days</td>
              <td className="px-3 py-3">{sku.festivalProximity}</td>
              <td className="px-3 py-3"><Badge level={sku.riskLevel}>{sku.riskLevel}</Badge></td>
            </tr>
          );
        })}</tbody>
      </table>
    </Card>
  );
}

function ChartBox({ children }: { children: React.ReactElement }) {
  return <div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

const pages: Record<Page, (props: { notify: (message: string) => void; setPage: (page: Page) => void }) => JSX.Element> = {
  landing: ({ setPage }) => <Landing setPage={setPage} />,
  dashboard: MorningDashboard,
  inventory: InventoryPage,
  risks: RisksPage,
  forecast: ForecastPage,
  recommendations: RecommendationsPage,
  suppliers: SuppliersPage,
  events: EventsPage,
  acceleration: AccelerationPage,
  pipeline: PipelinePage,
  alerts: AlertsPage,
  reports: ReportsPage
};
