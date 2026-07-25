import { Router } from "express";
import { answerCopilotQuestion } from "../ai/copilotService.js";
import { parseCopilotRequest } from "../ai/copilotSchemas.js";
export const copilotRouter = Router();
copilotRouter.post("/copilot", async (req, res) => {
    const input = parseCopilotRequest(req.body);
    if (!input)
        return res.status(400).json({ error: "question must be a non-empty string of 500 characters or fewer" });
    return res.json(await answerCopilotQuestion(input));
});
