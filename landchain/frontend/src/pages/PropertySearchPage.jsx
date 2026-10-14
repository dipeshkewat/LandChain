import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProperties } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import AddressCopy from "../components/AddressCopy";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorDisplay from "../components/ErrorDisplay";

export default function PropertySearchPage() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, [search, statusFilter, page]);

  async function fetchProperties() {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const data = await getProperties(params);
      setProperties(data.properties || []);
      setPagination(data.pagination || { total: 0, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const statusPills = [
    { label: "All Properties", value: "" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Pending", value: "pending" },
    { label: "Failed", value: "failed" },
    { label: "Needs Reconciliation", value: "needs_reconciliation" },
  ];

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Property Directory</h1>
          <p className="page-subtitle">
            Search and inspect registered land parcels and verified ownership records.
          </p>
        </div>
        <Link to="/register" className="btn btn-primary btn-sm">
          Register New Land
        </Link>
      </div>

      {/* Search Input Bar (Pill design inspired by Tim.jpg) */}
      <div className="search-bar-clean">
        <form onSubmit={handleSearchSubmit} className="search-form-clean">
          <input
            type="text"
            placeholder="Search by property code (e.g. LAND-1001) or location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="search-input-pill"
          />
        </form>

        {/* Status Filter Pills (Townhouse / Apartment / Condo style from Tim.jpg) */}
        <div className="status-pill-group">
          {statusPills.map((pill) => (
            <button
              key={pill.value}
              type="button"
              className={`pill-btn ${statusFilter === pill.value ? "active" : ""}`}
              onClick={() => {
                setStatusFilter(pill.value);
                setPage(1);
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorDisplay error={error} onRetry={fetchProperties} />

      {loading ? (
        <LoadingSpinner message="Searching registry records..." />
      ) : properties.length === 0 ? (
        <div className="empty-state">
          <h3>No Properties Found</h3>
          <p>No land registry records match your query.</p>
        </div>
      ) : (
        <div className="content-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property Code</th>
                  <th>Blockchain ID</th>
                  <th>Location</th>
                  <th>Area</th>
                  <th>Recorded Owner</th>
                  <th>Chain Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => (
                  <tr key={prop.id}>
                    <td className="font-semibold">
                      <Link to={`/properties/${prop.id}`} className="code-link">
                        {prop.property_code}
                      </Link>
                    </td>
                    <td className="font-mono text-muted text-sm">
                      {prop.blockchain_property_id ? `#${prop.blockchain_property_id}` : "—"}
                    </td>
                    <td>{prop.location}</td>
                    <td>
                      <span className="pill-tag">
                        {Number(prop.area_sq_m).toLocaleString()} SQM
                      </span>
                    </td>
                    <td>
                      {prop.current_owner_address ? (
                        <AddressCopy value={prop.current_owner_address} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <StatusBadge status={prop.chain_status} />
                    </td>
                    <td>
                      <Link to={`/properties/${prop.id}`} className="btn btn-outline btn-xs">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="page-indicator">
            Page {page} of {pagination.totalPages} ({pagination.total} records)
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
