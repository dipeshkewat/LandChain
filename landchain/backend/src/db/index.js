const path = require("path");
// Ensure env vars are loaded from backend/.env or root .env.local
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config();

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const unpooledConnectionString = process.env.DATABASE_URL_UNPOOLED || connectionString;

const isNeonOrSsl = (cs) => Boolean(cs && (cs.includes("neon.tech") || cs.includes("sslmode=require") || process.env.NODE_ENV === "production"));

const pool = new Pool({
  connectionString,
  ssl: isNeonOrSsl(connectionString) ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

const unpooledPool = new Pool({
  connectionString: unpooledConnectionString,
  ssl: isNeonOrSsl(unpooledConnectionString) ? { rejectUnauthorized: false } : false,
});

unpooledPool.on("error", (err) => {
  console.error("[DB Unpooled] Unexpected pool error:", err.message);
});

/**
 * Execute a parameterized query.
 * @param {string} text - SQL query with $1, $2… placeholders.
 * @param {any[]}  params - Bound parameter values.
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, unpooledPool, query };
