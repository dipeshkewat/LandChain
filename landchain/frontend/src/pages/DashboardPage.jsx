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
      const [propsData, statsData] = await Promise.allSettled([
        getProperties({ limit: 6 }),
        getAdminStats(),
      ]);

      if (propsData.status === "fulfilled") {
        setRecentProperties(propsData.value.properties || []);
      }
      if (statsData.status === "fulfilled" && statsData.value?.stats) {
        setStats(statsData.value.stats);
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
            Welcome{user ? `, ${user.name}` : ""}. Real-time blockchain title ledger and cadastre overview.
          </p>
        </div>
        <div className="header-actions">
          {user?.role === "viewer" ? (
            <>
              <Link to="/properties" className="btn btn-primary btn-sm">
                🔍 Browse Directory
              </Link>
              <Link to="/verify" className="btn btn-outline btn-sm">
                🛡️ Verify Deed
              </Link>
            </>
          ) : user?.role === "admin" ? (
            <>
              <Link to="/register" className="btn btn-primary btn-sm">
                + Register Land
              </Link>
              <Link to="/admin" className="btn btn-outline btn-sm">
                ⚙️ Admin Panel
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-sm">
                + Register Land
              </Link>
              <Link to="/transfer" className="btn btn-outline btn-sm">
                🔄 Transfer Title
              </Link>
            </>
          )}
        </div>
      </div>

      <ErrorDisplay error={error} onRetry={loadDashboard} />

      {/* Hero Action Cards */}
      <div className="dashboard-hero-grid mb-6">
        {user?.role === "viewer" ? (
          <>
            <Link to="/properties" className="dashboard-action-card card-register">
              <div className="action-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div className="action-card-content">
                <h4>Property Directory</h4>
                <p>Search, filter, and review verified land parcels, surveys, and ownership deeds.</p>
                <span className="card-cta-link">Explore Listings →</span>
              </div>
            </Link>

            <Link to="/verify" className="dashboard-action-card card-verify">
              <div className="action-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div className="action-card-content">
                <h4>Verify Title Deed</h4>
                <p>Upload any deed file to check cryptographic hash against the blockchain ledger.</p>
                <span className="card-cta-link">Verify Document →</span>
              </div>
            </Link>

            <Link to="/history" className="dashboard-action-card card-transfer">
              <div className="action-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="action-card-content">
                <h4>Transaction Ledger</h4>
                <p>Transparent public record of immutable blockchain transfers and settlements.</p>
                <span className="card-cta-link">View Ledger →</span>
              </div>
            </Link>
          </>
        ) : user?.role === "admin" ? (
          <>
            <Link to="/register" className="dashboard-action-card card-register">
              <div className="action-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <div className="action-card-content">
                <h4>Register Land Parcel</h4>
                <p>Mint new parcel metadata, attach title deed, and compute cryptographic digest.</p>
                <span className="card-cta-link">Start Registration →</span>
              </div>
            </Link>

            <Link to="/admin" className="dashboard-action-card card-transfer">
              <div className="action-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
              <div className="action-card-content">
                <h4>Cadastral Control Panel</h4>
                <p>Inspect consensus status, pending reconciliation, and immutable system audit logs.</p>
                <span className="card-cta-link">Open Control Panel →</span>
              </div>
            </Link>

            <Link to="/verify" className="dashboard-action-card card-verify">
              <div className="action-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div className="action-card-content">
                <h4>Verify Title Deed</h4>
                <p>Check raw byte integrity against the blockchain record.</p>
                <span className="card-cta-link">Verify Document →</span>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link to="/register" className="dashboard-action-card card-register">
              <div className="action-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <div className="action-card-content">
                <h4>Register Land Parcel</h4>
                <p>Submit title deed application and compute cryptographic hash for verification.</p>
                <span className="card-cta-link">Start Registration →</span>
              </div>
            </Link>

            <Link to="/transfer" className="dashboard-action-card card-transfer">
              <div className="action-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9"></polyline>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                  <polyline points="7 23 3 19 7 15"></polyline>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                </svg>
              </div>
              <div className="action-card-content">
                <h4>Transfer Ownership</h4>
                <p>Execute authorized title conveyance to a new owner wallet address.</p>
                <span className="card-cta-link">Transfer Title →</span>
              </div>
            </Link>

            <Link to="/verify" className="dashboard-action-card card-verify">
              <div className="action-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <div className="action-card-content">
                <h4>Verify Title Deed</h4>
                <p>Upload deed file to check raw byte integrity against the blockchain record.</p>
                <span className="card-cta-link">Verify Document →</span>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="stats-grid mb-6">
          <div className="stat-card stat-accent-blue">
            <span className="stat-label">TOTAL PROPERTIES</span>
            <span className="stat-value">{stats.total_properties}</span>
            <span className="stat-subtext">Recorded parcels on-chain</span>
          </div>
          <div className="stat-card stat-accent-purple">
            <span className="stat-label">REGISTERED USERS</span>
            <span className="stat-value">{stats.total_users}</span>
            <span className="stat-subtext">Authorized accounts & owners</span>
          </div>
          <div className="stat-card stat-accent-emerald">
            <span className="stat-label">TRANSFERS COMPLETED</span>
            <span className="stat-value">{stats.total_transfers}</span>
            <span className="stat-subtext">Immutable ownership deeds</span>
          </div>
          <div className="stat-card stat-accent-amber">
            <span className="stat-label">STATUS CONFIRMED</span>
            <span className="stat-value">
              {stats.status_breakdown?.find((s) => s.chain_status === "confirmed")?.count || stats.total_properties}
            </span>
            <span className="stat-subtext">Cryptographically verified</span>
          </div>
        </div>
      )}

      {/* Recent Properties Table */}
      <div className="content-card">
        <div className="content-card-header flex-between">
          <div>
            <h3>Recent Land Records</h3>
            <p className="card-subtitle">Latest verified property entries on the decentralized ledger</p>
          </div>
          <Link to="/properties" className="btn-link font-semibold">
            Explore All Parcels ({recentProperties.length}) →
          </Link>
        </div>

        {recentProperties.length === 0 ? (
          <div className="empty-state">
            <p>No properties recorded yet. Click "Register Land" above to add the first parcel!</p>
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
                        Inspect Parcel
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
