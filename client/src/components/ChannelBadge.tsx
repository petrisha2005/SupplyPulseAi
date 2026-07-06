const channelColors: Record<string, string> = {
  Amazon: "bg-orange-500",
  Meesho: "bg-emerald-500",
  Shopify: "bg-teal-500",
  Flipkart: "bg-orange-600",
  ERP: "bg-slate-500"
};

const visibleMarketplaces = new Set(["Amazon", "Shopify", "Meesho", "Flipkart"]);

export const getVisibleMarketplaceChannels = (channels: string[]) => {
  const unique = new Set<string>();
  return channels.filter((channel) => {
    if (!visibleMarketplaces.has(channel) || unique.has(channel)) return false;
    unique.add(channel);
    return true;
  });
};

export function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/70 px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <span className={`h-2 w-2 rounded-full ${channelColors[channel] ?? "bg-slate-400"}`} />
      {channel}
    </span>
  );
}

export function MultiChannelBadge({ channels, limit = 2 }: { channels: string[]; limit?: number }) {
  const publicChannels = getVisibleMarketplaceChannels(channels);
  const visible = publicChannels.slice(0, limit);
  const remaining = Math.max(0, publicChannels.length - visible.length);
  const lead = visible[0] ?? "Marketplace";
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/75 bg-white/70 px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <span className={`h-2 w-2 shrink-0 rounded-full ${channelColors[lead] ?? "bg-slate-400"}`} />
      <span className="truncate">{visible.join(" • ")}{remaining ? ` • +${remaining}` : ""}</span>
    </span>
  );
}
