import { AlertTriangle, X } from "lucide-react";

export function AlertBanner({
  count,
  topSku,
  messages,
  onDismiss,
  onFocus
}: {
  count: number;
  topSku: string;
  messages?: string[];
  onDismiss: () => void;
  onFocus?: () => void;
}) {
  if (count <= 0) return null;
  return (
    <section onClick={onFocus} className="risk-glow flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-lg shadow-red-900/5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-red-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70">
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} />
        <p>
          {messages?.length ? (
            <><span className="font-bold">{count} critical alerts</span> pending. {messages.slice(0, 2).join(" ")}</>
          ) : (
            <><span className="font-bold">{count} high-risk reorder deadlines</span> need attention. Top risk: <span className="font-bold">{topSku}</span>.</>
          )}
        </p>
      </div>
      <button title="Dismiss alert" onClick={(event) => { event.stopPropagation(); onDismiss(); }} className="rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900">
        <X size={16} />
      </button>
    </section>
  );
}
