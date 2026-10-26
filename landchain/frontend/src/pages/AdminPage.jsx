import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAdminStats, getUser, demoLogin } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorDisplay from "../components/ErrorDisplay";

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getUser();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  async function loadAdminData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminStats();
      setStats(data.stats);
      setActivity(data.recent_activity || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state-box" style={{ padding: "3.5rem 2rem", textAlign: "center", background: "var(--card-bg)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", margin: "2rem auto", maxWidth: "600px" }}>
          <div style={{ fontSize: "2.8rem", marginBottom: "1rem" }}>🔒</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "0.5rem" }}>Administrator Privileges Required</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "1.75rem" }}>
            The Cadastral Authority Control Panel is restricted to authorized Land Registry Officers.
            {user ? (
              <> You are currently logged in as <strong>{user.name}</strong> (<span className={`user-role-badge role-${user.role}`}>{user.role}</span>).</>
            ) : (
              " Please sign in with an administrative account to access system telemetry."
            )}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/" className="btn btn-primary btn-sm">
              Return to Dashboard
            </Link>
            <Link to="/properties" className="btn btn-outline btn-sm">
              Property Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading admin control panel..." />;

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Admin Control Panel</h1>
          <p className="page-subtitle">
            Cadastral authority management, consensus audit trail, and blockchain system metrics.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/register" className="btn btn-primary btn-sm">
            + Register Land
          </Link>
        </div>
      </div>

      <ErrorDisplay error={error} onRetry={loadAdminData} />

      {stats && (
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <span className="stat-label">TOTAL PROPERTIES</span>
            <span className="stat-value">{stats.total_properties}</span>
            <span className="stat-subtext">Registered land parcels</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">SYSTEM USERS</span>
            <span className="stat-value">{stats.total_users}</span>
            <span className="stat-subtext">Authorized accounts</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">TOTAL TRANSFERS</span>
            <span className="stat-value">{stats.total_transfers}</span>
            <span className="stat-subtext">Ownership changes</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">PENDING RECONCILIATION</span>
            <span className="stat-value">{stats.pending_registrations}</span>
            <span className="stat-subtext">Pending transactions</span>
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {stats?.status_breakdown && (
        <div className="content-card mb-6">
          <div className="content-card-header">
            <h3>Registry Status Breakdown</h3>
          </div>
          <div className="card-body">
            <div className="status-pills-row">
              {stats.status_breakdown.map((item) => (
                <div key={item.chain_status} className="status-pill-clean">
                  <StatusBadge status={item.chain_status} />
                  <span className="status-count">{item.count} properties</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Activity */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>System Audit Logs</h3>
        </div>
        <div className="card-body">
          {activity.length === 0 ? (
            <div className="empty-state">
              <p>No audit events logged yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((log) => (
                    <tr key={log.id}>
                      <td className="text-sm text-muted">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="font-semibold">{log.user_name || "System"}</td>
                      <td>
                        <span className="badge-action-clean">{log.action}</span>
                      </td>
                      <td>
                        {log.entity_type}{" "}
                        {log.entity_id ? `(${log.entity_id.slice(0, 8)}…)` : ""}
                      </td>
                      <td className="cell-details">
                        <div className="json-snippet" title={JSON.stringify(log.details)}>
                          {JSON.stringify(log.details)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
