import { ArrowUpRight, Bot, FileText, HelpCircle, TimerReset } from "lucide-react";
import type { Recommendation, RiskSku } from "@supplypulse/shared";
import { compactRupee } from "../lib/api";

export function GeminiPanel({
  sku,
  recommendation,
  onDraftPo,
  onExplainSpike,
  onSimulateDelay,
  busy = false
}: {
  sku?: RiskSku;
  recommendation?: Recommendation;
  onDraftPo: () => void;
  onExplainSpike: () => void;
  onSimulateDelay: () => void;
  busy?: boolean;
}) {
  const quantity = recommendation?.recommendedQuantity ?? (sku ? Math.max(100, Math.ceil(sku.salesVelocity * (sku.leadTime + 10))) : 0);
  const supplier = recommendation?.recommendedSupplier?.name ?? recommendation?.bestSupplier ?? sku?.supplierName ?? "preferred supplier";
  const revenue = recommendation?.revenueProtected ?? recommendation?.revenueSavedEstimate ?? sku?.revenueAtRisk ?? 0;
  const deadline = recommendation?.reorderDeadlineLabel ?? (sku?.riskLevel === "Critical" ? "Today before 6 PM" : "This week");

  return (
    <section className="card-3d rounded-[1.5rem] border border-white/75 bg-white/80 p-5 shadow-xl shadow-slate-950/10 backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700 shadow-inner dark:bg-teal-950 dark:text-teal-200"><Bot size={20} /></span>
          <div>
            <h3 className="font-black text-[#1F160F] dark:text-white">Gemini agent — top recommendation</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{sku ? `${sku.productName} · ${sku.skuId}` : "Select a SKU to focus the agent"}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-200">AI-generated</span>
          <p className="mt-1 text-xs text-slate-400">last generated now</p>
        </div>
      </div>
      {sku ? (
        <p className="mt-4 max-w-4xl text-base leading-8 text-slate-700 dark:text-slate-200">
          {recommendation?.reasoning ? (
            <>
              {recommendation.reasoning} <span className="font-bold text-teal-700 dark:text-teal-200">Deadline: {deadline}.</span>
            </>
          ) : (
            <>
              Reorder <span className="font-bold text-slate-950 dark:text-white">{sku.skuId}</span> immediately. Current cover is <span className="font-bold">{sku.daysOfCover} days</span>; supplier lead time is <span className="font-bold">{sku.leadTime} days</span>. Order <span className="font-bold text-slate-950 dark:text-white">{quantity} units</span> from <span className="font-bold text-slate-950 dark:text-white">{supplier}</span>. Estimated revenue at risk: <span className="font-bold text-red-600 dark:text-red-300">{compactRupee(revenue)}</span>.
            </>
          )}
        </p>
      ) : (
        <p className="mt-4 text-base leading-8 text-slate-700 dark:text-slate-200">No high-risk recommendation is selected yet.</p>
      )}
      {sku && (
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-2xl border border-white/70 bg-teal-50/45 p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-black uppercase text-slate-500">Quantity</p><p className="mt-1 font-bold">{quantity} units</p></div>
          <div className="rounded-2xl border border-white/70 bg-teal-50/45 p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-black uppercase text-slate-500">Supplier</p><p className="mt-1 font-bold">{supplier}</p></div>
          <div className="rounded-2xl border border-white/70 bg-teal-50/45 p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-black uppercase text-slate-500">Deadline</p><p className="mt-1 font-bold">{deadline}</p></div>
          <div className="rounded-2xl border border-white/70 bg-teal-50/45 p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-black uppercase text-slate-500">Revenue protected</p><p className="mt-1 font-bold text-emerald-600 dark:text-emerald-300">{compactRupee(revenue)}</p></div>
        </div>
      )}
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <button onClick={onDraftPo} className="app-button-primary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm">
          <FileText size={15} /> Draft PO to Supplier <ArrowUpRight size={14} />
        </button>
        <button onClick={onExplainSpike} className="app-button-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm">
          <HelpCircle size={15} /> Why the demand spike? <ArrowUpRight size={14} />
        </button>
        <button onClick={onSimulateDelay} disabled={busy} className="app-button-warning inline-flex items-center justify-center gap-2 px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-70">
          <TimerReset size={15} /> {busy ? "Simulating..." : "Simulate delay"} <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
  );
}
