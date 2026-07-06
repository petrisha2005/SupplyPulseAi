import type { ReactNode } from "react";

type Tone = "neutral" | "danger" | "warning" | "success";

const toneClasses: Record<Tone, string> = {
  neutral: "text-[#1F160F] dark:text-white",
  danger: "text-red-600 dark:text-red-300",
  warning: "text-orange-600 dark:text-orange-300",
  success: "text-teal-700 dark:text-teal-300"
};

export function MetricCard({
  icon,
  label,
  value,
  hint,
  tone = "neutral"
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <section className="card-3d rounded-[1.35rem] border border-white/75 bg-white/75 p-4 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/75">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-700 shadow-inner dark:bg-teal-950 dark:text-teal-200">{icon}</span>
        <p className="text-xs font-black uppercase">{label}</p>
      </div>
      <div className={`mt-3 text-3xl font-black ${toneClasses[tone]}`}>{value}</div>
      {hint && <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{hint}</p>}
    </section>
  );
}
