import { DatabaseZap } from "lucide-react";
import type { EvidenceItem } from "../../services/copilotApi";

export function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  if (!evidence.length) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-950/45">
      <div className="flex items-center gap-2"><DatabaseZap size={16} className="text-teal-700 dark:text-teal-300" /><h4 className="font-black">Evidence trail</h4><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">{evidence.length}</span></div>
      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">{evidence.map((item, index) => <article key={`${item.source}-${item.type}-${item.id ?? index}`} className="rounded-xl border border-slate-100 bg-white/70 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/75"><div className="flex flex-wrap items-center gap-2"><span className="font-black text-teal-800 dark:text-teal-200">{item.source}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-black uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">{item.type}</span>{item.id && <span className="text-xs font-semibold text-slate-400">{item.id}</span>}</div><p className="mt-1.5 leading-5 text-slate-600 dark:text-slate-300">{item.summary}</p></article>)}</div>
    </section>
  );
}
