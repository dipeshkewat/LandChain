const express = require("express");
const { query } = require("../db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/admin/stats ────────────────────────────────────────────
router.get(
  "/stats",
  async (req, res, next) => {
    try {
      const [propertiesCount, usersCount, transfersCount, pendingCount, auditRecent] =
        await Promise.all([
          query("SELECT COUNT(*) FROM properties"),
          query("SELECT COUNT(*) FROM users"),
          query("SELECT COUNT(*) FROM ownership_transfers"),
          query("SELECT COUNT(*) FROM properties WHERE chain_status = 'pending'"),
          query(
            `SELECT al.*, u.name AS user_name
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             ORDER BY al.created_at DESC
             LIMIT 20`
          ),
        ]);

      // Status breakdown
      const statusBreakdown = await query(
        `SELECT chain_status, COUNT(*) as count
         FROM properties
         GROUP BY chain_status`
      );

      res.json({
        stats: {
          total_properties: parseInt(propertiesCount.rows[0].count, 10),
          total_users: parseInt(usersCount.rows[0].count, 10),
          total_transfers: parseInt(transfersCount.rows[0].count, 10),
          pending_registrations: parseInt(pendingCount.rows[0].count, 10),
          status_breakdown: statusBreakdown.rows,
        },
        recent_activity: auditRecent.rows,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
