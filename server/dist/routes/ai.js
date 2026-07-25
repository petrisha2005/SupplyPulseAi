import { Router } from "express";
import { generateMorningBrief, investigateRisk, investigateSku } from "../ai/agentService.js";
import { parseRiskInvestigationRequest, parseSkuInvestigationRequest } from "../ai/schemas.js";
export const aiRouter = Router();
aiRouter.post("/risk-investigation", async (req, res) => {
    const input = parseRiskInvestigationRequest(req.body);
    if (!input)
        return res.status(400).json({ error: "skuId must be a non-empty string" });
    const investigation = await investigateRisk(input.skuId);
    if (!investigation)
        return res.status(404).json({ error: "SKU not found" });
    return res.json(investigation);
});
aiRouter.post("/morning-brief", async (_req, res) => {
    const brief = await generateMorningBrief();
    return res.json(brief);
});
aiRouter.post("/sku-investigation", async (req, res) => {
    const input = parseSkuInvestigationRequest(req.body);
    if (!input)
        return res.status(400).json({ error: "skuId and question must be non-empty strings; question must be 500 characters or fewer" });
    const investigation = await investigateSku(input.skuId, input.question);
    if (!investigation)
        return res.status(404).json({ error: "SKU not found" });
    return res.json(investigation);
});
