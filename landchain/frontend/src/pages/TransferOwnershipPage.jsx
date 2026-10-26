import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getProperties, getProperty, transferProperty, getUser } from "../services/api";
import AddressCopy from "../components/AddressCopy";
import ErrorDisplay from "../components/ErrorDisplay";
import LoadingSpinner from "../components/LoadingSpinner";

export default function TransferOwnershipPage() {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("propertyId") || "";

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(preselectedId);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingProps, setFetchingProps] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPropertiesList() {
      try {
        const data = await getProperties({ limit: 100 });
        setProperties(data.properties || []);
      } catch (err) {
        console.error("Failed to load properties:", err);
      } finally {
        setFetchingProps(false);
      }
    }
    loadPropertiesList();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      loadSelectedProperty(selectedPropertyId);
    } else {
      setSelectedProperty(null);
    }
  }, [selectedPropertyId]);

  async function loadSelectedProperty(id) {
    try {
      const data = await getProperty(id);
      setSelectedProperty(data.property);
    } catch (err) {
      console.error("Failed to fetch property:", err);
    }
  }

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedPropertyId) {
      setError(new Error("Please select a property to transfer."));
      return;
    }

    if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/i.test(recipientAddress)) {
      setError(new Error("Please provide a valid 42-character Ethereum hex address (0x...)."));
      return;
    }

    if (
      selectedProperty &&
      recipientAddress.toLowerCase() === selectedProperty.current_owner_address?.toLowerCase()
    ) {
      setError(new Error("Recipient address cannot be the same as the current recorded owner."));
      return;
    }

    setLoading(true);
    try {
      const result = await transferProperty(selectedPropertyId, recipientAddress);
      setSuccess({
        message: `Ownership successfully transferred to ${recipientAddress.slice(0, 10)}... for parcel ${selectedProperty?.property_code || selectedPropertyId}.`,
        transfer: result.transfer,
      });
      setTimeout(() => {
        navigate(`/properties/${selectedPropertyId}`);
      }, 2500);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentOwner =
    user?.wallet_address &&
    selectedProperty?.current_owner_address &&
    user.wallet_address.toLowerCase() === selectedProperty.current_owner_address.toLowerCase();

  const isAuthority = user?.role === "admin" || !user;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Transfer Land Ownership</h1>
        <p className="page-subtitle">
          Execute an authorized ownership conveyance on the immutable blockchain ledger.
        </p>
      </div>

      <ErrorDisplay error={error} />

      {success && (
        <div className="success-banner" role="status">
          <div className="success-icon">✓</div>
          <div>
            <strong>Conveyance Confirmed on Ledger!</strong> {success.message}
            <div className="text-sm mt-1">
              Transaction Hash: <span className="font-mono text-xs">{success.transfer?.transaction_hash}</span>
            </div>
            <div className="text-sm mt-1">Redirecting to updated property record...</div>
          </div>
        </div>
      )}

      <div className="two-column-grid">
        <form onSubmit={handleTransfer} className="form-card-clean">
          <div className="form-group">
            <label htmlFor="property-select">Select Property Record *</label>
            {fetchingProps ? (
              <LoadingSpinner message="Loading properties..." />
            ) : (
              <select
                id="property-select"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                required
                className="form-select"
              >
                <option value="">-- Choose a property to transfer --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.property_code} — {p.location} ({p.current_owner_address ? p.current_owner_address.slice(0, 8) + '...' : 'Unassigned'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedProperty && (
            <div className="summary-pill-box">
              <div className="flex-between mb-2">
                <h4>Parcel Summary</h4>
                <span className="badge-confirmed">{selectedProperty.chain_status}</span>
              </div>
              <div className="clean-info-list text-sm">
                <div className="info-row">
                  <span className="info-key">Property Code:</span>
                  <span className="info-val font-semibold">{selectedProperty.property_code}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Location:</span>
                  <span className="info-val">{selectedProperty.location}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">Current Owner:</span>
                  <div className="info-val">
                    <AddressCopy value={selectedProperty.current_owner_address} />
                  </div>
                </div>
              </div>

              {/* Authority Status Notification */}
              <div className="mt-3">
                {isCurrentOwner ? (
                  <div className="clean-success-box text-xs">
                    ✓ Verified: You are logged in with the title owner wallet address.
                  </div>
                ) : isAuthority ? (
                  <div className="clean-info-box text-xs">
                    ⚡ Authorized: Operating with Land Registry Authority clearance to record legal conveyance.
                  </div>
                ) : (
                  <div className="clean-warning-box text-xs">
                    Notice: Your logged-in account does not match this parcel's owner. Please ensure administrative or deed power-of-attorney authorization.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-group mt-4">
            <label htmlFor="recipient">New Owner Recipient Wallet Address *</label>
            <input
              id="recipient"
              type="text"
              placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              required
              className="form-input"
            />
            <div className="quick-input-tags mt-1">
              <button
                type="button"
                className="input-tag-btn"
                onClick={() => setRecipientAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")}
              >
                Send to Demo Owner
              </button>
              <button
                type="button"
                className="input-tag-btn"
                onClick={() => setRecipientAddress("0x1234567890abcdef1234567890abcdef12345678")}
              >
                Send to Demo Admin
              </button>
              <button
                type="button"
                className="input-tag-btn"
                onClick={() => setRecipientAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")}
              >
                Send to Hardhat Account #1
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg mt-4"
            disabled={loading || !selectedPropertyId || !recipientAddress}
          >
            {loading ? "Recording Transfer on Blockchain..." : "Execute Title Conveyance"}
          </button>
        </form>

        <div className="content-card">
          <div className="content-card-header">
            <h3>Conveyance Rules & Smart Contract Guarantees</h3>
          </div>
          <div className="card-body">
            <ul className="clean-guide-list">
              <li>
                <strong>Cryptographic Title Verification:</strong> The smart contract validates ownership records before signing state changes.
              </li>
              <li>
                <strong>Zero Address Rejection:</strong> Conveyance to null or burn addresses (<code>0x00...00</code>) is permanently blocked.
              </li>
              <li>
                <strong>Self-Transfer Prevention:</strong> The transferee cannot be identical to the grantor.
              </li>
              <li>
                <strong>Immutable Audit Trail:</strong> Each executed transfer emits an <code>OwnershipTransferred</code> event with block height and cryptographic timestamp.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
