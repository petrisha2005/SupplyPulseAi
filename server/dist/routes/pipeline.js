import { Router } from "express";
import { clearCache, getCache, setCache } from "../services/cache.js";
import { dataStore } from "../services/dataStore.js";
import { getPipelineStatus, runPipeline } from "../services/pipelineEngine.js";
export const pipelineRouter = Router();
const TTL = 30_000;
pipelineRouter.get("/status", (_req, res) => {
    const cached = getCache("route:pipeline:status");
    if (cached)
        return res.json(cached);
    res.json(setCache("route:pipeline:status", getPipelineStatus(), TTL));
});
pipelineRouter.get("/runs", (_req, res) => {
    const cached = getCache("route:pipeline:runs");
    if (cached)
        return res.json(cached);
    const payload = dataStore.getPipelineRuns().slice(0, 10).map((run) => ({
        runId: run.runId,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        endedAt: run.endedAt,
        mode: run.mode,
        rowsProcessed: run.rowsProcessed,
        durationSeconds: run.durationSeconds,
        cpuDurationSeconds: run.cpuDurationSeconds,
        gpuDurationSeconds: run.gpuDurationSeconds,
        speedupFactor: run.speedupFactor,
        skusScanned: run.skusScanned,
        alertsGenerated: run.alertsGenerated,
        recommendationsGenerated: run.recommendationsGenerated,
        stages: run.stages?.slice(0, 8),
        logs: run.logs?.slice(0, 8)
    }));
    res.json(setCache("route:pipeline:runs", payload, TTL));
});
pipelineRouter.post("/run", (_req, res) => {
    clearCache();
    res.json(runPipeline());
});
