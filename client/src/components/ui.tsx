import { useEffect, useState, type ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`premium-card rounded-[1.35rem] border border-white/75 bg-white/75 p-5 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/75 ${className}`}>{children}</section>;
}

export function Stat({ label, value, tone = "slate" }: { label: string; value: ReactNode; tone?: "green" | "yellow" | "orange" | "red" | "slate" }) {
  const colors = {
    green: "text-teal-700 dark:text-teal-300",
    yellow: "text-amber-500 dark:text-amber-300",
    orange: "text-orange-600 dark:text-orange-300",
    red: "text-red-600 dark:text-red-300",
    slate: "text-[#1F160F] dark:text-white"
  };
  return (
    <Card className="card-3d">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <div className={`mt-2 text-2xl font-black ${colors[tone]}`}>{value}</div>
    </Card>
  );
}

export function Badge({ children, level }: { children: ReactNode; level?: string }) {
  const tone = level === "Critical" ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200" : level === "High" ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200" : level === "Medium" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200" : "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-200";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${tone}`}>{children}</span>;
}

export function Loading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="premium-card space-y-4 rounded-[1.5rem] border border-white/75 bg-white/75 p-5 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/75">
      <div className="grid gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-teal-50/70 dark:bg-slate-800" />)}
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-64 animate-pulse rounded-2xl bg-teal-50/70 dark:bg-slate-800" />
        <div className="space-y-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-teal-50/70 dark:bg-slate-800" />)}
        </div>
      </div>
      <p className="text-center text-sm font-bold text-slate-500 dark:text-slate-400">{slow ? "Still loading live intelligence..." : "Loading SupplyPulse data..."}</p>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-[1.35rem] border border-dashed border-teal-200/80 bg-white/55 p-8 text-center font-semibold text-slate-500 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">{text}</div>;
}
