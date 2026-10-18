const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon and most cloud Postgres providers require SSL in production
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Log connection errors once (don't crash the app on transient failures)
pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

/**
 * Execute a parameterized query.
 * @param {string} text - SQL query with $1, $2… placeholders.
 * @param {any[]}  params - Bound parameter values.
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
