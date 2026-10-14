const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
