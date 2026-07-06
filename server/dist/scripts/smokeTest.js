const perfTargets = {
    "/api/dashboard": 1500,
    "/api/risks": 1500,
    "/api/inventory": 1500,
    "/api/recommendations": 1500,
    "/api/suppliers": 1500,
    "/api/alerts": 1500,
    "/api/pipeline/status": 800,
    "/api/reports/executive-summary": 2500
};
const baseUrl = process.env.SMOKE_API_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5050}`;
const isRecord = (value) => typeof value === "object" && value !== null;
const checks = [
    { path: "/api/health", expected: "ok health response", validate: (body) => isRecord(body) && body.ok === true },
    { path: "/api/dashboard", expected: "dashboard totals", validate: (body) => isRecord(body) && typeof body.totalSkus === "number" && Array.isArray(body.riskDistribution) },
    { path: "/api/inventory", expected: "inventory array", validate: (body) => Array.isArray(body) && body.length > 0 && isRecord(body[0]) && typeof body[0].skuId === "string" },
    { path: "/api/risks", expected: "risk array", validate: (body) => Array.isArray(body) && body.length > 0 && isRecord(body[0]) && typeof body[0].riskScore === "number" },
    { path: "/api/recommendations", expected: "recommendations array", validate: (body) => Array.isArray(body) && body.length > 0 && isRecord(body[0]) && typeof body[0].recommendedQuantity === "number" },
    { path: "/api/suppliers", expected: "supplier scorecards", validate: (body) => Array.isArray(body) && body.length > 0 && isRecord(body[0]) && typeof body[0].name === "string" },
    { path: "/api/events", expected: "events array", validate: (body) => Array.isArray(body) && body.length > 0 && isRecord(body[0]) && typeof body[0].name === "string" },
    { path: "/api/forecast/summary", expected: "forecast summary", validate: (body) => isRecord(body) && typeof body.totalForecastDemand7d === "number" && Array.isArray(body.topForecastedSkus) },
    { path: "/api/alerts", expected: "alerts array", validate: (body) => Array.isArray(body) },
    { path: "/api/pipeline/status", expected: "pipeline status", validate: (body) => isRecord(body) && typeof body.status === "string" && typeof body.rowsProcessed === "number" },
    { path: "/api/pipeline/runs", expected: "pipeline runs array", validate: (body) => Array.isArray(body) },
    { path: "/api/pipeline/run", method: "POST", expected: "pipeline run", validate: (body) => isRecord(body) && typeof body.runId === "string" && body.status === "completed" },
    { path: "/api/alerts/generate", method: "POST", expected: "generated alerts", validate: (body) => isRecord(body) && typeof body.generatedCount === "number" && Array.isArray(body.alerts) },
    { path: "/api/simulate/supplier-delay", method: "POST", body: { supplierId: "SUP-SUR", delayDays: 3 }, expected: "supplier delay simulation", validate: (body) => isRecord(body) && body.enabled === true && typeof body.affectedSkus === "number" },
    { path: "/api/simulate/flash-sale", method: "POST", body: { category: "Ethnic Wear", channel: "Amazon", multiplier: 1.6 }, expected: "flash sale simulation", validate: (body) => isRecord(body) && body.enabled === true && typeof body.affectedSkus === "number" },
    { path: "/api/simulate/stockout", method: "POST", body: { skuId: "SKU-HAND-1073", channel: "Amazon" }, expected: "stockout simulation", validate: (body) => isRecord(body) && body.enabled === true && isRecord(body.risk) },
    { path: "/api/simulate/reset", method: "POST", expected: "reset response", validate: (body) => isRecord(body) && body.ok === true && typeof body.totalSkus === "number" },
    { path: "/api/reports/executive-summary", expected: "executive report", validate: (body) => isRecord(body) && typeof body.executiveSummaryText === "string" && isRecord(body.riskSummary) }
];
let passed = 0;
const failures = [];
for (const check of checks) {
    try {
        const body = typeof check.body === "function" ? check.body() : check.body;
        const started = performance.now();
        const response = await fetch(`${baseUrl}${check.path}`, {
            method: check.method ?? "GET",
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined
        });
        const text = await response.text();
        const durationMs = Math.round(performance.now() - started);
        const sizeKb = Buffer.byteLength(text) / 1024;
        const perfTarget = check.method ? undefined : perfTargets[check.path];
        const perfPass = perfTarget ? durationMs <= perfTarget : true;
        if (!response.ok) {
            failures.push(`FAIL ${check.path}: HTTP ${response.status}`);
            continue;
        }
        const responseBody = JSON.parse(text);
        if (!check.validate(responseBody)) {
            failures.push(`FAIL ${check.path}: missing ${check.expected}`);
            continue;
        }
        passed += 1;
        console.log(`PASS ${check.path} | ${durationMs} ms | ${sizeKb.toFixed(1)} KB${perfTarget ? ` | perf ${perfPass ? "PASS" : "WARN"} <= ${perfTarget} ms` : ""}`);
    }
    catch (error) {
        failures.push(`FAIL ${check.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
try {
    const alertsResponse = await fetch(`${baseUrl}/api/alerts?status=Pending&limit=1`);
    const alerts = await alertsResponse.json();
    const alert = Array.isArray(alerts) && alerts.find((item) => isRecord(item) && typeof (item.alertId ?? item.id) === "string");
    if (!alert || !isRecord(alert)) {
        failures.push("FAIL PATCH /api/alerts/:alertId/status: no pending alert available");
    }
    else {
        const alertId = String(alert.alertId ?? alert.id);
        const patchResponse = await fetch(`${baseUrl}/api/alerts/${encodeURIComponent(alertId)}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Actioned" })
        });
        const patchBody = await patchResponse.json();
        if (!patchResponse.ok || !isRecord(patchBody) || patchBody.status !== "Actioned") {
            failures.push(`FAIL PATCH /api/alerts/:alertId/status: HTTP ${patchResponse.status}`);
        }
        else {
            passed += 1;
            console.log("PASS PATCH /api/alerts/:alertId/status");
        }
    }
}
catch (error) {
    failures.push(`FAIL PATCH /api/alerts/:alertId/status: ${error instanceof Error ? error.message : String(error)}`);
}
const totalChecks = checks.length + 1;
console.log(`\nSmoke test summary: ${passed}/${totalChecks} passed against ${baseUrl}`);
if (failures.length) {
    failures.forEach((failure) => console.error(failure));
    process.exitCode = 1;
}
else {
    console.log("All smoke tests passed.");
}
export {};
