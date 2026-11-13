import express from "express";
import { config } from "./config/config";
import { healthRouter } from "./health/route";

const app = express();

app.use(express.json({ limit: config.BODY_LIMIT }));

app.use("/api/health", healthRouter);

export { app };
