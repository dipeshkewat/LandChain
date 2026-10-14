import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProperties, getAdminStats, getUser } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorDisplay from "../components/ErrorDisplay";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getUser();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const propsData = await getProperties({ limit: 6 });
      setRecentProperties(propsData.properties || []);

      if (user?.role === "admin") {
        const statsData = await getAdminStats();
        setStats(statsData.stats);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Registry Dashboard</h1>
          <p className="page-subtitle">
            Welcome back{user ? `, ${user.name}` : ""}. Real-time blockchain land ledger overview.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/properties" className="btn btn-outline btn-sm">
            View All Properties
          </Link>
          {user?.role === "admin" && (
            <Link to="/register" className="btn btn-primary btn-sm">
              Register Property
            </Link>
          )}
        </div>
      </div>

      <ErrorDisplay error={error} onRetry={loadDashboard} />

      {/* Summary Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">TOTAL PROPERTIES</span>
            <span className="stat-value">{stats.total_properties}</span>
            <span className="stat-subtext">Recorded parcels on-chain</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">REGISTERED USERS</span>
            <span className="stat-value">{stats.total_users}</span>
            <span className="stat-subtext">Authorized accounts</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">TRANSFERS</span>
            <span className="stat-value">{stats.total_transfers}</span>
            <span className="stat-subtext">Ownership transfers</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">PENDING RECONCILIATION</span>
            <span className="stat-value">{stats.pending_registrations}</span>
            <span className="stat-subtext">Awaiting confirmation</span>
          </div>
        </div>
      )}

      {/* Quick Navigation Pills */}
      <div className="filter-pill-row">
        <Link to="/properties" className="pill-item active">
          All Properties
        </Link>
        <Link to="/verify" className="pill-item">
          Verify Document
        </Link>
        <Link to="/history" className="pill-item">
          Transfer History
        </Link>
        {user?.role === "admin" && (
          <Link to="/admin" className="pill-item">
            Admin Activity
          </Link>
        )}
      </div>

      {/* Recent Properties Table / Grid */}
      <div className="content-card">
        <div className="content-card-header flex-between">
          <div>
            <h3>Recent Land Records</h3>
            <p className="card-subtitle">Latest verified property entries</p>
          </div>
          <Link to="/properties" className="btn-link">
            Explore All ({recentProperties.length})
          </Link>
        </div>

        {recentProperties.length === 0 ? (
          <div className="empty-state">
            <p>No properties recorded yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property Code</th>
                  <th>Location</th>
                  <th>Area</th>
                  <th>Chain Status</th>
                  <th>Recorded At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentProperties.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold">
                      <Link to={`/properties/${p.id}`} className="code-link">
                        {p.property_code}
                      </Link>
                    </td>
                    <td>{p.location}</td>
                    <td>
                      <span className="pill-tag">
                        {Number(p.area_sq_m).toLocaleString()} SQM
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={p.chain_status} />
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        to={`/properties/${p.id}`}
                        className="btn btn-outline btn-xs"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
