import { Cpu, RefreshCw } from "lucide-react";

export function PipelineStatus({
  status,
  lastRefresh,
  duration = "4.2s",
  onRefresh,
  refreshing = false
}: {
  status: string;
  lastRefresh?: string;
  duration?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/50">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
          <Cpu size={18} />
        </span>
        <div>
          <p className="font-bold text-emerald-800 dark:text-emerald-200">GPU pipeline: {duration}</p>
          <p className="text-emerald-700 dark:text-emerald-300">{status}{lastRefresh ? ` · refreshed ${lastRefresh}` : ""}</p>
        </div>
      </div>
      {onRefresh && (
        <button onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-70 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-950">
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      )}
    </section>
  );
}
