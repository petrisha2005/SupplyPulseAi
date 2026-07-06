import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowUpRight, BarChart3, Boxes, Copy, IndianRupee, PackageCheck, ShieldAlert, X } from "lucide-react";
import type { AlertItem, DashboardResponse, ForecastResponse, Recommendation, RiskExplainResponse, RiskSku } from "@supplypulse/shared";
import { AlertBanner } from "../components/AlertBanner";
import { GeminiPanel } from "../components/GeminiPanel";
import { MetricCard } from "../components/MetricCard";
import { PipelineStatus } from "../components/PipelineStatus";
import { SKUTable } from "../components/SKUTable";
import { api, compactRupee, rupee } from "../lib/api";

type Panel = "po" | "spike" | null;

const numberValue = (record: unknown, keys: string[], fallback = 0) => {
  if (!record || typeof record !== "object") return fallback;
  const source = record as Record<string, unknown>;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
};

const stringValue = (record: unknown, keys: string[], fallback = "") => {
  if (!record || typeof record !== "object") return fallback;
  const source = record as Record<string, unknown>;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return fallback;
};

const normalizeRiskSku = (raw: RiskSku): RiskSku => ({
  ...raw,
  skuId: stringValue(raw, ["skuId", "sku_id", "id"], raw.skuId),
  productName: stringValue(raw, ["productName", "name"], raw.productName),
  riskScore: numberValue(raw, ["riskScore", "risk_score"], raw.riskScore),
  riskLevel: stringValue(raw, ["riskLevel", "riskLabel", "risk_label"], raw.riskLevel) as RiskSku["riskLevel"],
  daysOfCover: numberValue(raw, ["daysOfCover", "daysCover", "days_of_cover"], raw.daysOfCover),
  salesVelocity: numberValue(raw, ["salesVelocity", "velocity7d", "velocity_7d"], raw.salesVelocity),
  revenueAtRisk: numberValue(raw, ["revenueAtRisk", "revenue_at_risk"], raw.revenueAtRisk)
});

const formatDate = () => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
}).format(new Date());

const shortRefresh = (iso?: string) => {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
};

export function Dashboard({ setPage }: { setPage?: (page: "alerts") => void }) {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [risks, setRisks] = useState<RiskSku[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<AlertItem[]>([]);
  const [focusedRecommendation, setFocusedRecommendation] = useState<Recommendation | null>(null);
  const [selectedSkuId, setSelectedSkuId] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [riskExplain, setRiskExplain] = useState<RiskExplainResponse | null>(null);
  const [riskExplainLoading, setRiskExplainLoading] = useState(false);
  const [slowLoading, setSlowLoading] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const loadDashboard = async () => {
    setError("");
    setLoading(true);
    try {
      const dashboardData = await api.dashboard();
      const normalizedRisks = (dashboardData.topRiskSkus ?? []).map(normalizeRiskSku).sort((a: RiskSku, b: RiskSku) => b.riskScore - a.riskScore);
      setDashboard(dashboardData);
      setRisks(normalizedRisks);
      const nextSkuId = selectedSkuId || normalizedRisks[0]?.skuId || "";
      setSelectedSkuId((current) => current || nextSkuId);
      if (nextSkuId) api.recommendation(nextSkuId).then(setFocusedRecommendation).catch(() => setFocusedRecommendation(null));
      api.alerts({ status: "Pending", severity: "Critical", limit: 3 }).then(setCriticalAlerts).catch(() => setCriticalAlerts([]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (!loading) {
      setSlowLoading(false);
      return;
    }
    const timer = window.setTimeout(() => setSlowLoading(true), 3000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const criticalSkus = useMemo(() => risks.filter((sku) => sku.riskScore >= 80 || sku.riskLevel === "Critical"), [risks]);
  const highAndCritical = useMemo(() => risks.filter((sku) => ["High", "Critical"].includes(sku.riskLevel)), [risks]);
  const tableRows = useMemo(() => (criticalOnly ? highAndCritical : risks).slice(0, 8), [criticalOnly, highAndCritical, risks]);
  const selectedSku = useMemo(() => risks.find((sku) => sku.skuId === selectedSkuId) ?? tableRows[0] ?? risks[0], [risks, selectedSkuId, tableRows]);
  const selectedRecommendation = useMemo(() => focusedRecommendation?.skuId === selectedSku?.skuId ? focusedRecommendation : recommendations.find((rec) => rec.skuId === selectedSku?.skuId) ?? recommendations[0], [focusedRecommendation, recommendations, selectedSku]);
  const avgDaysCover = dashboard?.avgDaysCover ?? (risks.length ? risks.reduce((sum, sku) => sum + sku.daysOfCover, 0) / risks.length : 0);
  const topSku = risks[0];

  const handleSelectSku = (sku: RiskSku) => {
    setSelectedSkuId(sku.skuId);
    setPanel(null);
    api.recommendation(sku.skuId).then(setFocusedRecommendation).catch(() => setFocusedRecommendation(null));
  };

  const handleExplainRisk = async (sku: RiskSku) => {
    setSelectedSkuId(sku.skuId);
    setRiskExplainLoading(true);
    try {
      setRiskExplain(await api.riskExplanation(sku.skuId));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unable to load risk explanation.");
    } finally {
      setRiskExplainLoading(false);
    }
  };

  const handleRefresh = async () => {
    setBusy(true);
    try {
      await api.runPipeline();
      await loadDashboard();
    } finally {
      setBusy(false);
    }
  };

  const handleSimulateDelay = async () => {
    setBusy(true);
    try {
      await api.supplierDelay();
      await loadDashboard();
      notify("Supplier delay simulated. Risk scores refreshed.");
    } finally {
      setBusy(false);
    }
  };

  const handleAlertFocus = () => {
    if (setPage && criticalAlerts.length) {
      setPage("alerts");
      return;
    }
    if (topSku) setSelectedSkuId(topSku.skuId);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading && !dashboard) {
    return (
      <div className="premium-card space-y-4 rounded-[1.5rem] border border-white/75 bg-white/75 p-5 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/75">
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-teal-50/70 dark:bg-slate-800" />)}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-teal-50/70 dark:bg-slate-800" />
        <p className="text-center text-sm font-bold text-slate-500 dark:text-slate-400">{slowLoading ? "Still loading live intelligence..." : "Loading morning report..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <section className="risk-glow rounded-[1.5rem] border border-red-200 bg-red-50/90 p-6 text-red-800 shadow-xl shadow-red-900/5 backdrop-blur dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        <div className="flex items-center gap-2 font-bold"><AlertCircle size={18} /> Dashboard could not load</div>
        <p className="mt-2 text-sm">{error}</p>
        <button onClick={loadDashboard} className="mt-4 rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-900/10">Retry</button>
      </section>
    );
  }

  return (
    <div className="mt-2 scroll-mt-24 rounded-[1.75rem] border border-white/60 bg-white/40 p-3 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-950/40 sm:mt-3 sm:p-5">
      <section className="premium-card rounded-[1.6rem] border border-white/75 bg-white/80 p-5 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700 shadow-inner dark:bg-teal-950 dark:text-teal-200"><BarChart3 size={22} /></span>
            <div>
              <h1 className="text-2xl font-black tracking-normal text-[#1F160F] dark:text-white">SupplyPulse AI</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Morning report · {formatDate()}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">GPU pipeline: 4.2s</span>
            <button onClick={() => setCriticalOnly(!criticalOnly)} className="app-button-secondary inline-flex items-center gap-1 px-3 py-2 text-sm">
              {criticalOnly ? "Show all" : "High + critical"} <ArrowUpRight size={14} />
            </button>
            <button onClick={handleRefresh} disabled={busy} className="app-button-primary px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-70">
              {busy ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-5">
          <PipelineStatus status={dashboard?.pipelineStatus ?? "Pipeline ready"} lastRefresh={shortRefresh(dashboard?.lastRefreshTime)} onRefresh={handleRefresh} refreshing={busy} />
        </div>

        {!dismissedAlert && topSku && <div className="mt-5"><AlertBanner count={criticalAlerts.length || criticalSkus.length} topSku={topSku.productName} messages={criticalAlerts.map((alert) => alert.title ?? alert.message)} onDismiss={() => setDismissedAlert(true)} onFocus={handleAlertFocus} /></div>}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<ShieldAlert size={17} />} label="Critical SKUs" value={dashboard?.criticalSkus ?? criticalSkus.length} hint="Need action today" tone="danger" />
          <MetricCard icon={<PackageCheck size={17} />} label="Avg days of cover" value={`${avgDaysCover.toFixed(1)} days`} hint="Across scanned SKUs" tone={avgDaysCover < 7 ? "warning" : "success"} />
          <MetricCard icon={<IndianRupee size={17} />} label="Revenue at risk" value={compactRupee(dashboard?.revenueAtRisk ?? risks.reduce((sum, sku) => sum + sku.revenueAtRisk, 0))} hint="If reorder is delayed" tone="danger" />
          <MetricCard icon={<Boxes size={17} />} label="SKUs scanned" value={dashboard?.totalSkus ?? risks.length} hint="Monitoring inventory across 4 marketplaces" />
        </div>

        <div className="mt-5 scroll-mt-24" ref={tableRef}>
          <SKUTable rows={tableRows} selectedSkuId={selectedSku?.skuId} onSelect={handleSelectSku} onExplainRisk={handleExplainRisk} />
        </div>

        <div className="mt-5">
          <GeminiPanel
            sku={selectedSku}
            recommendation={selectedRecommendation}
            onDraftPo={() => setPanel("po")}
            onExplainSpike={() => setPanel("spike")}
            onSimulateDelay={handleSimulateDelay}
            busy={busy}
          />
        </div>

        {panel && selectedSku && (
          <DecisionPanel
            panel={panel}
            sku={selectedSku}
            recommendation={selectedRecommendation}
            onClose={() => setPanel(null)}
            onNotify={notify}
          />
        )}
        {riskExplainLoading && <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-slate-950/20">Loading risk explanation...</div>}
        {riskExplain && <RiskExplanationModal explanation={riskExplain} onClose={() => setRiskExplain(null)} />}
      </section>
      {toast && <div className="fixed bottom-5 right-5 z-40 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-slate-950/20 dark:bg-white dark:text-slate-950">{toast}</div>}
    </div>
  );
}

function RiskExplanationModal({ explanation, onClose }: { explanation: RiskExplainResponse; onClose: () => void }) {
  const rows = [
    ["Days cover risk", explanation.formulaBreakdown.daysCoverRisk, 35],
    ["Velocity trend risk", explanation.formulaBreakdown.velocityTrendRisk, 20],
    ["Festival risk", explanation.formulaBreakdown.festivalRisk, 15],
    ["Supplier risk", explanation.formulaBreakdown.supplierRisk, 15],
    ["Committed stock risk", explanation.formulaBreakdown.committedStockRisk, 10],
    ["Channel concentration risk", explanation.formulaBreakdown.channelConcentrationRisk, 5]
  ] as const;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <section className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-white/75 bg-[#F7F1E8]/95 p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/95">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-teal-700 dark:text-teal-300">Risk explanation</p>
            <h3 className="text-xl font-black text-[#1F160F] dark:text-white">{explanation.sku.productName}</h3>
            <p className="text-sm text-slate-500">{explanation.sku.skuId} · {explanation.sku.category}</p>
          </div>
          <button title="Close panel" onClick={onClose} className="rounded-full bg-white/70 p-2 shadow-sm hover:bg-teal-50 dark:bg-slate-950 dark:hover:bg-slate-800"><X size={17} /></button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Info label="Risk score" value={`${explanation.riskScore} · ${explanation.riskLevel}`} />
          <Info label="Revenue at risk" value={explanation.revenueAtRiskFormatted ?? compactRupee(explanation.revenueAtRisk)} />
          <Info label="Stockout" value={explanation.expectedStockoutLabel ?? explanation.expectedStockoutDate ?? "Not projected"} />
          <Info label="Priority" value={explanation.recommendationPriority ?? "Monitor"} />
        </div>

        <p className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/90 p-4 text-sm leading-6 text-orange-900 shadow-sm dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-100">
          {explanation.riskExplanation.summary}
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-2xl border border-white/75 bg-white/65 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h4 className="font-black">Formula breakdown</h4>
            <div className="mt-4 space-y-3">
              {rows.map(([label, value, max]) => <BreakdownRow key={label} label={label} value={value} max={max} />)}
            </div>
          </section>
          <section className="rounded-2xl border border-white/75 bg-white/65 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h4 className="font-black">Main drivers</h4>
            <div className="mt-4 space-y-3">
              {explanation.riskExplanation.drivers.map((driver) => (
                <div key={driver.label} className="rounded-2xl border border-white/70 bg-teal-50/35 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{driver.label}</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${driver.impact === "High" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200" : driver.impact === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"}`}>{driver.impact}</span>
                  </div>
                  <p className="mt-1 text-slate-500">{driver.value}</p>
                  <p className="mt-2 text-slate-700 dark:text-slate-200">{driver.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {!!explanation.reasonBullets?.length && (
          <section className="mt-5 rounded-2xl border border-white/75 bg-white/65 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h4 className="font-black">Reason bullets</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {explanation.reasonBullets.map((reason) => <li key={reason}>• {reason}</li>)}
            </ul>
          </section>
        )}
      </section>
    </div>
  );
}

function BreakdownRow({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-slate-500">{value.toFixed(1)} / {max}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-teal-50 dark:bg-slate-800">
        <div className="h-full rounded-full bg-teal-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function DecisionPanel({
  panel,
  sku,
  recommendation,
  onClose,
  onNotify
}: {
  panel: Panel;
  sku: RiskSku;
  recommendation?: Recommendation;
  onClose: () => void;
  onNotify: (message: string) => void;
}) {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const quantity = recommendation?.purchaseOrderDraft?.quantity ?? recommendation?.recommendedQuantity ?? Math.max(100, Math.ceil(sku.salesVelocity * (sku.leadTime + 10)));
  const topChannel = forecast?.channelDemandSplit?.[0]?.channel ?? Object.entries(sku.channelDemandSplit ?? {}).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] ?? "Amazon";
  const unitCost = recommendation?.purchaseOrderDraft?.unitCost ?? recommendation?.unitCost ?? Math.round(sku.price * 0.58);
  const poValue = unitCost * quantity;
  const baseline28 = forecast?.forecastExplanation?.formulaBreakdown.baseline28dAvg ?? Math.max(1, Math.round(sku.salesVelocity / Math.max(1, sku.velocityTrend) * 0.84));
  const recent7 = forecast?.forecastExplanation?.formulaBreakdown.recent7dAvg ?? sku.salesVelocity;
  const spikePercent = Math.round(((sku.salesVelocity - baseline28) / baseline28) * 100);
  const supplier = recommendation?.recommendedSupplier?.name ?? recommendation?.bestSupplier ?? sku.supplierName;
  const poDraft = recommendation?.purchaseOrderDraft;
  const whatsappMessage = recommendation?.whatsappMessage ?? `Hi ${supplier}, please confirm dispatch for ${quantity} units of ${sku.productName} (${sku.skuId}) within 24 hours. Current cover is ${sku.daysOfCover} days and supplier lead time is ${sku.leadTime} days.`;

  useEffect(() => {
    if (panel !== "spike") return;
    let mounted = true;
    setForecast(null);
    api.forecast(sku.skuId)
      .then((value) => mounted && setForecast(value))
      .catch(() => mounted && setForecast(null));
    return () => {
      mounted = false;
    };
  }, [panel, sku.skuId]);

  const copyMessage = async () => {
    await navigator.clipboard?.writeText(whatsappMessage);
    onNotify("WhatsApp-ready PO message copied.");
  };

  const copyPo = async () => {
    const poText = poDraft ? [
      poDraft.title,
      `Supplier: ${poDraft.supplierName}, ${poDraft.supplierCity}`,
      `SKU: ${poDraft.skuId}`,
      `Product: ${poDraft.productName}`,
      `Quantity: ${poDraft.quantity}`,
      `Unit cost: ${rupee(poDraft.unitCost)}`,
      `Estimated total: ${rupee(poDraft.estimatedTotalValue)}`,
      `Dispatch deadline: ${poDraft.requestedDispatchDeadline}`,
      `Urgency: ${poDraft.deliveryUrgency}`,
      `Reason: ${poDraft.note}`
    ].join("\n") : recommendation?.purchaseOrderMessage ?? whatsappMessage;
    await navigator.clipboard?.writeText(poText);
    onNotify("Purchase order draft copied.");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <section className="w-full max-w-2xl rounded-[1.75rem] border border-white/75 bg-[#F7F1E8]/95 p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/95">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#1F160F] dark:text-white">{panel === "po" ? "Purchase order draft" : "Demand spike explanation"}</h3>
            <p className="text-sm text-slate-500">{sku.productName} · {sku.skuId}</p>
          </div>
          <button title="Close panel" onClick={onClose} className="rounded-full bg-white/70 p-2 shadow-sm hover:bg-teal-50 dark:bg-slate-950 dark:hover:bg-slate-800"><X size={17} /></button>
        </div>
        {panel === "po" ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="Supplier name" value={supplier} />
              {recommendation?.recommendedSupplier?.city && <Info label="Supplier city" value={recommendation.recommendedSupplier.city} />}
              <Info label="SKU" value={sku.skuId} />
              <Info label="Product" value={sku.productName} />
              <Info label="Recommended quantity" value={`${quantity} units`} />
              <Info label="Unit cost" value={rupee(unitCost)} />
              <Info label="Total estimated PO value" value={rupee(poValue)} />
              <Info label="Delivery urgency" value={poDraft?.deliveryUrgency ?? `${sku.riskLevel} · ${sku.daysOfCover} days cover`} />
              <Info label="Dispatch deadline" value={poDraft?.requestedDispatchDeadline ?? recommendation?.reorderDeadlineLabel ?? "Within 24 hours"} />
              <Info label="Revenue protected" value={compactRupee(recommendation?.revenueProtected ?? sku.revenueAtRisk)} />
            </div>
            {poDraft && (
              <div className="rounded-2xl border border-white/75 bg-white/65 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-black uppercase text-slate-500">Structured PO draft</p>
                <p className="mt-2 font-black">{poDraft.title}</p>
                <p className="mt-2 text-sm leading-6">{poDraft.note}</p>
                <button onClick={copyPo} className="app-button-secondary mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm">
                  <Copy size={14} /> Copy PO
                </button>
              </div>
            )}
            <div className="rounded-2xl border border-white/75 bg-white/65 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-black uppercase text-slate-500">WhatsApp-ready message</p>
              <p className="mt-2 text-sm leading-6">{whatsappMessage}</p>
              <button onClick={copyMessage} className="app-button-primary mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm">
                <Copy size={14} /> Copy message
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="7-day sales velocity" value={`${recent7} units/day`} />
              <Info label="28-day baseline" value={`${baseline28} units/day`} />
              <Info label="Trend adjustment" value={`${forecast?.forecastExplanation?.formulaBreakdown.trendAdjustment ?? sku.velocityTrend}x`} />
              <Info label="Festival/sale multiplier" value={`${forecast?.forecastExplanation?.formulaBreakdown.eventMultiplier ?? sku.festivalProximity}`} />
              <Info label="Top channel causing spike" value={topChannel} />
              <Info label="Confidence score" value={forecast ? `${forecast.confidenceScore}% · ${forecast.confidenceLabel}` : "Loading forecast"} />
            </div>
            <p className="rounded-2xl border border-orange-200 bg-orange-50/90 p-4 text-sm leading-6 text-orange-900 shadow-sm dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-100">
              {forecast?.forecastExplanation?.summary ?? <>Demand is running about <span className="font-bold">{spikePercent >= 0 ? "+" : ""}{spikePercent}%</span> above the 28-day baseline while stock cover is only <span className="font-bold">{sku.daysOfCover} days</span>. Because supplier lead time is <span className="font-bold">{sku.leadTime} days</span>, the reorder buffer can disappear before the next marketplace refresh.</>}
            </p>
            {forecast?.forecastExplanation && <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{forecast.forecastExplanation.eventReason}</p>}
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/75 bg-white/65 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-[#1F160F] dark:text-white">{value}</p>
    </div>
  );
}
