import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "../src/config/db";

const dir = join(import.meta.dirname, "../migrations");

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);

  const done = new Set(
    (await pool.query("SELECT name FROM schema_migrations")).rows.map(
      (r) => r.name,
    ),
  );

  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (done.has(file)) continue;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(readFileSync(join(dir, file), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
      console.log("applied", file);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
