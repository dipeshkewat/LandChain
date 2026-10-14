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

    if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
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
        message: `Ownership transfer initiated for property ${selectedProperty?.property_code || selectedPropertyId}.`,
        transfer: result.transfer,
      });
      setTimeout(() => {
        navigate(`/properties/${selectedPropertyId}`);
      }, 3000);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Transfer Land Ownership</h1>
        <p className="page-subtitle">
          Initiate an authorized ownership change on the immutable blockchain land registry.
        </p>
      </div>

      <ErrorDisplay error={error} />

      {success && (
        <div className="success-banner" role="status">
          <span className="banner-badge">INITIATED</span>
          <div>
            <strong>Transfer Record Created:</strong> {success.message}
            <div className="text-sm mt-1">Status: Pending on-chain confirmation. Redirecting...</div>
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
                <option value="">-- Choose a property --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.property_code} — {p.location}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedProperty && (
            <div className="summary-pill-box">
              <h4>Selected Parcel</h4>
              <p><strong>Code:</strong> {selectedProperty.property_code}</p>
              <p><strong>Location:</strong> {selectedProperty.location}</p>
              <p>
                <strong>Current Owner:</strong>{" "}
                {selectedProperty.current_owner_address ? (
                  <AddressCopy value={selectedProperty.current_owner_address} />
                ) : (
                  "Unassigned"
                )}
              </p>
              {user &&
                user.wallet_address?.toLowerCase() !==
                  selectedProperty.current_owner_address?.toLowerCase() && (
                  <div className="clean-warning-box">
                    Notice: Your logged-in wallet address does not match the current recorded owner. Only the recorded owner can authorize this transfer.
                  </div>
                )}
            </div>
          )}

          <div className="form-group mt-4">
            <label htmlFor="recipient">New Owner Wallet Address *</label>
            <input
              id="recipient"
              type="text"
              placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              required
              className="form-input"
            />
            <span className="form-hint">
              Must be a valid 42-character Ethereum address (not zero address).
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full mt-4"
            disabled={loading || !selectedPropertyId || !recipientAddress}
          >
            {loading ? "Submitting Transfer..." : "Submit Ownership Transfer"}
          </button>
        </form>

        <div className="content-card">
          <div className="content-card-header">
            <h3>Transfer Rules & Requirements</h3>
          </div>
          <div className="card-body">
            <ul className="clean-guide-list">
              <li>
                <strong>Owner-Only Authorization:</strong> Smart contracts restrict transfer execution to the currently recorded owner address.
              </li>
              <li>
                <strong>Zero Address Protection:</strong> Transfers to 0x00...00 are strictly rejected.
              </li>
              <li>
                <strong>Self-Transfer Prevention:</strong> The recipient must be distinct from the current owner address.
              </li>
              <li>
                <strong>Immutable Log:</strong> Each transfer emits a permanent OwnershipTransferred event.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
