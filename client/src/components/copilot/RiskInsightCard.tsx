import { AlertTriangle, ArrowUpRight, Clock3 } from "lucide-react";
import type { ExecutiveInsight } from "../../services/copilotApi";

const severityClasses: Record<ExecutiveInsight["severity"], string> = {
  critical: "border-red-200 bg-red-50/75 text-red-800 dark:border-red-900 dark:bg-red-950/35 dark:text-red-100",
  high: "border-orange-200 bg-orange-50/75 text-orange-900 dark:border-orange-900 dark:bg-orange-950/35 dark:text-orange-100",
  medium: "border-amber-200 bg-amber-50/75 text-amber-900 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-100",
  low: "border-teal-200 bg-teal-50/75 text-teal-900 dark:border-teal-900 dark:bg-teal-950/35 dark:text-teal-100"
};

export function RiskInsightCard({ insight }: { insight: ExecutiveInsight }) {
  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${severityClasses[insight.severity]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2"><AlertTriangle size={17} className="mt-0.5 shrink-0" /><div><p className="text-[0.67rem] font-black uppercase tracking-wide">{insight.severity} risk</p><h4 className="mt-1 font-black">{insight.title}</h4></div></div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[0.68rem] font-black dark:bg-slate-950/35"><Clock3 size={11} /> {insight.urgency.replace("_", " ")}</span>
      </div>
      <p className="mt-3 text-sm leading-6"><span className="font-black">Situation:</span> {insight.situation}</p>
      <p className="mt-2 text-sm leading-6"><span className="font-black">Impact:</span> {insight.businessImpact}</p>
      <div className="mt-3 flex gap-2 rounded-xl bg-white/55 p-3 text-sm font-bold dark:bg-slate-950/30"><ArrowUpRight size={15} className="mt-0.5 shrink-0" />{insight.recommendedAction}</div>
    </article>
  );
}
