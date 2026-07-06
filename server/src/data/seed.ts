import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Channel, SaleEvent, SalesRecord, SeedSku, SeedSupplier } from "@supplypulse/shared";
import { addDays, DEMO_TODAY } from "../utils/dates.js";

const dataDir = dirname(fileURLToPath(import.meta.url));
const channels: Channel[] = ["Amazon", "Shopify", "Meesho", "Flipkart", "ERP"];

const categories = [
  "Ethnic Wear",
  "Beauty",
  "Apparel",
  "Food",
  "Kitchenware",
  "Personal Care",
  "Mobile Accessories",
  "Home Decor",
  "Accessories"
];

const products = [
  ["Cotton Kurti", "Ethnic Wear", 1199, 540],
  ["Saree", "Ethnic Wear", 2199, 980],
  ["Linen Shirt", "Apparel", 1499, 610],
  ["Rose Serum", "Beauty", 899, 320],
  ["Kajal", "Beauty", 349, 95],
  ["Jewellery Set", "Accessories", 799, 260],
  ["Millet Snack Pack", "Food", 249, 82],
  ["Protein Bar", "Food", 179, 58],
  ["Copper Bottle", "Kitchenware", 999, 410],
  ["Bamboo Toothbrush", "Personal Care", 149, 42],
  ["Handmade Candle", "Home Decor", 599, 210],
  ["Phone Case", "Mobile Accessories", 399, 92],
  ["Handbag", "Accessories", 1899, 760],
  ["Home Decor Lamp", "Home Decor", 1299, 520],
  ["Kids Ethnic Wear", "Ethnic Wear", 1399, 620]
] as const;

const brands = ["Aarika", "Nira Roots", "UrbanHaath", "MittiMade", "GlowKart", "Tyohaar Co."];

const channelMixByCategory: Record<string, Partial<Record<Channel, number>>> = {
  "Ethnic Wear": { Amazon: 28, Shopify: 22, Meesho: 30, Flipkart: 20 },
  Beauty: { Amazon: 34, Shopify: 30, Meesho: 18, Flipkart: 18 },
  Apparel: { Amazon: 26, Shopify: 24, Meesho: 26, Flipkart: 24 },
  Food: { Amazon: 34, Shopify: 28, Meesho: 14, Flipkart: 24 },
  Kitchenware: { Amazon: 40, Shopify: 16, Meesho: 14, Flipkart: 30 },
  "Personal Care": { Amazon: 30, Shopify: 32, Meesho: 16, Flipkart: 22 },
  "Mobile Accessories": { Amazon: 36, Shopify: 18, Meesho: 16, Flipkart: 30 },
  "Home Decor": { Amazon: 28, Shopify: 28, Meesho: 22, Flipkart: 22 },
  Accessories: { Amazon: 28, Shopify: 22, Meesho: 28, Flipkart: 22 }
};

const primaryChannelSlots: Channel[] = [
  ...Array<Channel>(30).fill("Amazon"),
  ...Array<Channel>(20).fill("Shopify"),
  ...Array<Channel>(15).fill("Flipkart"),
  ...Array<Channel>(15).fill("Meesho")
];

const primaryPoolsByCategory: Record<string, Channel[]> = {
  "Ethnic Wear": ["Amazon", "Shopify", "Meesho", "Flipkart"],
  Beauty: ["Amazon", "Shopify", "Meesho", "Flipkart"],
  Apparel: ["Amazon", "Shopify", "Meesho", "Flipkart"],
  Food: ["Amazon", "Shopify", "Meesho", "Flipkart"],
  Kitchenware: ["Amazon", "Flipkart", "Shopify", "Meesho"],
  "Personal Care": ["Amazon", "Shopify", "Meesho", "Flipkart"],
  "Mobile Accessories": ["Amazon", "Flipkart", "Shopify", "Meesho"],
  "Home Decor": ["Amazon", "Flipkart", "Shopify", "Meesho"],
  Accessories: ["Amazon", "Shopify", "Meesho", "Flipkart"]
};

const primaryChannelFor = (category: string, index: number): Channel => {
  const bucket = (index * 37 + 11) % 100;
  const target: Channel =
    bucket < 30 ? "Amazon" :
    bucket < 50 ? "Shopify" :
    bucket < 65 ? "Flipkart" :
    "Meesho";
  const pool = primaryPoolsByCategory[category] ?? primaryChannelSlots;
  return pool.includes(target) ? target : pool[index % pool.length];
};

const categoryChannelWeights = (category: string, index: number): Record<Channel, number> => {
  const base = Object.fromEntries(channels.map((channel) => [channel, 0])) as Record<Channel, number>;
  const mix = channelMixByCategory[category] ?? { Amazon: 30, Shopify: 25, Flipkart: 20, Meesho: 25 };
  const primaryChannel = primaryChannelFor(category, index);
  for (const channel of channels) {
    const variation = ((index + channel.length) % 5) - 2;
    base[channel] = Math.max(0, (mix[channel] ?? 0) + variation);
  }
  base[primaryChannel] += 45;
  base.ERP = 0;
  return base;
};

const suppliers: SeedSupplier[] = [
  { supplierId: "SUP-BLR", name: "Bengaluru Naturals", city: "Bengaluru", avgLeadDays: 4, reliabilityScore: 92, onTimeDeliveryPct: 94, costRating: 3, lastDelayDays: 0, productsSupplied: ["Beauty", "Food", "Personal Care"], minOrderQuantity: 120 },
  { supplierId: "SUP-JAI", name: "Jaipur Loom Co.", city: "Jaipur", avgLeadDays: 5, reliabilityScore: 90, onTimeDeliveryPct: 91, costRating: 4, lastDelayDays: 1, productsSupplied: ["Ethnic Wear", "Home Decor"], minOrderQuantity: 180 },
  { supplierId: "SUP-SUR", name: "Surat Textile Works", city: "Surat", avgLeadDays: 7, reliabilityScore: 84, onTimeDeliveryPct: 87, costRating: 5, lastDelayDays: 2, productsSupplied: ["Ethnic Wear", "Apparel", "Accessories"], minOrderQuantity: 250 },
  { supplierId: "SUP-MUM", name: "Mumbai QuickPack", city: "Mumbai", avgLeadDays: 3, reliabilityScore: 81, onTimeDeliveryPct: 82, costRating: 2, lastDelayDays: 3, productsSupplied: ["Mobile Accessories", "Accessories", "Kitchenware"], minOrderQuantity: 150 },
  { supplierId: "SUP-DEL", name: "Delhi Craft Hub", city: "Delhi", avgLeadDays: 6, reliabilityScore: 86, onTimeDeliveryPct: 88, costRating: 3, lastDelayDays: 1, productsSupplied: ["Home Decor", "Accessories", "Kitchenware"], minOrderQuantity: 160 },
  { supplierId: "SUP-COI", name: "Coimbatore Apparel Mills", city: "Coimbatore", avgLeadDays: 5, reliabilityScore: 89, onTimeDeliveryPct: 90, costRating: 4, lastDelayDays: 0, productsSupplied: ["Apparel", "Ethnic Wear"], minOrderQuantity: 200 },
  { supplierId: "SUP-AHM", name: "Ahmedabad Daily Goods", city: "Ahmedabad", avgLeadDays: 4, reliabilityScore: 83, onTimeDeliveryPct: 85, costRating: 2, lastDelayDays: 2, productsSupplied: ["Personal Care", "Kitchenware", "Food"], minOrderQuantity: 140 },
  { supplierId: "SUP-HYD", name: "Hyderabad Home Studio", city: "Hyderabad", avgLeadDays: 6, reliabilityScore: 88, onTimeDeliveryPct: 89, costRating: 3, lastDelayDays: 1, productsSupplied: ["Home Decor", "Beauty", "Mobile Accessories"], minOrderQuantity: 130 }
];

const events: SaleEvent[] = [
  { eventId: "EVT-DIWALI", name: "Diwali Sale", startDate: "2026-07-08", endDate: "2026-07-16", affectedCategories: ["Ethnic Wear", "Home Decor", "Accessories"], affectedChannels: ["Amazon", "Shopify", "Flipkart", "Meesho"], demandMultiplier: 1.85, priority: "critical" },
  { eventId: "EVT-EID", name: "Eid Sale", startDate: "2026-07-18", endDate: "2026-07-22", affectedCategories: ["Ethnic Wear", "Beauty"], affectedChannels: ["Meesho", "Amazon", "Shopify"], demandMultiplier: 1.35, priority: "high" },
  { eventId: "EVT-GIF", name: "Amazon Great Indian Festival", startDate: "2026-08-06", endDate: "2026-08-14", affectedCategories: categories, affectedChannels: ["Amazon"], demandMultiplier: 2.1, priority: "critical" },
  { eventId: "EVT-BBD", name: "Flipkart Big Billion Days", startDate: "2026-08-15", endDate: "2026-08-22", affectedCategories: categories, affectedChannels: ["Flipkart"], demandMultiplier: 2, priority: "critical" },
  { eventId: "EVT-MEESHO", name: "Meesho Mega Blockbuster Sale", startDate: "2026-07-23", endDate: "2026-07-27", affectedCategories: ["Ethnic Wear", "Beauty", "Accessories"], affectedChannels: ["Meesho"], demandMultiplier: 1.75, priority: "high" },
  { eventId: "EVT-MONSOON", name: "Monsoon Marketplace Rush", startDate: "2026-07-28", endDate: "2026-07-30", affectedCategories: ["Food", "Personal Care", "Beauty"], affectedChannels: ["Amazon", "Shopify", "Flipkart"], demandMultiplier: 1.5, priority: "high" },
  { eventId: "EVT-XMAS", name: "Christmas Sale", startDate: "2026-12-20", endDate: "2026-12-26", affectedCategories: ["Home Decor", "Beauty", "Accessories"], affectedChannels: ["Amazon", "Shopify", "Flipkart", "Meesho"], demandMultiplier: 1.45, priority: "medium" },
  { eventId: "EVT-NY", name: "New Year Sale", startDate: "2026-12-29", endDate: "2027-01-03", affectedCategories: categories, affectedChannels: channels.filter((channel) => channel !== "ERP"), demandMultiplier: 1.3, priority: "medium" },
  { eventId: "EVT-IDAY", name: "Independence Day Sale", startDate: "2026-08-12", endDate: "2026-08-16", affectedCategories: ["Apparel", "Food", "Kitchenware", "Personal Care"], affectedChannels: ["Amazon", "Flipkart", "Shopify"], demandMultiplier: 1.55, priority: "high" }
];

const supplierIdsForCategory = (category: string) => {
  const matched = suppliers.filter((supplier) => supplier.productsSupplied.includes(category)).map((supplier) => supplier.supplierId);
  return matched.length ? matched : [suppliers[0].supplierId];
};

const splitStock = (total: number, index: number): Record<Channel, number> => {
  const category = products[index % products.length][1];
  const weights = categoryChannelWeights(category, index);
  const sum = Object.values(weights).reduce((acc, value) => acc + value, 0);
  const channelStock = Object.fromEntries(channels.map((channel) => [channel, Math.max(0, Math.round(total * weights[channel] / sum))])) as Record<Channel, number>;
  channelStock.ERP = total;
  return channelStock;
};

const skus: SeedSku[] = Array.from({ length: 120 }, (_, index) => {
  const [baseName, category, price, cost] = products[index % products.length];
  const supplierIds = supplierIdsForCategory(category);
  const primarySupplierId = supplierIds[index % supplierIds.length];
  const velocityBase = 10 + (index % 12) * 3 + Math.floor(index / 20) * 2;
  const coverProfile = index % 12;
  const coverDays = coverProfile < 2 ? 1.3 + coverProfile * 0.4 : coverProfile < 5 ? 3.4 + coverProfile * 0.4 : coverProfile < 9 ? 7.5 + coverProfile * 0.7 : 14 + coverProfile;
  const currentStock = Math.max(8, Math.round(velocityBase * coverDays));
  const committedStock = Math.round(velocityBase * (0.45 + (index % 5) * 0.12));
  const skuId = `SKU-${baseName.replace(/[^A-Z]/gi, "").toUpperCase().slice(0, 4)}-${String(index + 1001).padStart(4, "0")}`;
  return {
    skuId,
    productName: `${baseName} ${index % 3 === 0 ? "Premium" : index % 3 === 1 ? "Classic" : "Value"} Pack`,
    category,
    brand: brands[index % brands.length],
    sellingPrice: price + (index % 5) * 35,
    costPrice: cost + (index % 4) * 18,
    supplierIds,
    primarySupplierId,
    currentStock,
    committedStock,
    reorderPoint: Math.round(velocityBase * 7),
    safetyStock: Math.round(velocityBase * 4),
    channelStock: splitStock(currentStock, index),
    status: index % 37 === 0 ? "watch" : "active"
  };
});

const salesHistory: SalesRecord[] = [];
for (const [skuIndex, sku] of skus.entries()) {
  const rawChannelWeights = categoryChannelWeights(sku.category, skuIndex);
  rawChannelWeights.ERP = 0;
  const channelWeightTotal = Object.values(rawChannelWeights).reduce((sum, weight) => sum + weight, 0) || 1;
  const channelWeights = Object.fromEntries(channels.map((channel) => [channel, rawChannelWeights[channel] / channelWeightTotal])) as Record<Channel, number>;
  const baseDemand = 9 + (skuIndex % 12) * 2 + Math.floor(skuIndex / 24);
  const trendType = skuIndex % 5;
  for (let dayOffset = -89; dayOffset <= 0; dayOffset += 1) {
    const date = addDays(DEMO_TODAY, dayOffset);
    const dayIndex = dayOffset + 89;
    const trend = trendType === 0 ? 1 + dayIndex * 0.006 : trendType === 1 ? 1 + dayIndex * 0.002 : trendType === 2 ? 1 : trendType === 3 ? 1.08 - dayIndex * 0.0018 : 1 + Math.sin(dayIndex / 8) * 0.08;
    const recentPromo = dayOffset >= -12 && skuIndex % 6 === 0;
    const eventBoost = recentPromo ? 1.35 : 1;
    for (const channel of channels.filter((item) => item !== "ERP")) {
      const channelSpike =
        channel === "Meesho" && skuIndex % 10 === 0 && dayOffset >= -8 ? 1.45 :
        channel === "Amazon" && skuIndex % 7 === 0 && dayOffset >= -10 ? 1.3 :
        channel === "Shopify" && sku.category === "Beauty" && dayOffset >= -9 ? 1.22 :
        1;
      const unitsSold = Math.max(0, Math.round(baseDemand * trend * eventBoost * channelSpike * channelWeights[channel] + ((dayIndex + skuIndex) % 3)));
      salesHistory.push({
        date,
        skuId: sku.skuId,
        channel,
        unitsSold,
        revenue: unitsSold * sku.sellingPrice,
        returns: Math.round(unitsSold * (0.02 + (skuIndex % 4) * 0.005)),
        promoFlag: recentPromo,
        eventId: recentPromo ? "EVT-DIWALI" : undefined
      });
    }
  }
}

const writeJson = (name: string, value: unknown) => {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(resolve(dataDir, name), `${JSON.stringify(value, null, 2)}\n`);
};

writeJson("channels.json", channels);
writeJson("suppliers.json", suppliers);
writeJson("events.json", events);
writeJson("skus.json", skus);
writeJson("salesHistory.json", salesHistory);

console.log(`Seeded ${skus.length} SKUs, ${suppliers.length} suppliers, ${events.length} events, ${salesHistory.length} sales records.`);
