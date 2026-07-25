const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
export const parseCopilotRequest = (body) => {
    if (!isRecord(body) || typeof body.question !== "string")
        return undefined;
    const question = body.question.trim();
    if (!question || question.length > 500)
        return undefined;
    if (body.context !== undefined && !isRecord(body.context))
        return undefined;
    const context = body.context ? {
        skuId: typeof body.context.skuId === "string" && body.context.skuId.trim() ? body.context.skuId.trim() : undefined,
        supplierId: typeof body.context.supplierId === "string" && body.context.supplierId.trim() ? body.context.supplierId.trim() : undefined,
        marketplace: typeof body.context.marketplace === "string" && body.context.marketplace.trim() ? body.context.marketplace.trim() : undefined
    } : undefined;
    return { question, ...(context ? { context } : {}) };
};
