import { config } from "./utils/config";
import { createApp } from "./app";
import { pool } from "./utils/db";
import { logger } from "./utils/logger";

const server = createApp().listen(config.PORT, (err) => {
  if (err) {
    logger.fatal({ err }, "Server failed to start");
    process.exit(1);
  }

  logger.info({ port: config.PORT }, "Server listening");
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
