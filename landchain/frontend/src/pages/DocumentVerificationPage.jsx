import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getProperties, verifyDocument } from "../services/api";
import { hashFile } from "../services/blockchain";
import ErrorDisplay from "../components/ErrorDisplay";

export default function DocumentVerificationPage() {
  const [searchParams] = useSearchParams();
  const preselectedCode = searchParams.get("code") || "";

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [file, setFile] = useState(null);
  const [clientHash, setClientHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties({ limit: 100 });
        const list = data.properties || [];
        setProperties(list);
        if (preselectedCode) {
          const match = list.find((p) => p.property_code === preselectedCode);
          if (match) setSelectedPropertyId(match.id);
        }
      } catch (err) {
        console.error("Failed to load properties:", err);
      }
    }
    loadProperties();
  }, [preselectedCode]);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setVerificationResult(null);
    setError(null);

    if (selected) {
      try {
        const hash = await hashFile(selected);
        setClientHash(hash);
      } catch (err) {
        console.error("Hashing failed:", err);
      }
    } else {
      setClientHash(null);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      setError(new Error("Please select a property to verify against."));
      return;
    }
    if (!file) {
      setError(new Error("Please upload a document file."));
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append("document", file);

      const result = await verifyDocument(selectedPropertyId, formData);
      setVerificationResult(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Document Integrity Verification</h1>
        <p className="page-subtitle">
          Verify physical document integrity using exact raw-byte SHA-256 cryptographic hashing.
        </p>
      </div>

      <ErrorDisplay error={error} />

      <div className="two-column-grid">
        <form onSubmit={handleVerify} className="form-card-clean">
          <div className="form-group">
            <label htmlFor="property-select">Select Property Record *</label>
            <select
              id="property-select"
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setVerificationResult(null);
              }}
              required
              className="form-select"
            >
              <option value="">-- Select property record --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.property_code} — {p.location}
                </option>
              ))}
            </select>
          </div>

          {selectedProperty && (
            <div className="summary-pill-box mb-4">
              <h4>Registered Document Digest</h4>
              <p><strong>Property:</strong> {selectedProperty.property_code}</p>
              <p>
                <strong>Registered SHA-256:</strong>{" "}
                <span className="font-mono text-sm break-all">
                  {selectedProperty.document_hash || "No hash recorded"}
                </span>
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="verify-file">Upload Document to Check *</label>
            <input
              id="verify-file"
              type="file"
              onChange={handleFileChange}
              required
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
              className="file-input-clean"
            />
            <span className="form-hint">Supports PDF, PNG, JPEG, DOC, DOCX, TXT up to 10MB.</span>
          </div>

          {clientHash && (
            <div className="hash-preview-clean mt-3">
              <span className="hash-label">Calculated SHA-256 (Client-Side Preview):</span>
              <code className="hash-value">{clientHash}</code>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full mt-4"
            disabled={loading || !selectedPropertyId || !file}
          >
            {loading ? "Computing & Verifying Hash..." : "Verify Document Integrity"}
          </button>
        </form>

        <div className="content-card">
          <div className="content-card-header">
            <h3>Verification Output</h3>
          </div>
          <div className="card-body">
            {verificationResult ? (
              <div
                className={`clean-result-panel ${
                  verificationResult.verified ? "verified-match" : "verified-mismatch"
                }`}
              >
                <div className="result-badge-text">
                  {verificationResult.verified ? "MATCH CONFIRMED" : "DIGEST MISMATCH"}
                </div>
                <h3>
                  {verificationResult.verified
                    ? "Document Hash Matches"
                    : "Document Hash Mismatch Detected"}
                </h3>
                <p className="result-explanation-text">
                  {verificationResult.verified
                    ? "The uploaded file byte stream exactly matches the SHA-256 digest recorded on the blockchain."
                    : "The uploaded file byte stream differs from the registered digest. Any byte-level modification alters the cryptographic digest."}
                </p>

                <div className="clean-hash-comparison">
                  <div className="hash-row">
                    <span className="hash-label-small">Uploaded Digest:</span>
                    <code>{verificationResult.uploaded_hash}</code>
                  </div>
                  <div className="hash-row">
                    <span className="hash-label-small">Registered Digest:</span>
                    <code>{verificationResult.registered_hash}</code>
                  </div>
                </div>

                <div className="clean-notice-tag mt-3">
                  {verificationResult.verified
                    ? "Blockchain record found • Document hash matches"
                    : "Cryptographic mismatch detected"}
                </div>
              </div>
            ) : (
              <div className="clean-guide-info">
                <p>
                  <strong>How it works:</strong> LandChain computes a cryptographic SHA-256 digest over the raw byte stream of the file.
                </p>
                <ul className="clean-guide-list mt-3">
                  <li>Identical file contents generate identical 256-bit digests.</li>
                  <li>Any byte modification alters the resulting hash completely.</li>
                  <li>Original documents remain stored off-chain and private.</li>
                  <li>
                    <strong>Notice:</strong> Document hash matching verifies byte integrity against the registered record; it does not constitute legal title adjudication.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
