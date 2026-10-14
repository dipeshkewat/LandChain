import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTransactions, getTransaction } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import AddressCopy from "../components/AddressCopy";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorDisplay from "../components/ErrorDisplay";

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hash lookup
  const [searchHash, setSearchHash] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  async function fetchHistory() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions({ page, limit: 15 });
      setTransactions(data.transactions || []);
      setPagination(data.pagination || { total: 0, limit: 15, totalPages: 1 });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!searchHash.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const data = await getTransaction(searchHash.trim());
      setLookupResult(data);
    } catch (err) {
      setLookupError(err);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Transaction History</h1>
        <p className="page-subtitle">
          Auditable timeline of on-chain registrations and ownership transfers.
        </p>
      </div>

      {/* Transaction Hash Lookup Box */}
      <div className="content-card mb-6">
        <div className="content-card-header">
          <h3>Lookup by Transaction Hash</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleLookup} className="search-bar-clean">
            <input
              type="text"
              placeholder="Enter 66-character transaction hash (0x...)"
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              className="search-input-pill"
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm ml-2"
              disabled={lookupLoading || !searchHash}
            >
              {lookupLoading ? "Searching..." : "Lookup"}
            </button>
          </form>

          {lookupError && <ErrorDisplay error={lookupError} />}

          {lookupResult && (
            <div className="lookup-result-clean mt-4">
              <h4>Lookup Details</h4>
              {lookupResult.transfer && (
                <div className="clean-info-list">
                  <div className="info-row">
                    <span className="info-key">Type</span>
                    <span className="info-val">Ownership Transfer</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Property</span>
                    <span className="info-val">
                      <Link to={`/properties/${lookupResult.transfer.property_id}`}>
                        {lookupResult.transfer.property_code || "View Property"}
                      </Link>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">From</span>
                    <div className="info-val">
                      <AddressCopy value={lookupResult.transfer.from_address} />
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-key">To</span>
                    <div className="info-val">
                      <AddressCopy value={lookupResult.transfer.to_address} />
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Status</span>
                    <span className="info-val">
                      <StatusBadge status={lookupResult.transfer.status} />
                    </span>
                  </div>
                </div>
              )}

              {lookupResult.registration && (
                <div className="clean-info-list">
                  <div className="info-row">
                    <span className="info-key">Type</span>
                    <span className="info-val">Property Registration</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Property Code</span>
                    <span className="info-val">
                      <Link to={`/properties/${lookupResult.registration.id}`}>
                        {lookupResult.registration.property_code}
                      </Link>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Chain Status</span>
                    <span className="info-val">
                      <StatusBadge status={lookupResult.registration.chain_status} />
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ErrorDisplay error={error} onRetry={fetchHistory} />

      {loading ? (
        <LoadingSpinner message="Loading transaction logs..." />
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <h3>No Transactions Logged Yet</h3>
          <p>Ownership transfers executed on the platform will appear here.</p>
        </div>
      ) : (
        <div className="content-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>From (Previous Owner)</th>
                  <th>To (New Owner)</th>
                  <th>Tx Hash</th>
                  <th>Block</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-semibold">
                      {tx.property_code ? (
                        <Link to={`/properties/${tx.property_id}`} className="code-link">
                          {tx.property_code}
                        </Link>
                      ) : (
                        "Property"
                      )}
                    </td>
                    <td>
                      <AddressCopy value={tx.from_address} />
                    </td>
                    <td>
                      <AddressCopy value={tx.to_address} />
                    </td>
                    <td>
                      {tx.transaction_hash ? (
                        <AddressCopy value={tx.transaction_hash} />
                      ) : (
                        <span className="text-muted">Pending Tx</span>
                      )}
                    </td>
                    <td className="text-muted font-mono text-sm">
                      {tx.block_number ? `#${tx.block_number}` : "—"}
                    </td>
                    <td>
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(tx.created_at).toLocaleString()}
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
