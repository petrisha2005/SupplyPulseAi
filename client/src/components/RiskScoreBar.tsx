const riskTone = (score: number) => {
  if (score >= 81) return "bg-red-500";
  if (score >= 61) return "bg-orange-500";
  if (score >= 31) return "bg-amber-400";
  return "bg-teal-500";
};

export function RiskScoreBar({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  return (
    <div className="flex min-w-32 max-w-44 items-center gap-3">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${riskTone(safeScore)}`} style={{ width: `${safeScore}%` }} />
      </div>
      <span className="min-w-9 rounded-full bg-slate-100 px-2 py-1 text-center text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{safeScore}</span>
    </div>
  );
}
