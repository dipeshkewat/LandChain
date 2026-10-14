const { query } = require("../db");

/**
 * Insert an audit-log entry. Fire-and-forget — never blocks the request.
 * @param {{ userId?: string, action: string, entityType: string, entityId?: string, details?: object }} entry
 */
async function logAudit({ userId, action, entityType, entityId, details }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId || null, action, entityType, entityId || null, details ? JSON.stringify(details) : "{}"]
    );
  } catch (err) {
    // Audit failures must not break the main flow
    console.error("[audit] Failed to write audit log:", err.message);
  }
}

module.exports = { logAudit };
