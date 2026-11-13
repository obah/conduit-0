import pino from "pino";
import { config } from "./config";

export const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
  "password",
  "*.password",
  "token",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
];

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: { paths: redactPaths, censor: "[REDACTED]" },
  transport:
    config.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});
