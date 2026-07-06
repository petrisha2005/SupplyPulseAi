import { ArrowUpRight } from "lucide-react";
import type { RiskSku } from "@supplypulse/shared";
import { getVisibleMarketplaceChannels, MultiChannelBadge } from "./ChannelBadge";
import { RiskScoreBar } from "./RiskScoreBar";

const getTopChannels = (sku: RiskSku) => {
  const split = sku.channelDemandSplit ?? {};
  const entries = Object.entries(split).filter(([, value]) => Number(value) > 0);
  if (!entries.length) return ["Amazon"];
  return getVisibleMarketplaceChannels(entries.sort((a, b) => Number(b[1]) - Number(a[1])).map(([channel]) => channel));
};

const coverClass = (days: number) => {
  if (days <= 3) return "text-red-600 dark:text-red-300";
  if (days <= 7) return "text-orange-600 dark:text-orange-300";
  return "text-emerald-600 dark:text-emerald-300";
};

export function SKUTable({
  rows,
  selectedSkuId,
  onSelect,
  onExplainRisk
}: {
  rows: RiskSku[];
  selectedSkuId?: string;
  onSelect: (sku: RiskSku) => void;
  onExplainRisk?: (sku: RiskSku) => void;
}) {
  if (!rows.length) {
    return <div className="rounded-[1.35rem] border border-dashed border-teal-200 bg-white/55 p-8 text-center font-semibold text-slate-500 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">No SKUs match this dashboard filter.</div>;
  }

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/80 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
      <div className="border-b border-slate-100/80 px-5 py-4 dark:border-slate-800">
        <h3 className="font-black text-[#1F160F] dark:text-white">Today&apos;s reorder watchlist</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Top SKUs sorted by stockout risk.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-teal-50/45 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              {["SKU", "Risk score", "Days cover", "7d velocity", "Channel", "Action"].map((head) => <th key={head} className="px-5 py-3 font-black">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((sku) => {
              const trendPercent = Math.round(((sku.velocityTrend ?? 1) - 1) * 100);
              const needsReorder = ["Medium", "High", "Critical"].includes(sku.riskLevel);
              const isSelected = selectedSkuId === sku.skuId;
              return (
                <tr key={sku.skuId} className={`border-t border-slate-100/80 transition hover:bg-teal-50/45 dark:border-slate-800 dark:hover:bg-slate-800/70 ${isSelected ? "bg-teal-50/80 ring-1 ring-inset ring-teal-100 dark:bg-teal-950/30 dark:ring-teal-900" : ""}`}>
                  <td className="px-5 py-3">
                    <p className="font-black text-[#1F160F] dark:text-white">{sku.productName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{sku.skuId} · {sku.category}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onExplainRisk?.(sku)} className="rounded-xl p-1 transition hover:bg-white dark:hover:bg-slate-800" title={`Explain risk for ${sku.skuId}`}>
                        <RiskScoreBar score={sku.riskScore} />
                      </button>
                      <button onClick={() => onExplainRisk?.(sku)} className="rounded-full border border-slate-200 bg-white/65 px-2.5 py-1 text-xs font-black text-slate-600 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800">
                        Why?
                      </button>
                    </div>
                  </td>
                  <td className={`px-5 py-3 text-base font-black ${coverClass(sku.daysOfCover)}`}>{sku.daysOfCover} days</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={trendPercent >= 0 ? "font-bold text-orange-600 dark:text-orange-300" : "font-bold text-emerald-600 dark:text-emerald-300"}>
                        {trendPercent >= 0 ? "+" : ""}{trendPercent}%
                      </span>
                      <span className="text-xs text-slate-500">{sku.salesVelocity} units/day</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><MultiChannelBadge channels={getTopChannels(sku)} /></td>
                  <td className="px-5 py-3">
                    {needsReorder ? (
                      <button onClick={() => onSelect(sku)} className="app-button-primary inline-flex items-center gap-1 px-3 py-2 text-xs">
                        Reorder <ArrowUpRight size={13} />
                      </button>
                    ) : (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-300">Safe</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
