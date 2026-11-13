import { Pool } from "pg";
import { config } from "./config";

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error({ err }, "Idle database client error");
});
