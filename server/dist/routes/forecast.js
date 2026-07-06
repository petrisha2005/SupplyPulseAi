import { Router } from "express";
import { compareForecasts, getForecast, getForecastSummary } from "../services/forecastEngine.js";
export const forecastRouter = Router();
forecastRouter.get("/summary", (_req, res) => {
    return res.json(getForecastSummary());
});
forecastRouter.get("/compare", (req, res) => {
    const rawSkuIds = typeof req.query.skuIds === "string" ? req.query.skuIds : "";
    const skuIds = rawSkuIds.split(",").map((skuId) => skuId.trim()).filter(Boolean);
    if (!skuIds.length)
        return res.status(400).json({ error: "skuIds query parameter is required. Example: /api/forecast/compare?skuIds=SKU1,SKU2" });
    if (skuIds.length > 3)
        return res.status(400).json({ error: "Compare supports up to 3 SKUs." });
    const result = compareForecasts(skuIds);
    if (result.forecasts.length !== skuIds.length)
        return res.status(404).json({ error: "One or more SKU forecasts were not found.", foundSkuIds: result.forecasts.map((forecast) => forecast.skuId) });
    return res.json(result);
});
forecastRouter.get("/:skuId", (req, res) => {
    const forecast = getForecast(req.params.skuId);
    if (!forecast)
        return res.status(404).json({ error: "Forecast not found" });
    return res.json(forecast);
});
