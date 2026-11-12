import { config } from "./config/config";
import { app } from "./app";
import { pool } from "./config/db";

const server = app.listen(config.PORT, () => {
  console.log(`Listening on PORT: ${config.PORT}`);
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
