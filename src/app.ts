import express from "express";
import { config } from "./utils/config";
import { healthRouter } from "./health/route";
import { customersRouter } from "./customer/routes";
import { errorHandler } from "./middleware/error-handler";
import { httpLogger } from "./middleware/http-logger";
import { notFound } from "./middleware/not-found";
import { accountsRouter } from "./account/route";

export function createApp() {
  const app = express();

  app.use(httpLogger);
  app.use(express.json({ limit: config.BODY_LIMIT }));

  app.use("/api/health", healthRouter);
  app.use("/api/customers", customersRouter);
  app.use("/api/accounts", accountsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
