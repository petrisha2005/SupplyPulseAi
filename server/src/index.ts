import cors from "cors";
import type { CorsOptions } from "cors";
import express from "express";
import { alertsRouter } from "./routes/alerts.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { eventsRouter } from "./routes/events.js";
import { forecastRouter } from "./routes/forecast.js";
import { inventoryRouter } from "./routes/inventory.js";
import { pipelineRouter } from "./routes/pipeline.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { reportsRouter } from "./routes/reports.js";
import { risksRouter } from "./routes/risks.js";
import { simulateRouter } from "./routes/simulate.js";
import { suppliersRouter } from "./routes/suppliers.js";

const app = express();
const port = Number(process.env.PORT ?? 5050);
const host = process.env.HOST ?? (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const clientOrigin = process.env.CLIENT_ORIGIN;
const allowedOrigins = new Set([
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://localhost:5173",
  ...(clientOrigin ? clientOrigin.split(",").map((origin) => origin.trim()).filter(Boolean) : [])
]);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS origin not allowed: ${origin}`));
  }
};

app.use(cors(corsOptions));
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const started = Date.now();
    let responseBytes = 0;
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = ((chunk: unknown, ...args: unknown[]) => {
      if (chunk) responseBytes += Buffer.byteLength(Buffer.isBuffer(chunk) ? chunk : String(chunk));
      return originalWrite(chunk as never, ...(args as []));
    }) as typeof res.write;

    res.end = ((chunk: unknown, ...args: unknown[]) => {
      if (chunk) responseBytes += Buffer.byteLength(Buffer.isBuffer(chunk) ? chunk : String(chunk));
      return originalEnd(chunk as never, ...(args as []));
    }) as typeof res.end;

    res.on("finish", () => {
      const durationMs = Date.now() - started;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms ${responseBytes}b`);
    });
    next();
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "SupplyPulse AI API", timestamp: new Date().toISOString() });
});

app.use("/api/dashboard", dashboardRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/risks", risksRouter);
app.use("/api/forecast", forecastRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/events", eventsRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/pipeline", pipelineRouter);
app.use("/api/simulate", simulateRouter);
app.use("/api/reports", reportsRouter);

app.listen(port, host, () => {
  console.log(`SupplyPulse AI API listening on http://${host}:${port}`);
});
