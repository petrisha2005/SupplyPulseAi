const channels = ["Amazon", "Shopify", "Meesho", "Flipkart", "ERP"];
const categories = ["Ethnic Wear", "Beauty", "Food", "Accessories", "Home Decor"];
const baseProducts = [
    "Cotton Kurti",
    "Saree",
    "Jewellery Set",
    "Organic Face Serum",
    "Millet Snack Pack",
    "Phone Case",
    "Handmade Candle",
    "Kids Ethnic Wear",
    "Handbag",
    "Home Decor Item"
];
export const suppliers = [
    { id: "SUP-A", name: "Jaipur Loom Co.", productsSupplied: ["Ethnic Wear", "Home Decor"], averageLeadTime: 5, reliabilityScore: 93, costRating: 4, lastDelay: "8 days ago", city: "Jaipur" },
    { id: "SUP-B", name: "Surat Textile Works", productsSupplied: ["Ethnic Wear", "Accessories"], averageLeadTime: 7, reliabilityScore: 86, costRating: 5, lastDelay: "22 days ago", city: "Surat" },
    { id: "SUP-C", name: "Bengaluru Naturals", productsSupplied: ["Beauty", "Food"], averageLeadTime: 4, reliabilityScore: 91, costRating: 3, lastDelay: "None in 60 days", city: "Bengaluru" },
    { id: "SUP-D", name: "Noida QuickPack", productsSupplied: ["Accessories", "Home Decor"], averageLeadTime: 3, reliabilityScore: 78, costRating: 2, lastDelay: "Yesterday", city: "Noida" },
    { id: "SUP-E", name: "Indore Fresh Foods", productsSupplied: ["Food", "Beauty"], averageLeadTime: 6, reliabilityScore: 82, costRating: 4, lastDelay: "13 days ago", city: "Indore" }
];
export const events = [
    { id: "EVT-DIWALI", name: "Diwali Sale", date: "2026-07-08", channels: channels, multiplier: 1.85, daysAway: 8 },
    { id: "EVT-EID", name: "Eid Sale", date: "2026-07-18", channels: ["Meesho", "Amazon", "Shopify"], multiplier: 1.35, daysAway: 18 },
    { id: "EVT-GIF", name: "Amazon Great Indian Festival", date: "2026-08-06", channels: ["Amazon"], multiplier: 2.1, daysAway: 37 },
    { id: "EVT-BBD", name: "Flipkart Big Billion Days", date: "2026-08-15", channels: ["Flipkart"], multiplier: 2.0, daysAway: 46 },
    { id: "EVT-MEESHO", name: "Meesho Mega Blockbuster Sale", date: "2026-07-23", channels: ["Meesho"], multiplier: 1.75, daysAway: 23 },
    { id: "EVT-MONSOON", name: "Monsoon Marketplace Rush", date: "2026-07-28", channels: ["Amazon", "Shopify", "Flipkart"], multiplier: 1.5, daysAway: 28 },
    { id: "EVT-XMAS", name: "Christmas Sale", date: "2026-12-20", channels: channels, multiplier: 1.45, daysAway: 173 },
    { id: "EVT-NY", name: "New Year Sale", date: "2026-12-29", channels: channels, multiplier: 1.3, daysAway: 182 }
];
export const demoState = {
    flashSaleSpike: false,
    supplierDelay: false,
    channelMismatch: false,
    lastRefreshTime: new Date().toISOString(),
    benchmarkMode: "GPU"
};
const supplierForCategory = (category, index) => {
    const eligible = suppliers.filter((supplier) => supplier.productsSupplied.includes(category));
    return eligible[index % eligible.length] ?? suppliers[index % suppliers.length];
};
const categoryChannelMix = {
    "Ethnic Wear": { Amazon: 26, Shopify: 22, Meesho: 32, Flipkart: 20 },
    Beauty: { Amazon: 34, Shopify: 30, Meesho: 18, Flipkart: 18 },
    Food: { Amazon: 36, Shopify: 28, Meesho: 14, Flipkart: 22 },
    Accessories: { Amazon: 28, Shopify: 24, Meesho: 28, Flipkart: 20 },
    "Home Decor": { Amazon: 30, Flipkart: 28, Shopify: 24, Meesho: 18 }
};
const primaryChannelSlots = [
    ...Array(30).fill("Amazon"),
    ...Array(20).fill("Shopify"),
    ...Array(15).fill("Flipkart"),
    ...Array(15).fill("Meesho")
];
const primaryPoolsByCategory = {
    "Ethnic Wear": ["Amazon", "Shopify", "Meesho", "Flipkart"],
    Beauty: ["Amazon", "Shopify", "Meesho", "Flipkart"],
    Food: ["Amazon", "Shopify", "Meesho", "Flipkart"],
    Accessories: ["Amazon", "Shopify", "Meesho", "Flipkart"],
    "Home Decor": ["Amazon", "Flipkart", "Shopify", "Meesho"]
};
const primaryChannelFor = (category, index) => {
    const bucket = (index * 37 + 11) % 100;
    const target = bucket < 30 ? "Amazon" :
        bucket < 50 ? "Shopify" :
            bucket < 65 ? "Flipkart" :
                "Meesho";
    const pool = primaryPoolsByCategory[category] ?? primaryChannelSlots;
    return pool.includes(target) ? target : pool[index % pool.length];
};
const channelSplit = (category, index) => {
    const mix = categoryChannelMix[category] ?? { Amazon: 30, Shopify: 25, Flipkart: 20, Meesho: 25 };
    const primaryChannel = primaryChannelFor(category, index);
    const raw = Object.fromEntries(channels.map((channel) => {
        const variation = ((index + channel.length) % 5) - 2;
        return [channel, channel === "ERP" ? 0 : Math.max(0, (mix[channel] ?? 0) + variation)];
    }));
    raw[primaryChannel] += 45;
    const total = Object.values(raw).reduce((sum, value) => sum + value, 0);
    return Object.fromEntries(channels.map((channel) => [channel, Number((raw[channel] / total).toFixed(2))]));
};
const salesHistory = (index, price) => {
    const points = [];
    const today = new Date("2026-06-30T00:00:00.000Z");
    for (let day = 89; day >= 0; day -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - day);
        const seasonality = 1 + Math.sin((90 - day + index) / 9) * 0.16;
        const growth = 1 + (90 - day) * (0.0015 + (index % 5) * 0.0005);
        const eventLift = day < 12 ? 1.12 + (index % 4) * 0.04 : 1;
        const base = 12 + (index % 8) * 4 + Math.floor(index / 8);
        const units = Math.max(2, Math.round(base * seasonality * growth * eventLift + (day % 7)));
        points.push({ date: date.toISOString().slice(0, 10), units, revenue: units * price });
    }
    return points;
};
export const buildInventory = () => {
    return Array.from({ length: 50 }, (_, index) => {
        const product = baseProducts[index % baseProducts.length];
        const category = categories[index % categories.length];
        const price = [899, 1499, 649, 799, 199, 349, 499, 1199, 1799, 699][index % 10] + (index % 5) * 25;
        const supplier = supplierForCategory(category, index);
        const velocity = 18 + (index % 10) * 5 + Math.floor(index / 10) * 4;
        const riskSeed = index % 10;
        const stockFactor = riskSeed < 2 ? 1.8 : riskSeed < 5 ? 4.6 : riskSeed < 8 ? 8.5 : 13.5;
        const available = Math.round(velocity * stockFactor);
        const split = channelSplit(category, index);
        const channelStock = Object.fromEntries(channels.map((channel) => {
            const mismatch = demoState.channelMismatch && index % 11 === 0 && channel === "ERP" ? -18 : 0;
            return [channel, channel === "ERP" ? Math.max(0, available + mismatch) : Math.max(0, Math.round(available * split[channel]))];
        }));
        const totalAvailableStock = Object.values(channelStock).reduce((sum, value) => sum + value, 0);
        const committedStock = Math.round(velocity * (0.5 + (index % 4) * 0.2));
        const salesVelocity = Math.round(velocity * (demoState.flashSaleSpike && index % 4 === 0 ? 1.7 : 1));
        const adjustedLead = supplier.averageLeadTime + (demoState.supplierDelay && supplier.id === "SUP-D" ? 4 : 0);
        const daysOfCover = Number(((totalAvailableStock - committedStock) / Math.max(1, salesVelocity)).toFixed(1));
        const nearestEvent = events.filter((event) => event.daysAway <= 30).sort((a, b) => a.daysAway - b.daysAway)[0];
        return {
            skuId: `SKU-${product.split(" ")[0].toUpperCase().slice(0, 4)}-${String(index + 101).padStart(3, "0")}`,
            productName: `${product} ${index % 3 === 0 ? "Premium" : index % 3 === 1 ? "Classic" : "Value"} Pack`,
            category,
            price,
            channelStock,
            committedStock,
            totalAvailableStock,
            salesVelocity,
            velocityTrend: Number((1 + (index % 7) * 0.06 + (demoState.flashSaleSpike ? 0.12 : 0)).toFixed(2)),
            daysOfCover,
            supplierId: supplier.id,
            supplierName: supplier.name,
            leadTime: adjustedLead,
            festivalProximity: `${nearestEvent.name} in ${nearestEvent.daysAway} days`,
            channelDemandSplit: split,
            salesHistory: salesHistory(index, price)
        };
    });
};
const labelRisk = (score) => {
    if (score <= 30)
        return "Low";
    if (score <= 60)
        return "Medium";
    if (score <= 80)
        return "High";
    return "Critical";
};
export const scoreRisk = (sku) => {
    const coverPressure = sku.daysOfCover <= 1.5 ? 38 :
        sku.daysOfCover <= 2.5 ? 32 :
            sku.daysOfCover <= 4 ? 40 :
                sku.daysOfCover <= 6 ? 31 :
                    sku.daysOfCover <= 9 ? 15 :
                        15;
    const leadGap = sku.leadTime - sku.daysOfCover;
    const leadPressure = Math.min(24, Math.max(0, leadGap * 4.8));
    const trendPressure = Math.min(16, Math.max(0, (sku.velocityTrend - 1) * 24));
    const eventPressure = events[0].daysAway <= 14 ? 13 : 4;
    const stockPressure = sku.totalAvailableStock < sku.salesVelocity * 3 ? 8 : sku.totalAvailableStock < sku.salesVelocity * 6 ? 4 : 0;
    const skuSeed = Number(sku.skuId.slice(-3)) || 0;
    const variation = (skuSeed % 9) - 4;
    const rawScore = Math.round(coverPressure + leadPressure + trendPressure + eventPressure + stockPressure + variation);
    const isExtreme = sku.daysOfCover <= 0.8 && leadGap >= 5 && sku.velocityTrend >= 1.24;
    const score = Math.min(isExtreme ? 100 : 97, Math.max(8, rawScore));
    const channelHotspot = Object.entries(sku.channelDemandSplit).sort((a, b) => b[1] - a[1])[0][0];
    return {
        ...sku,
        riskScore: score,
        riskLevel: labelRisk(score),
        revenueAtRisk: Math.round(Math.max(0, sku.leadTime - sku.daysOfCover + 2) * sku.salesVelocity * sku.price),
        riskReason: `${sku.daysOfCover} days cover vs ${sku.leadTime} day lead time, ${sku.velocityTrend}x velocity trend, ${events[0].name} uplift, strongest demand on ${channelHotspot}.`
    };
};
export const getRisks = () => buildInventory().map(scoreRisk).sort((a, b) => b.riskScore - a.riskScore);
export const getDashboard = () => {
    const risks = getRisks();
    const highRiskSkus = risks.filter((sku) => sku.riskLevel === "High" || sku.riskLevel === "Critical").length;
    const levels = ["Low", "Medium", "High", "Critical"];
    return {
        totalSkus: risks.length,
        highRiskSkus,
        revenueAtRisk: risks.reduce((sum, sku) => sum + sku.revenueAtRisk, 0),
        forecastAccuracy: demoState.flashSaleSpike ? 86.2 : 91.4,
        lastRefreshTime: demoState.lastRefreshTime,
        nextRefreshSeconds: 1800,
        pipelineStatus: "Healthy - monitoring inventory across 4 marketplaces",
        riskDistribution: levels.map((level) => ({ level, count: risks.filter((sku) => sku.riskLevel === level).length }))
    };
};
const forecastPoints = (sku, days) => {
    const baseDate = new Date("2026-06-30T00:00:00.000Z");
    const eventMultiplier = events.filter((event) => event.daysAway <= days).reduce((multiplier, event) => Math.max(multiplier, event.multiplier), 1);
    return Array.from({ length: days }, (_, index) => {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + index + 1);
        const trend = sku.salesVelocity * sku.velocityTrend * (1 + index * 0.01);
        const units = Math.round(trend * (index < 10 ? eventMultiplier : Math.max(1, eventMultiplier - 0.25)));
        return { date: date.toISOString().slice(0, 10), units, revenue: units * sku.price };
    });
};
export const getForecast = (skuId) => {
    const sku = buildInventory().find((item) => item.skuId === skuId);
    if (!sku)
        return undefined;
    const next30 = forecastPoints(sku, 30);
    const risk = scoreRisk(sku);
    return {
        skuId: sku.skuId,
        productName: sku.productName,
        confidenceScore: Math.max(74, Math.round(94 - risk.riskScore / 8)),
        festivalImpactMultiplier: events[0].multiplier,
        historical: sku.salesHistory,
        next7DaysDemand: next30.slice(0, 7),
        next30DaysDemand: next30,
        channelDemand: channels.map((channel) => ({ channel, demand: Math.round(next30.reduce((sum, day) => sum + day.units, 0) * sku.channelDemandSplit[channel]) })),
        revenueAtRiskSeries: next30.slice(0, 14).map((point, index) => ({ date: point.date, revenueAtRisk: Math.round(Math.max(0, risk.revenueAtRisk - index * sku.price * sku.salesVelocity * 0.35)) }))
    };
};
export const getRecommendations = () => {
    return getRisks().filter((sku) => sku.riskLevel === "High" || sku.riskLevel === "Critical").slice(0, 14).map((sku) => {
        const preferredSupplier = suppliers
            .filter((supplier) => supplier.productsSupplied.includes(sku.category))
            .sort((a, b) => b.reliabilityScore - a.reliabilityScore || a.averageLeadTime - b.averageLeadTime)[0];
        const quantity = Math.ceil((sku.salesVelocity * (preferredSupplier.averageLeadTime + 14) * events[0].multiplier - sku.totalAvailableStock) / 25) * 25;
        const stockout = new Date("2026-06-30T00:00:00.000Z");
        stockout.setDate(stockout.getDate() + Math.max(1, Math.floor(sku.daysOfCover)));
        const reasoning = `Current days-of-cover is ${sku.daysOfCover}, supplier lead time is ${sku.leadTime} days, and ${events[0].name} uplift is expected to increase demand by ${events[0].multiplier}x.`;
        return {
            skuId: sku.skuId,
            productName: sku.productName,
            recommendedQuantity: Math.max(100, quantity),
            bestSupplier: preferredSupplier.name,
            urgencyLevel: sku.riskLevel,
            expectedStockoutDate: stockout.toISOString().slice(0, 10),
            reasoning,
            revenueSavedEstimate: sku.revenueAtRisk,
            purchaseOrderMessage: `Create PO for ${Math.max(100, quantity)} units of ${sku.productName} (${sku.skuId}) from ${preferredSupplier.name}. Required before ${stockout.toISOString().slice(0, 10)}.`,
            whatsappMessage: `Hi ${preferredSupplier.name}, please confirm dispatch for ${Math.max(100, quantity)} units of ${sku.productName} (${sku.skuId}) within 24 hours. ${reasoning} Estimated revenue at risk: Rs ${Math.round(sku.revenueAtRisk / 1000)}K.`
        };
    });
};
export const getAlerts = () => {
    const top = getRisks().slice(0, 12);
    return top.map((sku, index) => ({
        id: `ALT-${index + 1}`,
        severity: sku.riskLevel === "Critical" ? "critical" : sku.riskLevel === "High" ? "warning" : "info",
        sku: sku.skuId,
        message: index % 3 === 0 ? "Critical stockout risk before supplier lead time" : index % 3 === 1 ? "Festival demand spike detected" : "Revenue-at-risk warning",
        suggestedAction: `Reorder ${Math.ceil(sku.salesVelocity * sku.leadTime)} units from ${sku.supplierName}`,
        time: `${12 + index * 4} min ago`
    }));
};
export const runPipeline = () => {
    demoState.lastRefreshTime = new Date().toISOString();
    return {
        runId: `RUN-${Date.now()}`,
        status: "completed",
        startedAt: new Date(Date.now() - 4200).toISOString(),
        completedAt: demoState.lastRefreshTime,
        mode: demoState.benchmarkMode,
        rowsProcessed: 3200000,
        logs: [
            "Marketplace data ingestion completed",
            "3.2M rows processed",
            "Duplicates removed: 14,284",
            "Inventory fusion completed across Amazon, Shopify, Meesho, Flipkart, and ERP",
            "Demand forecast generated",
            "Risk scores updated",
            "Recommendations generated",
            "Dashboard refreshed"
        ]
    };
};
