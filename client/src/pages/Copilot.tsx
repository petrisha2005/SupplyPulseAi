import { useEffect, useState, type ReactNode } from "react";
import { Activity, ArrowUpRight, Bot, BrainCircuit, Send, ShieldCheck, Sparkles } from "lucide-react";
import { CopilotChat, type CopilotMessage } from "../components/copilot/CopilotChat";
import { askCopilot, getCopilotHealth, type CopilotHealth } from "../services/copilotApi";

const suggestions = [
  "What are today's biggest supply risks?",
  "Which supplier needs attention?",
  "Generate morning supply briefing"
];

export function Copilot() {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [question, setQuestion] = useState("What should I do today to prevent stockouts?");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<CopilotHealth | null>(null);

  useEffect(() => {
    getCopilotHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  const analyze = async (nextQuestion = question) => {
    const normalizedQuestion = nextQuestion.trim();
    if (!normalizedQuestion || loading) return;
    setQuestion("");
    setError("");
    setLoading(true);
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", content: normalizedQuestion }]);
    try {
      const response = await askCopilot(normalizedQuestion);
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", response }]);
      getCopilotHealth().then(setHealth).catch(() => undefined);
    } catch {
      setError("AI unavailable. Showing deterministic SupplyPulse intelligence.");
    } finally {
      setLoading(false);
    }
  };

  const latestResponse = [...messages].reverse().find((message): message is Extract<CopilotMessage, { role: "assistant" }> => message.role === "assistant")?.response;
  const mode = health?.aiMode ?? latestResponse?.metadata?.aiMode ?? "fallback";

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-teal-200/80 bg-[linear-gradient(120deg,rgba(221,248,241,0.92),rgba(255,253,248,0.88)_58%,rgba(248,250,252,0.9))] p-5 shadow-xl shadow-teal-950/5 dark:border-teal-900 dark:bg-[linear-gradient(120deg,rgba(19,78,74,0.42),rgba(30,41,59,0.78))] sm:p-6"><div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-teal-300/25 blur-3xl dark:bg-teal-400/10" /><div className="relative flex flex-wrap items-start justify-between gap-5"><div className="flex items-start gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1F160F] text-white shadow-xl shadow-[#2A1A12]/15 dark:bg-teal-600"><BrainCircuit size={22} /></span><div><p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">SupplyPulse AI Copilot</p><h1 className="mt-1 text-2xl font-black text-[#1F160F] dark:text-white">AI Supply Chain Executive Assistant</h1><p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#6B5B4A] dark:text-slate-300">Grounded decision intelligence for today&apos;s stockout, supplier, and replenishment priorities.</p></div></div><div className="grid grid-cols-3 gap-2 text-center"><StatusStat icon={<Sparkles size={15} />} label="AI mode" value={mode === "gemini" ? "Reasoning" : "Fallback"} tone={mode === "gemini" ? "violet" : "amber"} /><StatusStat icon={<ShieldCheck size={15} />} label="Confidence" value={latestResponse?.metadata?.confidenceScore !== undefined ? `${Math.round(latestResponse.metadata.confidenceScore * 100)}%` : "—"} tone="teal" /><StatusStat icon={<Activity size={15} />} label="System" value={health?.status === "healthy" ? "Healthy" : "Checking"} tone={health?.status === "healthy" ? "teal" : "slate"} /></div></div></section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <main className="min-w-0 space-y-4"><section className="min-h-[26rem] rounded-[1.75rem] border border-white/75 bg-white/45 p-4 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-950/35 sm:p-5">{messages.length ? <CopilotChat messages={messages} loading={loading} /> : <EmptyCopilotState onSelect={(item) => { setQuestion(item); void analyze(item); }} />}{error && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-100">{error}</p>}</section>
          <form onSubmit={(event) => { event.preventDefault(); void analyze(); }} className="rounded-[1.35rem] border border-white/75 bg-white/80 p-3 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/80"><label htmlFor="copilot-question" className="sr-only">Ask SupplyPulse AI</label><div className="flex gap-2"><input id="copilot-question" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={loading} placeholder="Ask about risk, suppliers, demand, or replenishment..." className="min-w-0 flex-1 rounded-xl border border-teal-200 bg-white/85 px-4 py-3 text-sm font-semibold outline-none ring-teal-500 transition focus:ring-2 disabled:opacity-60 dark:border-teal-800 dark:bg-slate-950" /><button type="submit" disabled={loading || !question.trim()} className="app-button-teal inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">Analyze <Send size={15} /></button></div></form></main>
        <aside className="space-y-4"><section className="rounded-[1.35rem] border border-white/75 bg-white/75 p-4 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/75"><p className="text-xs font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">Executive prompts</p><h2 className="mt-1 font-black">Start with a decision</h2><div className="mt-3 space-y-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => { setQuestion(suggestion); void analyze(suggestion); }} disabled={loading} className="group flex w-full items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/70 p-3 text-left text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-teal-950/30"><span>{suggestion}</span><ArrowUpRight size={15} className="mt-0.5 shrink-0 text-teal-700 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-teal-300" /></button>)}</div></section>
          <section className="rounded-[1.35rem] border border-white/75 bg-white/60 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-slate-900/60"><div className="flex items-center gap-2"><Bot size={16} className="text-teal-700 dark:text-teal-300" /><h2 className="font-black">How it works</h2></div><ol className="mt-3 space-y-2.5 leading-5 text-slate-600 dark:text-slate-300"><li><span className="font-black text-teal-700 dark:text-teal-300">01</span> Interprets the executive question.</li><li><span className="font-black text-teal-700 dark:text-teal-300">02</span> Reviews approved supply signals.</li><li><span className="font-black text-teal-700 dark:text-teal-300">03</span> Returns evidence-backed actions.</li></ol></section></aside>
      </div>
    </div>
  );
}

function StatusStat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: "teal" | "violet" | "amber" | "slate" }) {
  const colors = { teal: "bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-100", violet: "bg-violet-50 text-violet-800 dark:bg-violet-950/60 dark:text-violet-100", amber: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-100", slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" };
  return <div className={`min-w-[5.3rem] rounded-xl px-2 py-2 ${colors[tone]}`}><div className="flex justify-center">{icon}</div><p className="mt-1 text-[0.62rem] font-black uppercase tracking-wide opacity-70">{label}</p><p className="mt-0.5 text-xs font-black">{value}</p></div>;
}

function EmptyCopilotState({ onSelect }: { onSelect: (question: string) => void }) {
  return <div className="grid min-h-[22rem] place-items-center text-center"><div className="max-w-lg"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-700 shadow-inner dark:bg-teal-950 dark:text-teal-200"><Bot size={24} /></span><h2 className="mt-4 text-xl font-black">Ask for a decision, not a dashboard.</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">SupplyPulse connects risk, forecasts, supplier exposure, and reorder intelligence into an executive answer with an auditable evidence trail.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => onSelect(suggestion)} className="app-button-secondary px-3 py-2 text-xs">{suggestion}</button>)}</div></div></div>;
}
