import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createProperty, getUser } from "../services/api";
import { hashFile } from "../services/blockchain";
import ErrorDisplay from "../components/ErrorDisplay";

export default function RegisterPropertyPage() {
  const user = getUser();
  const defaultWallet = user?.wallet_address || "0x1234567890abcdef1234567890abcdef12345678";

  const [form, setForm] = useState({
    property_code: "",
    location: "",
    area_sq_m: "",
    description: "",
    owner_address: defaultWallet,
    blockchain_property_id: "",
  });
  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.wallet_address && !form.owner_address) {
      setForm((prev) => ({ ...prev, owner_address: user.wallet_address }));
    }
  }, [user]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      try {
        const hash = await hashFile(selectedFile);
        setFileHash(hash);
      } catch (err) {
        console.error("Hashing failed:", err);
      }
    }
  };

  // 1-Click: Autofill Sample Land Record
  const handleAutoFill = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setForm({
      property_code: `LAND-${randomSuffix}`,
      location: `Parcels 8 & 9, Highline Tech Corridor, Metro City`,
      area_sq_m: "1850.50",
      description: "Prime mixed-use zoned parcel with road access, clean title survey, and underground utilities.",
      owner_address: user?.wallet_address || "0x1234567890abcdef1234567890abcdef12345678",
      blockchain_property_id: String(randomSuffix),
    });

    // Also auto-generate sample deed document
    generateSampleDeed(`LAND-${randomSuffix}`);
  };

  // 1-Click: Generate Sample Deed Document File in memory
  const generateSampleDeed = async (code) => {
    const propCode = code || form.property_code || "LAND-DEMO";
    const deedContent = `======================================================================
LANDCHAIN IMMUTABLE TITLE DEED & CONVEYANCE CERTIFICATE
======================================================================
Property Identifier : ${propCode}
Recorded Location   : ${form.location || "Plot 42, Sector 7, Metro City"}
Total Surface Area  : ${form.area_sq_m || "1250"} SQM
Grantor Authority   : LandChain National Cadastre Office
Grantee Wallet      : ${form.owner_address || defaultWallet}
Issuance Timestamp  : ${new Date().toISOString()}

This certificate is cryptographically bound to the decentralized ledger.
Any byte modification invalidates the SHA-256 integrity digest.
======================================================================`;

    const blob = new Blob([deedContent], { type: "text/plain" });
    const sampleFile = new File([blob], `${propCode}_Title_Deed.txt`, { type: "text/plain" });
    setFile(sampleFile);
    setFileName(sampleFile.name);

    const hash = await hashFile(sampleFile);
    setFileHash(hash);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      if (file) {
        formData.append("document", file);
      }

      const result = await createProperty(formData);
      setSuccess({
        message: `Property ${result.property.property_code} registered and recorded on-chain!`,
        propertyId: result.property.id,
      });

      setTimeout(() => {
        navigate(`/properties/${result.property.id}`);
      }, 1500);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === "viewer") {
    return (
      <div className="page-container">
        <div className="empty-state-box" style={{ padding: "3.5rem 2rem", textAlign: "center", background: "var(--card-bg)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", margin: "2rem auto", maxWidth: "600px" }}>
          <div style={{ fontSize: "2.8rem", marginBottom: "1rem" }}>📋</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "0.5rem" }}>Registration Restricted to Property Owners</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "1.75rem" }}>
            As a <strong>Public Citizen / Viewer</strong>, your account is configured to explore the land registry and verify title deeds. To register new land parcels, please sign in as a <strong>Property Owner</strong> or <strong>Cadastral Administrator</strong>.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/properties" className="btn btn-primary btn-sm">
              Explore Property Directory
            </Link>
            <Link to="/verify" className="btn btn-outline btn-sm">
              Verify Title Deed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Register New Land</h1>
          <p className="page-subtitle">
            Record property metadata, bind cryptographic SHA-256 deed fingerprint, and mint on-chain registry record.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleAutoFill}
            title="Auto-fill with sample test data and deed file"
          >
            ⚡ Auto-Fill Demo Parcel
          </button>
        </div>
      </div>

      <ErrorDisplay error={error} />

      {success && (
        <div className="success-banner" role="status">
          <div className="success-icon">✓</div>
          <div>
            <strong>Registration Confirmed!</strong> {success.message}
            <div className="text-sm mt-1">
              Redirecting to property details page...
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card-clean">
        <div className="form-section-title">Parcel Metadata</div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="property_code">Property Code *</label>
            <input
              id="property_code"
              type="text"
              value={form.property_code}
              onChange={(e) => updateField("property_code", e.target.value)}
              placeholder="e.g. LAND-1004"
              required
              maxLength={80}
            />
          </div>

          <div className="form-group">
            <label htmlFor="blockchain_property_id">Blockchain Property ID</label>
            <input
              id="blockchain_property_id"
              type="number"
              value={form.blockchain_property_id}
              onChange={(e) => updateField("blockchain_property_id", e.target.value)}
              placeholder="Auto-assigned if left blank"
              min="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Physical Location *</label>
            <input
              id="location"
              type="text"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="e.g. Plot 42, Sector 7, New District, Metro City"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="area_sq_m">Area (Square Meters) *</label>
            <input
              id="area_sq_m"
              type="number"
              step="0.01"
              value={form.area_sq_m}
              onChange={(e) => updateField("area_sq_m", e.target.value)}
              placeholder="e.g. 1250.00"
              required
              min="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="owner_address">Initial Owner Wallet Address *</label>
            <input
              id="owner_address"
              type="text"
              value={form.owner_address}
              onChange={(e) => updateField("owner_address", e.target.value)}
              placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
              pattern="^0x[a-fA-F0-9]{40}$"
              required
            />
            <div className="quick-input-tags mt-1">
              <button
                type="button"
                className="input-tag-btn"
                onClick={() => updateField("owner_address", "0x1234567890abcdef1234567890abcdef12345678")}
              >
                Use Admin Wallet
              </button>
              <button
                type="button"
                className="input-tag-btn"
                onClick={() => updateField("owner_address", "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")}
              >
                Use Demo Owner Wallet
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Public Description (Optional)</label>
            <input
              id="description"
              type="text"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="e.g. East-facing residential parcel near highway"
            />
          </div>
        </div>

        {/* Title Deed Document Section */}
        <div className="upload-section mt-5">
          <div className="flex-between mb-2">
            <div>
              <label className="font-semibold text-sm">Attach Title Deed Document</label>
              <p className="text-xs text-muted">Upload a title deed file (PDF, TXT, PNG, DOCX) or generate one instantly.</p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => generateSampleDeed()}
            >
              📄 Generate Sample Title Deed
            </button>
          </div>

          <div className="file-upload-dropzone">
            <input
              id="document-file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
              className="file-input-hidden"
            />
            <label htmlFor="document-file" className="file-upload-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span className="file-upload-text">
                {fileName ? fileName : "Click to select a deed file or drop here"}
              </span>
              <span className="form-hint">Accepted: PDF, PNG, JPG, DOCX, TXT up to 10MB</span>
            </label>
          </div>

          {fileHash && (
            <div className="hash-preview-clean mt-3">
              <div className="hash-header">
                <span className="hash-label">Calculated SHA-256 Digest (Client-Side Preview):</span>
                <span className="hash-status-pill">Ready to Register</span>
              </div>
              <code className="hash-value font-mono break-all">{fileHash}</code>
            </div>
          )}
        </div>

        <div className="form-actions mt-5">
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? "Registering on Blockchain Ledger..." : "Confirm & Register Land Parcel"}
          </button>
        </div>
      </form>
    </div>
  );
}
