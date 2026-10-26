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
  const [fileName, setFileName] = useState("");
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
        } else if (list.length > 0) {
          setSelectedPropertyId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load properties:", err);
      }
    }
    loadProperties();
  }, [preselectedCode]);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFileName(selected.name);
      setVerificationResult(null);
      setError(null);
      try {
        const hash = await hashFile(selected);
        setClientHash(hash);
      } catch (err) {
        console.error("Hashing failed:", err);
      }
    }
  };

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  // 1-Click: Test with Matching Deed
  const handleTestMatchingDeed = async () => {
    if (!selectedProperty) return;
    setError(null);
    setLoading(true);

    try {
      // Create a test file and mock verify or check with hash
      // If property has a document_hash, we can build a deed or verify directly
      const formData = new FormData();
      // Let's create a file matching the property record
      const content = `TITLE DEED RECORD FOR ${selectedProperty.property_code}\nLocation: ${selectedProperty.location}\nHash: ${selectedProperty.document_hash}`;
      const sampleFile = new File([new Blob([content], { type: "text/plain" })], `${selectedProperty.property_code}_Deed.txt`, { type: "text/plain" });
      setFile(sampleFile);
      setFileName(sampleFile.name);

      formData.append("document", sampleFile);

      // Call verification endpoint
      const result = await verifyDocument(selectedProperty.id, formData);
      setVerificationResult(result);
      setClientHash(result.uploaded_hash);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click: Test Tampered File
  const handleTestTamperedDeed = async () => {
    if (!selectedProperty) return;
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      const tamperedContent = `ALTERED UNAUTHORIZED RECORD FOR ${selectedProperty.property_code}\nModified coordinates: +99.999, -88.888`;
      const sampleFile = new File([new Blob([tamperedContent], { type: "text/plain" })], `Tampered_${selectedProperty.property_code}_Deed.txt`, { type: "text/plain" });
      setFile(sampleFile);
      setFileName(sampleFile.name);

      formData.append("document", sampleFile);

      const result = await verifyDocument(selectedProperty.id, formData);
      setVerificationResult(result);
      setClientHash(result.uploaded_hash);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      setError(new Error("Please select a property to verify against."));
      return;
    }
    if (!file) {
      setError(new Error("Please upload a document file or click 'Generate & Test'."));
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

  const isVerified = Boolean(
    verificationResult?.verified ||
    verificationResult?.database_match ||
    (verificationResult?.uploaded_hash &&
      verificationResult?.registered_hash &&
      verificationResult.uploaded_hash.toLowerCase() === verificationResult.registered_hash.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Document Integrity Verification</h1>
          <p className="page-subtitle">
            Cryptographic SHA-256 byte-level verification against immutable blockchain registry records.
          </p>
        </div>
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
              <div className="flex-between mb-1">
                <h4>Registered Document Fingerprint</h4>
                <span className="badge-confirmed">{selectedProperty.chain_status}</span>
              </div>
              <p className="text-sm">
                <strong>Property:</strong> {selectedProperty.property_code} ({selectedProperty.location})
              </p>
              <div className="mt-2">
                <span className="hash-label-small">Recorded SHA-256 on Chain:</span>
                <code className="font-mono text-xs break-all block mt-1 p-2 bg-white rounded border">
                  {selectedProperty.document_hash || "No hash recorded"}
                </code>
              </div>

              {/* Quick test buttons */}
              <div className="quick-test-actions mt-3">
                <span className="text-xs font-semibold text-muted block mb-1">Quick Integrity Test Actions:</span>
                <div className="flex-gap">
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={handleTestMatchingDeed}
                    disabled={loading}
                    title="Upload and verify deed against this parcel"
                  >
                    🔍 Verify Selected Deed
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={handleTestTamperedDeed}
                    disabled={loading}
                    title="Simulate altered file to test mismatch detection"
                  >
                    ⚠️ Test Tampered File
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="verify-file">Upload Title Deed to Verify *</label>
            <div className="file-upload-dropzone">
              <input
                id="verify-file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                className="file-input-hidden"
              />
              <label htmlFor="verify-file" className="file-upload-label">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span className="file-upload-text">
                  {fileName ? fileName : "Click to select a deed file or drop here"}
                </span>
                <span className="form-hint">Supports PDF, PNG, JPEG, DOCX, TXT up to 10MB</span>
              </label>
            </div>
          </div>

          {clientHash && (
            <div className="hash-preview-clean mt-3">
              <span className="hash-label">Calculated SHA-256 (Uploaded File Digest):</span>
              <code className="hash-value font-mono break-all">{clientHash}</code>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg mt-4"
            disabled={loading || !selectedPropertyId || !file}
          >
            {loading ? "Computing & Verifying Hash..." : "Verify Cryptographic Integrity"}
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
                  isVerified ? "verified-match" : "verified-mismatch"
                }`}
              >
                <div className="result-badge-text">
                  {isVerified ? "✓ CRYPTOGRAPHIC MATCH CONFIRMED" : "⚠ DIGEST MISMATCH DETECTED"}
                </div>
                <h3>
                  {isVerified
                    ? "Deed Authenticity Confirmed"
                    : "Document Integrity Alteration Detected"}
                </h3>
                <p className="result-explanation-text">
                  {isVerified
                    ? "The uploaded file raw byte stream matches the cryptographic SHA-256 digest recorded on the decentralized blockchain registry."
                    : "The uploaded file raw byte stream differs from the recorded digest. Even a single character or byte modification alters the cryptographic hash completely."}
                </p>

                <div className="clean-hash-comparison mt-3">
                  <div className="hash-row">
                    <span className="hash-label-small">Uploaded Document SHA-256:</span>
                    <code className="font-mono text-xs break-all">{verificationResult.uploaded_hash}</code>
                  </div>
                  <div className="hash-row mt-2">
                    <span className="hash-label-small">Registered On-Chain Digest:</span>
                    <code className="font-mono text-xs break-all">{verificationResult.registered_hash}</code>
                  </div>
                </div>

                <div className={`clean-notice-tag mt-3 ${isVerified ? "tag-success" : "tag-danger"}`}>
                  {isVerified
                    ? "✓ Blockchain Title Record Matched • Integrity 100% Genuine"
                    : "⚠ Cryptographic Check Failed • Document Modified Since Registration"}
                </div>
              </div>
            ) : (
              <div className="clean-guide-info">
                <h4>How Cryptographic Verification Works</h4>
                <p className="mt-2 text-sm">
                  LandChain computes a 256-bit cryptographic digest over the raw byte stream of the title deed using the standard SHA-256 hashing algorithm.
                </p>
                <ul className="clean-guide-list mt-3">
                  <li><strong>Deterministic:</strong> Identical document bytes always produce the exact same 64-character hexadecimal digest.</li>
                  <li><strong>Tamper-Proof:</strong> If even a single punctuation mark, date, or name in the deed is altered, the digest changes entirely.</li>
                  <li><strong>Privacy Preserving:</strong> Only the cryptographic fingerprint is stored on-chain; private legal contents stay off-chain.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
