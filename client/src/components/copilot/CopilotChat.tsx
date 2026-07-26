import { Bot, LoaderCircle, UserRound } from "lucide-react";
import type { CopilotResponse } from "../../services/copilotApi";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { EvidencePanel } from "./EvidencePanel";
import { ExecutiveBriefingCard } from "./ExecutiveBriefingCard";

export type CopilotMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; response: CopilotResponse };

export function CopilotChat({ messages, loading }: { messages: CopilotMessage[]; loading: boolean }) {
  return (
    <section className="space-y-4">
      {messages.map((message) => message.role === "user" ? (
        <article key={message.id} className="ml-auto flex max-w-2xl items-start justify-end gap-3"><div className="rounded-[1.25rem] rounded-tr-sm bg-[#1F160F] px-4 py-3 text-sm font-semibold leading-6 text-[#FFFDF8] shadow-lg shadow-[#2A1A12]/15 dark:bg-teal-700">{message.content}</div><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><UserRound size={16} /></span></article>
      ) : (
        <article key={message.id} className="rounded-[1.5rem] border border-white/75 bg-white/70 p-4 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/75"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-900/15"><Bot size={18} /></span><div><p className="text-xs font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">SupplyPulse intelligence</p><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-200">{message.response.answer}</p></div></div><div className="flex flex-col items-end gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${message.response.generatedBy === "gemini" ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200"}`}>{message.response.generatedBy === "gemini" ? "AI reasoning" : "Deterministic fallback"}</span><ConfidenceBadge confidence={message.response.metadata?.confidenceScore ?? message.response.confidence} grounding={message.response.metadata?.groundingScore} /></div></div>
          {message.response.executiveBriefing && <div className="mt-4"><ExecutiveBriefingCard briefing={message.response.executiveBriefing} /></div>}
          {!!message.response.actions.length && <section className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900 dark:bg-orange-950/20"><h4 className="font-black text-orange-900 dark:text-orange-100">Recommended actions</h4><div className="mt-3 space-y-2">{message.response.actions.map((action) => <article key={action.title} className="rounded-xl bg-white/75 p-3 text-sm shadow-sm dark:bg-slate-900/75"><p className="font-black text-slate-900 dark:text-white">{action.title}</p><p className="mt-1 leading-5 text-slate-600 dark:text-slate-300">{action.reasoning}</p>{action.expectedImpact && <p className="mt-2 font-bold text-emerald-700 dark:text-emerald-300">{action.expectedImpact}</p>}</article>)}</div></section>}
          <div className="mt-4"><EvidencePanel evidence={message.response.evidence} /></div>
          {!!message.response.limitations?.length && <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Notes: {message.response.limitations.join(" ")}</p>}
        </article>
      ))}
      {loading && <article className="flex items-center gap-3 rounded-[1.35rem] border border-teal-200 bg-teal-50/60 p-4 text-sm font-bold text-teal-800 shadow-sm dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-100"><LoaderCircle size={18} className="animate-spin" />Analyzing supply chain signals...</article>}
    </section>
  );
}
