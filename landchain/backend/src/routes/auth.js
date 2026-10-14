const express = require("express");
const bcrypt = require("bcrypt");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { query } = require("../db");
const { generateToken } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { logAudit } = require("../services/audit");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many login attempts, please try again later" },
});

// ── POST /api/auth/register ─────────────────────────────────────────
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 120 }),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("wallet_address")
      .optional({ values: "falsy" })
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage("Invalid Ethereum address"),
    body("role")
      .optional()
      .isIn(["owner", "viewer"])
      .withMessage("Role must be owner or viewer"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, wallet_address, role } = req.body;

      // Check existing email
      const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await query(
        `INSERT INTO users (name, email, password_hash, wallet_address, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, wallet_address, role, created_at`,
        [name, email, passwordHash, wallet_address || null, role || "viewer"]
      );

      const user = result.rows[0];
      const token = generateToken(user);

      logAudit({
        userId: user.id,
        action: "USER_REGISTERED",
        entityType: "user",
        entityId: user.id,
        details: { email: user.email },
      });

      res.status(201).json({ user, token });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/login ────────────────────────────────────────────
router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const result = await query(
        "SELECT id, name, email, password_hash, wallet_address, role FROM users WHERE email = $1",
        [email]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = generateToken(user);
      const { password_hash, ...safeUser } = user;

      res.json({ user: safeUser, token });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
