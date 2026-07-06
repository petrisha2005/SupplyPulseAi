import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AlertItem, Channel, PipelineRun, SaleEvent, SalesRecord, SeedSku, SeedSupplier } from "@supplypulse/shared";

const serviceDir = dirname(fileURLToPath(import.meta.url));
const distDataDir = resolve(serviceDir, "../data");
const srcDataDir = resolve(serviceDir, "../../src/data");
const dataDir = existsSync(resolve(distDataDir, "skus.json")) ? distDataDir : srcDataDir;

const readJson = <T>(fileName: string): T => {
  const contents = readFileSync(resolve(dataDir, fileName), "utf8");
  return JSON.parse(contents) as T;
};

interface StoreState {
  skus: SeedSku[];
  suppliers: SeedSupplier[];
  events: SaleEvent[];
  channels: Channel[];
  salesHistory: SalesRecord[];
  alerts: AlertItem[];
  pipelineRuns: PipelineRun[];
  demandMultiplier: number;
  flashSaleCategory?: string;
  flashSaleChannel?: Channel;
  salesHistoryBySku: Map<string, SalesRecord[]>;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const indexSalesHistory = (records: SalesRecord[]) => {
  const bySku = new Map<string, SalesRecord[]>();
  for (const record of records) {
    const rows = bySku.get(record.skuId);
    if (rows) rows.push(record);
    else bySku.set(record.skuId, [record]);
  }
  return bySku;
};

const loadSeedState = (): StoreState => {
  const salesHistory = readJson<SalesRecord[]>("salesHistory.json");
  return {
    skus: readJson<SeedSku[]>("skus.json"),
    suppliers: readJson<SeedSupplier[]>("suppliers.json"),
    events: readJson<SaleEvent[]>("events.json"),
    channels: readJson<Channel[]>("channels.json"),
    salesHistory,
    salesHistoryBySku: indexSalesHistory(salesHistory),
    alerts: [],
    pipelineRuns: [],
    demandMultiplier: 1
  };
};

let state = loadSeedState();

export const dataStore = {
  getAllSkus: () => state.skus,
  getSkuById: (skuId: string) => state.skus.find((sku) => sku.skuId === skuId),
  getAllSuppliers: () => state.suppliers,
  getSupplierById: (supplierId: string) => state.suppliers.find((supplier) => supplier.supplierId === supplierId),
  getAllEvents: () => state.events,
  getChannels: () => state.channels,
  getSalesHistory: (skuId?: string) => skuId ? state.salesHistoryBySku.get(skuId) ?? [] : state.salesHistory,
  updateSkuStock: (skuId: string, changes: { channel?: Channel; delta?: number; currentStock?: number; committedStock?: number }) => {
    const sku = state.skus.find((item) => item.skuId === skuId);
    if (!sku) return undefined;
    if (typeof changes.currentStock === "number") sku.currentStock = Math.max(0, changes.currentStock);
    if (typeof changes.committedStock === "number") sku.committedStock = Math.max(0, changes.committedStock);
    if (changes.channel && typeof changes.delta === "number") {
      sku.channelStock[changes.channel] = Math.max(0, (sku.channelStock[changes.channel] ?? 0) + changes.delta);
      sku.currentStock = Object.values(sku.channelStock).reduce((sum, value) => sum + value, 0);
    }
    return sku;
  },
  updateSupplierDelay: (supplierId: string, delayDays: number) => {
    const supplier = state.suppliers.find((item) => item.supplierId === supplierId);
    if (!supplier) return undefined;
    supplier.lastDelayDays = Math.max(0, delayDays);
    supplier.avgLeadDays = Math.max(1, supplier.avgLeadDays + Math.max(0, delayDays));
    supplier.reliabilityScore = Math.max(55, supplier.reliabilityScore - Math.ceil(delayDays * 1.5));
    supplier.onTimeDeliveryPct = Math.max(50, supplier.onTimeDeliveryPct - Math.ceil(delayDays * 1.2));
    return supplier;
  },
  setFlashSale: (options: { multiplier: number; category?: string; channel?: Channel }) => {
    state.demandMultiplier = options.multiplier;
    state.flashSaleCategory = options.category;
    state.flashSaleChannel = options.channel;
  },
  getDemandModifier: () => ({
    multiplier: state.demandMultiplier,
    category: state.flashSaleCategory,
    channel: state.flashSaleChannel
  }),
  savePipelineRun: (run: PipelineRun) => {
    state.pipelineRuns = [run, ...state.pipelineRuns].slice(0, 25);
    return run;
  },
  getPipelineRuns: () => state.pipelineRuns,
  saveAlert: (alert: AlertItem) => {
    state.alerts = [alert, ...state.alerts].slice(0, 50);
    return alert;
  },
  updateAlert: (alertId: string, changes: Partial<AlertItem>) => {
    const alert = state.alerts.find((item) => item.alertId === alertId || item.id === alertId);
    if (!alert) return undefined;
    Object.assign(alert, changes);
    return alert;
  },
  getAlerts: () => state.alerts,
  reset: () => {
    state = loadSeedState();
    return clone(state);
  }
};
