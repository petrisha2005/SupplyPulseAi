export const formatStockCover = (daysCover?: number | null) => {
  if (daysCover == null || Number.isNaN(daysCover)) return "Unknown";
  if (daysCover <= 0) return "Out now";

  if (daysCover < 1) {
    const hours = Math.max(1, Math.round(daysCover * 24));
    return `~${hours} hrs left`;
  }

  if (daysCover < 2) {
    const hours = Math.round((daysCover - 1) * 24);
    return hours > 0 ? `1 day ${hours} hrs left` : "1 day left";
  }

  return `${daysCover.toFixed(1)} days left`;
};

export const getStockCoverHint = (daysCover?: number | null) => {
  if (daysCover == null || Number.isNaN(daysCover)) return "Stock cover is unavailable.";
  if (daysCover <= 0) return "Stock may already be out at current sales speed.";

  if (daysCover < 1) {
    const hours = Math.max(1, Math.round(daysCover * 24));
    return `Stock may run out in about ${hours} hours at current sales speed.`;
  }

  if (daysCover < 2) {
    const hours = Math.round((daysCover - 1) * 24);
    return hours > 0 ? `Stock may run out in about 1 day and ${hours} hours.` : "Stock may run out in about 1 day.";
  }

  return "Estimated stock cover based on current sales velocity.";
};

export const stockCoverToneClass = (daysCover?: number | null) => {
  if (daysCover == null || Number.isNaN(daysCover)) return "text-slate-500 dark:text-slate-400";
  if (daysCover < 1) return "text-red-600 dark:text-red-300";
  if (daysCover < 2) return "text-orange-600 dark:text-orange-300";
  return "text-slate-700 dark:text-slate-200";
};
