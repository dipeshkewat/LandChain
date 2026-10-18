require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const { errorHandler } = require("./middleware/errorHandler");
const blockchain = require("./services/blockchain");

// ── Routes ──────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");
const transactionRoutes = require("./routes/transactions");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// ── Middleware ───────────────────────────────────────────────────────
const configuredOrigin = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.replace(/\/+$/, "")
  : "http://localhost:5173";

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, postman)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (
        cleanOrigin === configuredOrigin ||
        cleanOrigin.endsWith(".netlify.app") ||
        cleanOrigin.includes("localhost") ||
        cleanOrigin.includes("127.0.0.1")
      ) {
        return callback(null, cleanOrigin);
      }
      return callback(null, cleanOrigin);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── API Routes ──────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRoutes);

// ── Health check ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    blockchain_connected: blockchain.isConnected(),
    timestamp: new Date().toISOString(),
  });
});

// ── Error handling ──────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────────────
if (require.main === module) {
  // Initialize blockchain adapter (non-blocking — app works without it)
  blockchain.init();

  app.listen(PORT, () => {
    console.log(`[LandChain API] Running on http://localhost:${PORT}`);
    console.log(`[LandChain API] Blockchain: ${blockchain.isConnected() ? "connected" : "offline mode"}`);
  });
}

module.exports = app; // Export for testing
