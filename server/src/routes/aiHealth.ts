import { Router } from "express";
import { getAIConfiguration } from "../ai/aiConfig.js";
import { getMetrics } from "../ai/aiMetrics.js";

export const aiHealthRouter = Router();

aiHealthRouter.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    aiMode: getAIConfiguration().aiMode,
    metrics: getMetrics()
  });
});
