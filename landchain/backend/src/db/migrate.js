/**
 * Run database migrations from the SQL files in database/migrations/.
 * Tracks applied migrations in a `schema_migrations` table.
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const fs = require("fs");
const path = require("path");
const { pool, query } = require("./index");

const MIGRATIONS_DIR = path.resolve(__dirname, "../../../database/migrations");

async function migrate() {
  // Ensure tracking table exists
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const applied = await query("SELECT filename FROM schema_migrations ORDER BY filename");
  const appliedSet = new Set(applied.rows.map((r) => r.filename));

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`[migrate] Already applied: ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    console.log(`[migrate] Applying: ${file}`);
    await query(sql);
    await query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
    console.log(`[migrate] Done: ${file}`);
  }

  console.log("[migrate] All migrations applied.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("[migrate] ERROR:", err);
  process.exit(1);
});
