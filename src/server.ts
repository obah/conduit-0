import { config } from "./utils/config";
import { createApp } from "./app";
import { pool } from "./utils/db";
import { logger } from "./utils/logger";
import { pruneExpiredRevokedTokens } from "./user/repository";

const PRUNE_INTERVAL_MS = 60 * 60 * 1000;

const server = createApp().listen(config.PORT, (err) => {
  if (err) {
    logger.fatal({ err }, "Server failed to start");
    process.exit(1);
  }

  logger.info({ port: config.PORT }, "Server listening");
});

const pruneTimer = setInterval(async () => {
  try {
    const deleted = await pruneExpiredRevokedTokens();
    if (deleted > 0) {
      logger.info({ deleted }, "Pruned expired revoked tokens");
    }
  } catch (err) {
    logger.error({ err }, "Failed to prune expired revoked tokens");
  }
}, PRUNE_INTERVAL_MS);
pruneTimer.unref();

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  clearInterval(pruneTimer);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
