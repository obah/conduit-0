import express from "express";
import healthRouter from "./routes/health.route";
import { config } from "./config/config";

const app = express();

app.use(express.json({ limit: config.BODY_LIMIT }));

app.use("/api/health", healthRouter);

export { app };
