import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProperty, getPropertyHistory, getUser } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import AddressCopy from "../components/AddressCopy";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorDisplay from "../components/ErrorDisplay";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getUser();

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [propData, histData] = await Promise.all([
        getProperty(id),
        getPropertyHistory(id),
      ]);
      setProperty(propData.property);
      setHistory(histData.history || histData.transfers || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading property details..." />;
  if (error) return <div className="page-container"><ErrorDisplay error={error} onRetry={loadData} /></div>;
  if (!property) return null;

  const isOwner =
    user &&
    (user.wallet_address?.toLowerCase() === property.current_owner_address?.toLowerCase() ||
      user.role === "admin");

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <div className="breadcrumbs text-sm text-muted mb-1">
            <Link to="/properties">Properties</Link> / <span>{property.property_code}</span>
          </div>
          <h1>{property.property_code}</h1>
          <p className="page-subtitle">{property.location}</p>
        </div>
        <div className="header-actions">
          <Link to={`/verify?code=${property.property_code}`} className="btn btn-outline btn-sm">
            Verify Document
          </Link>
          {isOwner && (
            <Link to={`/transfer?propertyId=${property.id}`} className="btn btn-primary btn-sm">
              Transfer Ownership
            </Link>
          )}
        </div>
      </div>

      <div className="two-column-grid">
        {/* Main Details Card */}
        <div className="content-card">
          <div className="content-card-header flex-between">
            <h3>Registry Information</h3>
            <StatusBadge status={property.chain_status} />
          </div>
          <div className="card-body">
            <div className="clean-info-list">
              <div className="info-row">
                <span className="info-key">Blockchain Property ID</span>
                <span className="info-val font-mono">
                  {property.blockchain_property_id ? `#${property.blockchain_property_id}` : "Not assigned"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Location</span>
                <span className="info-val">{property.location}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Area</span>
                <span className="info-val">
                  <span className="pill-tag">{Number(property.area_sq_m).toLocaleString()} SQM</span>
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Description</span>
                <span className="info-val">{property.description || "No description provided."}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Current Recorded Owner</span>
                <div className="info-val">
                  {property.current_owner_address ? (
                    <AddressCopy value={property.current_owner_address} />
                  ) : (
                    "Unassigned"
                  )}
                </div>
              </div>
              <div className="info-row">
                <span className="info-key">Document SHA-256 Digest</span>
                <div className="info-val">
                  {property.document_hash ? (
                    <AddressCopy value={property.document_hash} chars={12} />
                  ) : (
                    "None"
                  )}
                </div>
              </div>
              <div className="info-row">
                <span className="info-key">Registration Tx Hash</span>
                <div className="info-val">
                  {property.registration_tx_hash ? (
                    <AddressCopy value={property.registration_tx_hash} />
                  ) : (
                    "Pending confirmation"
                  )}
                </div>
              </div>
              <div className="info-row">
                <span className="info-key">Recorded At</span>
                <span className="info-val text-muted text-sm">
                  {new Date(property.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="clean-footer-notice">
            <p className="text-xs text-muted">
              Prototype Notice: Indicates recorded ownership on the local demonstration ledger. Does not constitute official government legal title adjudication.
            </p>
          </div>
        </div>

        {/* Ownership History Card */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>Ownership History</h3>
          </div>
          <div className="card-body">
            {history.length === 0 ? (
              <div className="empty-state">
                <p>No ownership transfer records logged yet.</p>
              </div>
            ) : (
              <div className="clean-timeline">
                {history.map((item, idx) => (
                  <div key={item.id || idx} className="clean-timeline-item">
                    <div className="timeline-title-row">
                      <span className="font-semibold text-sm">Ownership Transfer</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="text-xs text-muted mt-1">
                      From: <AddressCopy value={item.from_address} />
                    </div>
                    <div className="text-xs text-muted mt-1">
                      To: <AddressCopy value={item.to_address} />
                    </div>
                    {item.transaction_hash && (
                      <div className="text-xs mt-1">
                        Tx: <AddressCopy value={item.transaction_hash} />
                      </div>
                    )}
                    <div className="text-xs text-muted mt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
