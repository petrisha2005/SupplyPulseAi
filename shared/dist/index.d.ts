export type Channel = "Amazon" | "Shopify" | "Flipkart" | "Meesho" | "ERP";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type AlertSeverity = "info" | "warning" | "critical" | "Low" | "Medium" | "High" | "Critical";
export type AlertStatus = "Pending" | "Actioned" | "Dismissed";
export type AlertType = "STOCKOUT_RISK" | "SUPPLIER_DELAY" | "FESTIVAL_SPIKE" | "REORDER_DEADLINE" | "CHANNEL_MISMATCH" | "PIPELINE_COMPLETED" | "PIPELINE_FAILED" | "REVENUE_AT_RISK";
export interface Supplier {
    id: string;
    name: string;
    productsSupplied: string[];
    averageLeadTime: number;
    reliabilityScore: number;
    costRating: number;
    lastDelay: string;
    city: string;
    supplierId?: string;
    avgLeadDays?: number;
    onTimeDeliveryPct?: number;
    lastDelayDays?: number;
    minOrderQuantity?: number;
    skuCount?: number;
    urgentSkus?: number;
    rankingScore?: number;
    totalSkusSupplied?: number;
    criticalSkusDependent?: number;
    highRiskSkusDependent?: number;
    totalRevenueAtRiskLinked?: number;
    recommendedOrderValue?: number;
    supplierRiskLevel?: "Healthy" | "Watch" | "Risky" | "Critical";
    supplierRiskScore?: number;
    delayPressure?: number;
    costEfficiencyScore?: number;
    serviceHealthLabel?: string;
    supplierInsight?: string;
    recommendedUsage?: "Urgent orders" | "Planned replenishment" | "Backup supplier only" | "Avoid today";
}
export interface FestivalEvent {
    id: string;
    name: string;
    date: string;
    channels: Channel[];
    multiplier: number;
    daysAway: number;
}
export interface SalesPoint {
    date: string;
    units: number;
    revenue: number;
}
export interface InventorySku {
    skuId: string;
    productName: string;
    category: string;
    price: number;
    channelStock: Record<Channel, number>;
    committedStock: number;
    totalAvailableStock: number;
    salesVelocity: number;
    velocityTrend: number;
    daysOfCover: number;
    supplierId: string;
    supplierName: string;
    leadTime: number;
    festivalProximity: string;
    channelDemandSplit: Record<Channel, number>;
    salesHistory?: SalesPoint[];
}
export interface RiskSku extends InventorySku {
    riskScore: number;
    riskLevel: RiskLevel;
    revenueAtRisk: number;
    riskReason: string;
    riskColor?: string;
    riskDrivers?: string[];
    reasonBullets?: string[];
    recommendationPriority?: "Monitor" | "Plan reorder" | "Reorder soon" | "Reorder today";
    riskExplanation?: RiskExplanation;
    stockoutUnits?: number;
    revenueAtRiskFormatted?: string;
    expectedStockoutDate?: string;
    expectedStockoutLabel?: string;
}
export interface RiskDriver {
    label: string;
    impact: "High" | "Medium" | "Low";
    value: string;
    detail: string;
}
export interface RiskFormulaBreakdown {
    daysCoverRisk: number;
    velocityTrendRisk: number;
    festivalRisk: number;
    supplierRisk: number;
    committedStockRisk: number;
    channelConcentrationRisk: number;
}
export interface RiskExplanation {
    summary: string;
    drivers: RiskDriver[];
    formulaBreakdown: RiskFormulaBreakdown;
}
export interface ForecastResponse {
    skuId: string;
    productName: string;
    category?: string;
    supplierName?: string;
    brand?: string;
    generatedAt?: string;
    confidenceScore: number;
    confidenceLabel?: "High" | "Medium" | "Low";
    confidenceReasons?: string[];
    festivalImpactMultiplier: number;
    festivalImpact?: {
        eventName: string;
        daysAway: number;
        multiplier: number;
        affectedChannels: Channel[];
    };
    trendDirection?: "Rising" | "Stable" | "Falling";
    historicalDailySales?: SalesPoint[];
    forecastNext7Days?: SalesPoint[];
    forecastNext30Days?: SalesPoint[];
    totalForecastDemand7d?: number;
    totalForecastDemand30d?: number;
    avgDailyForecast?: number;
    reorderWindow?: string;
    channelDemandSplit?: Array<{
        channel: Channel;
        sharePct: number;
        avgUnitsPerDay: number;
        trendPct: number;
    }>;
    forecastExplanation?: {
        summary: string;
        trendReason: string;
        eventReason: string;
        confidenceReason: string;
        formulaBreakdown: {
            recent7dAvg: number;
            baseline28dAvg: number;
            sameWeekdayAvg: number;
            trendAdjustment: number;
            eventMultiplier: number;
            finalAvgDailyForecast: number;
        };
    };
    historical?: SalesPoint[];
    next7DaysDemand?: SalesPoint[];
    next30DaysDemand?: SalesPoint[];
    channelDemand?: Array<{
        channel: Channel;
        demand: number;
    }>;
    revenueAtRiskSeries?: Array<{
        date: string;
        revenueAtRisk: number;
    }>;
}
export interface ForecastSummaryResponse {
    totalForecastDemand7d: number;
    totalForecastDemand30d: number;
    risingSkuCount: number;
    fallingSkuCount: number;
    highConfidenceCount: number;
    eventImpactedSkuCount: number;
    topForecastedSkus: ForecastResponse[];
    topRisingSkus: ForecastResponse[];
    forecastGeneratedAt: string;
}
export interface ForecastCompareResponse {
    skuIds: string[];
    forecasts: ForecastResponse[];
    generatedAt: string;
}
export interface Recommendation {
    recommendationId?: string;
    skuId: string;
    productName: string;
    category?: string;
    riskScore?: number;
    riskLevel?: RiskLevel;
    recommendedQuantity: number;
    recommendedAction?: string;
    recommendedSupplier?: RecommendationSupplier;
    alternateSupplier?: RecommendationSupplier;
    bestSupplier: string;
    urgencyLevel: RiskLevel;
    urgency?: "Immediate" | "Within 24 hours" | "This week" | "Monitor";
    reorderDeadline?: string;
    reorderDeadlineLabel?: string;
    expectedStockoutDate: string;
    reasoning: string;
    reasonBullets?: string[];
    revenueAtRisk?: number;
    revenueProtected?: number;
    revenueSavedEstimate: number;
    estimatedPOValue?: number;
    unitCost?: number;
    purchaseOrderDraft?: PurchaseOrderDraft;
    purchaseOrderMessage: string;
    whatsappMessage: string;
    confidenceScore?: number;
    alertSeverity?: AlertSeverity;
    createdAt?: string;
}
export interface RecommendationSupplier {
    supplierId: string;
    name: string;
    city: string;
    avgLeadDays: number;
    reliabilityScore: number;
    onTimeDeliveryPct: number;
    unitCost: number;
    minOrderQuantity?: number;
    reason: string;
}
export interface PurchaseOrderDraft {
    title: string;
    supplierName: string;
    supplierCity: string;
    skuId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    estimatedTotalValue: number;
    requestedDispatchDeadline: string;
    deliveryUrgency: string;
    note: string;
}
export interface PurchaseOrderResponse {
    poNumber: string;
    status: "draft";
    generatedAt: string;
    purchaseOrderDraft: PurchaseOrderDraft;
    whatsappMessage: string;
    estimatedPOValue: number;
    supplier: RecommendationSupplier;
    copyReadyText: string;
    sku?: RiskSku;
    recommendation?: Recommendation;
}
export interface SupplierDependencySku {
    skuId: string;
    productName: string;
    category: string;
    riskScore: number;
    riskLevel: RiskLevel;
    revenueAtRisk: number;
    expectedStockoutDate?: string;
    expectedStockoutLabel?: string;
    recommendedQuantity?: number;
    recommendedSupplier?: string;
}
export interface SupplierDependenciesResponse {
    supplier: Supplier;
    skus: SupplierDependencySku[];
    totalDependencyRevenueAtRisk: number;
    criticalDependencyCount: number;
}
export interface SupplierCompareResponse {
    suppliers: Supplier[];
    bestForUrgentReorder?: Supplier;
    lowestCostSupplier?: Supplier;
    highestReliabilitySupplier?: Supplier;
}
export interface DashboardResponse {
    totalSkus: number;
    actionNeededCount?: number;
    criticalSkus?: number;
    highRiskSkus: number;
    highOnlySkus?: number;
    mediumRiskSkus?: number;
    lowRiskSkus?: number;
    avgDaysCover?: number;
    revenueAtRisk: number;
    forecastAccuracy: number;
    skusScanned?: number;
    topRiskSkus?: RiskSku[];
    lastRefreshTime: string;
    lastUpdated?: string;
    nextRefreshSeconds: number;
    pipelineStatus: string;
    riskDistribution: Array<{
        level: RiskLevel;
        count: number;
    }>;
}
export interface AlertItem {
    id: string;
    alertId?: string;
    type?: AlertType;
    severity: AlertSeverity;
    status?: AlertStatus;
    sku: string;
    skuId?: string;
    productName?: string;
    supplierId?: string;
    supplierName?: string;
    channel?: Channel;
    title?: string;
    message: string;
    suggestedAction: string;
    revenueAtRisk?: number;
    createdAt?: string;
    updatedAt?: string;
    source?: "risk-engine" | "forecast-engine" | "supplier-engine" | "pipeline" | "simulation";
    relatedRecommendationId?: string;
    time: string;
}
export interface PipelineRun {
    runId: string;
    status: string;
    startedAt: string;
    completedAt: string;
    endedAt?: string;
    mode: "CPU" | "GPU";
    rowsProcessed: number;
    logs: string[];
    stages?: PipelineStage[];
    durationSeconds?: number;
    cpuDurationSeconds?: number;
    gpuDurationSeconds?: number;
    speedupFactor?: number;
    skusScanned?: number;
    alertsGenerated?: number;
    recommendationsGenerated?: number;
}
export interface SeedSku {
    skuId: string;
    productName: string;
    category: string;
    brand: string;
    sellingPrice: number;
    costPrice: number;
    supplierIds: string[];
    primarySupplierId: string;
    currentStock: number;
    committedStock: number;
    reorderPoint: number;
    safetyStock: number;
    channelStock: Record<Channel, number>;
    status: "active" | "watch" | "paused";
}
export interface SeedSupplier {
    supplierId: string;
    name: string;
    city: string;
    avgLeadDays: number;
    reliabilityScore: number;
    onTimeDeliveryPct: number;
    costRating: number;
    lastDelayDays: number;
    productsSupplied: string[];
    minOrderQuantity: number;
}
export interface SaleEvent {
    eventId: string;
    name: string;
    startDate: string;
    endDate: string;
    affectedCategories: string[];
    affectedChannels: Channel[];
    demandMultiplier: number;
    priority: "low" | "medium" | "high" | "critical";
}
export interface SalesRecord {
    date: string;
    skuId: string;
    channel: Channel;
    unitsSold: number;
    revenue: number;
    returns: number;
    promoFlag: boolean;
    eventId?: string;
}
export interface PipelineStage {
    name: string;
    status: "pending" | "running" | "completed" | "queued" | "failed";
    startedAt: string;
    completedAt: string;
    endedAt?: string;
    durationMs: number;
    rowsProcessed?: number;
    message?: string;
}
export interface PipelineStatus {
    status: string;
    lastRunTime: string;
    durationSeconds: number;
    gpuDurationSeconds?: number;
    cpuDurationSeconds?: number;
    speedupFactor?: number;
    rowsProcessed: number;
    skusScanned: number;
    alertsGenerated?: number;
    recommendationsGenerated?: number;
    nextRunTime: string;
    gpuEnabled: boolean;
    pipelineLabel: string;
    healthLabel?: "Healthy" | "Warning" | "Failed";
    currentStage?: string;
}
export interface RiskExplainResponse {
    sku: {
        skuId: string;
        productName: string;
        category: string;
        supplierName: string;
        brand?: string;
    };
    riskScore: number;
    riskLevel: RiskLevel;
    riskColor?: string;
    riskExplanation: RiskExplanation;
    formulaBreakdown: RiskFormulaBreakdown;
    expectedStockoutDate?: string;
    expectedStockoutLabel?: string;
    stockoutUnits?: number;
    revenueAtRisk: number;
    revenueAtRiskFormatted?: string;
    recommendationPriority?: string;
    reasonBullets?: string[];
}
export interface ExecutiveReportResponse {
    generatedAt: string;
    pipeline: PipelineStatus;
    dashboardSummary: DashboardResponse & {
        actionNeededCount?: number;
        criticalSkus?: number;
        highOnlySkus?: number;
        mediumRiskSkus?: number;
        lowRiskSkus?: number;
        skusScanned?: number;
        avgDaysCover?: number;
    };
    riskSummary: {
        totalSkus: number;
        criticalSkus: number;
        highRiskSkus: number;
        mediumRiskSkus: number;
        lowRiskSkus: number;
        revenueAtRisk: number;
        avgDaysCover: number;
    };
    topRiskSkus: Array<RiskSku & {
        recommendedAction?: string;
    }>;
    recommendations: Recommendation[];
    supplierSummary: {
        totalSuppliers: number;
        riskySuppliers: Supplier[];
        criticalSkuDependencies: number;
        supplierDelayRisks: Supplier[];
        alternateSupplierSuggestions: Array<{
            supplier: string;
            suggestion: string;
        }>;
    };
    forecastSummary: ForecastSummaryResponse & {
        topEventName?: string;
        topEventMultiplier?: number;
    };
    alertSummary: {
        totalAlerts: number;
        pendingAlerts: number;
        criticalAlerts: number;
        actionedToday: number;
        topAlertTypes: Array<{
            type: string;
            count: number;
        }>;
    };
    accelerationSummary: {
        cpuPipelineSeconds: number;
        gpuPipelineSeconds: number;
        speedupFactor: number;
        endToEndInsightTime: string;
        rowsProcessed: number;
        skusScanned: number;
    };
    executiveSummaryText: string;
}
