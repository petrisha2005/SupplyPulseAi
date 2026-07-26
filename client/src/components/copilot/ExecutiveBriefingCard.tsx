import { ClipboardCheck, Sparkles } from "lucide-react";
import type { CopilotResponse } from "../../services/copilotApi";
import { RiskInsightCard } from "./RiskInsightCard";

export function ExecutiveBriefingCard({ briefing }: { briefing: NonNullable<CopilotResponse["executiveBriefing"]> }) {
  return (
    <section className="rounded-[1.35rem] border border-teal-200/80 bg-teal-50/45 p-4 shadow-sm dark:border-teal-900/80 dark:bg-teal-950/20">
      <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-900/15"><Sparkles size={18} /></span><div><p className="text-xs font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">Executive briefing</p><p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{briefing.summary}</p></div></div>
      {!!briefing.keyRisks.length && <div className="mt-4 grid gap-3 xl:grid-cols-2">{briefing.keyRisks.map((insight) => <RiskInsightCard key={`${insight.title}-${insight.severity}`} insight={insight} />)}</div>}
      {!!briefing.immediateActions.length && <section className="mt-4 rounded-2xl border border-white/75 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/75"><div className="flex items-center gap-2"><ClipboardCheck size={16} className="text-teal-700 dark:text-teal-300" /><h4 className="font-black">Immediate action queue</h4></div><ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{briefing.immediateActions.map((action) => <li key={action} className="flex gap-2"><span className="text-teal-700 dark:text-teal-300">•</span>{action}</li>)}</ul></section>}
    </section>
  );
}
