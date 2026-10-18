const express = require("express");
const crypto = require("crypto");
const multer = require("multer");
const { body, param, query: queryValidator } = require("express-validator");
const { query } = require("../db");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { logAudit } = require("../services/audit");
const blockchain = require("../services/blockchain");

const router = express.Router();

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || "10", 10);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error("Unsupported file type"), { status: 400 }));
    }
  },
});

// ── GET /api/properties ─────────────────────────────────────────────
router.get(
  "/",
  [
    queryValidator("page").optional().isInt({ min: 1 }).toInt(),
    queryValidator("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    queryValidator("search").optional().trim(),
    queryValidator("status").optional().isIn(["pending", "confirmed", "failed", "needs_reconciliation"]),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search || "";
      const status = req.query.status || null;

      let whereClause = "WHERE 1=1";
      const params = [];
      let paramIndex = 1;

      if (search) {
        whereClause += ` AND (property_code ILIKE $${paramIndex} OR location ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      if (status) {
        whereClause += ` AND chain_status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      const countResult = await query(
        `SELECT COUNT(*) FROM properties ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      const dataResult = await query(
        `SELECT id, property_code, location, area_sq_m, description,
                current_owner_address, chain_status, created_at
         FROM properties ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      res.json({
        properties: dataResult.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/properties ────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  authorize("admin"),
  upload.single("document"),
  [
    body("property_code").trim().notEmpty().withMessage("Property code is required").isLength({ max: 80 }),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("area_sq_m").isFloat({ gt: 0 }).withMessage("Area must be a positive number"),
    body("owner_address")
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage("Valid Ethereum address is required"),
    body("description").optional().trim(),
    body("blockchain_property_id")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("Blockchain property ID must be a positive integer"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { property_code, location, area_sq_m, description, owner_address, blockchain_property_id } = req.body;

      // Check duplicate property_code
      const existing = await query("SELECT id FROM properties WHERE property_code = $1", [property_code]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Property code already exists" });
      }

      // Compute SHA-256 document hash if file uploaded
      let documentHash = null;
      if (req.file) {
        const hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
        documentHash = hash.toLowerCase(); // 64-char lowercase hex, no 0x prefix
      }

      const result = await query(
        `INSERT INTO properties
           (property_code, location, area_sq_m, description, document_hash,
            current_owner_address, blockchain_property_id, created_by, chain_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         RETURNING *`,
        [
          property_code, location, area_sq_m, description || null, documentHash,
          owner_address, blockchain_property_id || null, req.user.id,
        ]
      );

      const property = result.rows[0];

      logAudit({
        userId: req.user.id,
        action: "PROPERTY_REGISTERED",
        entityType: "property",
        entityId: property.id,
        details: { property_code, owner_address, document_hash: documentHash },
      });

      res.status(201).json({ property });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/properties/:id ─────────────────────────────────────────
router.get(
  "/:id",
  [param("id").matches(UUID_REGEX).withMessage("Invalid property ID")],
  validate,
  async (req, res, next) => {
    try {
      const result = await query(
        `SELECT p.*, u.name AS created_by_name
         FROM properties p
         LEFT JOIN users u ON p.created_by = u.id
         WHERE p.id = $1`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Property not found" });
      }

      const property = result.rows[0];

      // Attempt on-chain reconciliation if connected
      if (blockchain.isConnected() && property.blockchain_property_id) {
        const reconciliation = await blockchain.reconcile(
          property.blockchain_property_id,
          property
        );
        if (reconciliation?.needsUpdate) {
          await query(
            `UPDATE properties SET current_owner_address = $1, chain_status = 'confirmed'
             WHERE id = $2`,
            [reconciliation.onChainOwner, property.id]
          );
          property.current_owner_address = reconciliation.onChainOwner;
          property.chain_status = "confirmed";
        }
      }

      res.json({ property });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/properties/:id/history ─────────────────────────────────
router.get(
  "/:id/history",
  [param("id").matches(UUID_REGEX).withMessage("Invalid property ID")],
  validate,
  async (req, res, next) => {
    try {
      const propCheck = await query("SELECT id FROM properties WHERE id = $1", [req.params.id]);
      if (propCheck.rows.length === 0) {
        return res.status(404).json({ error: "Property not found" });
      }

      const result = await query(
        `SELECT id, from_address, to_address, transaction_hash, block_number, status, created_at
         FROM ownership_transfers
         WHERE property_id = $1
         ORDER BY created_at DESC`,
        [req.params.id]
      );

      res.json({ transfers: result.rows });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/properties/:id/verify-document ────────────────────────
router.post(
  "/:id/verify-document",
  [param("id").matches(UUID_REGEX).withMessage("Invalid property ID")],
  validate,
  upload.single("document"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Document file is required" });
      }

      const propResult = await query(
        "SELECT document_hash, blockchain_property_id FROM properties WHERE id = $1",
        [req.params.id]
      );
      if (propResult.rows.length === 0) {
        return res.status(404).json({ error: "Property not found" });
      }

      const property = propResult.rows[0];
      const uploadedHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex").toLowerCase();

      const dbMatch = property.document_hash === uploadedHash;

      // Attempt on-chain verification if connected
      let onChainMatch = null;
      if (blockchain.isConnected() && property.blockchain_property_id) {
        const candidateBytes32 = "0x" + uploadedHash;
        onChainMatch = await blockchain.verifyDocument(property.blockchain_property_id, candidateBytes32);
      }

      res.json({
        uploaded_hash: uploadedHash,
        registered_hash: property.document_hash,
        database_match: dbMatch,
        blockchain_match: onChainMatch,
        blockchain_connected: blockchain.isConnected(),
        message: dbMatch
          ? "Document hash matches the registered record."
          : "Document hash does NOT match. The file bytes differ from the registered document.",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/properties/:id/transfer ───────────────────────────────
router.post(
  "/:id/transfer",
  authenticate,
  [
    param("id").matches(UUID_REGEX).withMessage("Invalid property ID"),
    body("to_address")
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage("Valid recipient Ethereum address is required"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { to_address } = req.body;

      const propResult = await query(
        "SELECT * FROM properties WHERE id = $1",
        [req.params.id]
      );
      if (propResult.rows.length === 0) {
        return res.status(404).json({ error: "Property not found" });
      }

      const property = propResult.rows[0];

      // Verify caller is current owner (by wallet address in JWT)
      if (
        !req.user.wallet_address ||
        req.user.wallet_address.toLowerCase() !== property.current_owner_address?.toLowerCase()
      ) {
        return res.status(403).json({
          error: "Only the current recorded owner can initiate a transfer",
        });
      }

      // Cannot transfer to same owner
      if (to_address.toLowerCase() === property.current_owner_address?.toLowerCase()) {
        return res.status(400).json({ error: "Cannot transfer to the current owner" });
      }

      // Create pending transfer record
      const transferResult = await query(
        `INSERT INTO ownership_transfers (property_id, from_address, to_address, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [property.id, property.current_owner_address, to_address]
      );

      const transfer = transferResult.rows[0];

      // Update property owner in DB (cache) and mark pending
      await query(
        `UPDATE properties SET current_owner_address = $1, chain_status = 'pending'
         WHERE id = $2`,
        [to_address, property.id]
      );

      logAudit({
        userId: req.user.id,
        action: "OWNERSHIP_TRANSFER_INITIATED",
        entityType: "transfer",
        entityId: transfer.id,
        details: {
          property_code: property.property_code,
          from: property.current_owner_address,
          to: to_address,
        },
      });

      res.status(201).json({ transfer });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
