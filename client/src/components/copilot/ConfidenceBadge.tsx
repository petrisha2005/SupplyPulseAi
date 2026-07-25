import { ShieldCheck } from "lucide-react";

export function ConfidenceBadge({ confidence, grounding }: { confidence?: number; grounding?: number }) {
  const confidenceValue = typeof confidence === "number" ? Math.round(confidence * 100) : undefined;
  const groundingValue = typeof grounding === "number" ? Math.round(grounding * 100) : undefined;
  if (confidenceValue === undefined && groundingValue === undefined) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-200"><ShieldCheck size={13} /> Confidence {confidenceValue ?? "—"}%</span>
      {groundingValue !== undefined && <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-black text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Grounding {groundingValue}%</span>}
    </div>
  );
}
