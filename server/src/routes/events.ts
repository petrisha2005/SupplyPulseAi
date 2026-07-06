import { Router } from "express";
import { DEMO_TODAY, daysBetween } from "../utils/dates.js";
import { dataStore } from "../services/dataStore.js";

export const eventsRouter = Router();

eventsRouter.get("/", (_req, res) => {
  res.json(dataStore.getAllEvents().map((event) => ({
    ...event,
    id: event.eventId,
    date: event.startDate,
    channels: event.affectedChannels,
    multiplier: event.demandMultiplier,
    daysAway: daysBetween(DEMO_TODAY, event.startDate)
  })));
});
