const express = require("express");
const { param } = require("express-validator");
const { query } = require("../db");
const { validate } = require("../middleware/validate");
const blockchain = require("../services/blockchain");

const router = express.Router();

// ── GET /api/transactions ──────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const offset = (page - 1) * limit;

    const countResult = await query("SELECT COUNT(*) FROM ownership_transfers");
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT ot.*, p.property_code, p.location
       FROM ownership_transfers ot
       LEFT JOIN properties p ON ot.property_id = p.id
       ORDER BY ot.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      transactions: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/transactions/:hash ─────────────────────────────────────
router.get(
  "/:hash",
  [
    param("hash")
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage("Invalid transaction hash"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { hash } = req.params;

      // Check database first
      const transferResult = await query(
        `SELECT ot.*, p.property_code
         FROM ownership_transfers ot
         LEFT JOIN properties p ON ot.property_id = p.id
         WHERE ot.transaction_hash = $1`,
        [hash]
      );

      const registrationResult = await query(
        `SELECT id, property_code, registration_tx_hash, chain_status
         FROM properties
         WHERE registration_tx_hash = $1`,
        [hash]
      );

      // Attempt on-chain lookup
      let onChainReceipt = null;
      if (blockchain.isConnected()) {
        onChainReceipt = await blockchain.getTransactionReceipt(hash);
      }

      res.json({
        transfer: transferResult.rows[0] || null,
        registration: registrationResult.rows[0] || null,
        on_chain_receipt: onChainReceipt
          ? {
              blockNumber: onChainReceipt.blockNumber,
              status: onChainReceipt.status === 1 ? "confirmed" : "failed",
              gasUsed: onChainReceipt.gasUsed?.toString(),
            }
          : null,
        blockchain_connected: blockchain.isConnected(),
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
