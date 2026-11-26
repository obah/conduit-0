import { pinoHttp } from "pino-http";
import { logger } from "../utils/logger";
import { Request } from "express";

export const httpLogger = pinoHttp({
  logger,
  quietReqLogger: true,
  customAttributeKeys: { reqId: "requestId" },
  customProps: (req) => ({ userId: (req as Request).auth?.userId }),
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
});
