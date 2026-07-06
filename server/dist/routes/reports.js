import { Router } from "express";
import { getCache, setCache } from "../services/cache.js";
import { getExecutiveSummaryReport } from "../services/reportEngine.js";
export const reportsRouter = Router();
const TTL = 60_000;
reportsRouter.get("/executive-summary", (_req, res) => {
    const cached = getCache("route:report:executive-summary");
    if (cached)
        return res.json(cached);
    res.json(setCache("route:report:executive-summary", getExecutiveSummaryReport(), TTL));
});
