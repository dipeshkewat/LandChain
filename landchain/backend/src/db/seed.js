/**
 * Run seed files from database/seeds/ against the configured database.
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const fs = require("fs");
const path = require("path");
const { pool, query } = require("./index");

const SEEDS_DIR = path.resolve(__dirname, "../../../database/seeds");

async function seed() {
  const files = fs.readdirSync(SEEDS_DIR).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(SEEDS_DIR, file), "utf-8");
    console.log(`[seed] Running: ${file}`);
    await query(sql);
    console.log(`[seed] Done: ${file}`);
  }

  console.log("[seed] All seeds applied.");
  await pool.end();
}

seed().catch((err) => {
  console.error("[seed] ERROR:", err);
  process.exit(1);
});
