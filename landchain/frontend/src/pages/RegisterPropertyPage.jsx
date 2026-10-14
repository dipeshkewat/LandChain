import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProperty } from "../services/api";
import { hashFile } from "../services/blockchain";
import ErrorDisplay from "../components/ErrorDisplay";

export default function RegisterPropertyPage() {
  const [form, setForm] = useState({
    property_code: "",
    location: "",
    area_sq_m: "",
    description: "",
    owner_address: "",
    blockchain_property_id: "",
  });
  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileHash(null);

    if (selectedFile) {
      const hash = await hashFile(selectedFile);
      setFileHash(hash);
    }
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
      if (file) formData.append("document", file);

      const result = await createProperty(formData);
      setSuccess(`Property ${result.property.property_code} registered successfully.`);
      setTimeout(() => navigate(`/properties/${result.property.id}`), 2000);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Register New Land</h1>
        <p className="page-subtitle">
          Record property metadata, compute document SHA-256 fingerprint, and begin blockchain registration.
        </p>
      </div>

      <ErrorDisplay error={error} />

      {success && (
        <div className="success-banner" role="status">
          <span className="banner-badge">CONFIRMED</span>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card-clean">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="property_code">Property Code *</label>
            <input
              id="property_code"
              type="text"
              value={form.property_code}
              onChange={(e) => updateField("property_code", e.target.value)}
              placeholder="e.g. LAND-1001"
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
              placeholder="e.g. 1001"
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
              placeholder="e.g. Plot 42, Sector 7, Metro City"
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
            <label htmlFor="owner_address">Initial Owner Wallet Address</label>
            <input
              id="owner_address"
              type="text"
              value={form.owner_address}
              onChange={(e) => updateField("owner_address", e.target.value)}
              placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
              pattern="^0x[a-fA-F0-9]{40}$"
            />
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

        {/* Document Upload & Client-Side SHA-256 Preview */}
        <div className="upload-section mt-4">
          <label htmlFor="document-file">Attach Title Document / Deed *</label>
          <input
            id="document-file"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            required
            className="file-input-clean"
          />
          <span className="form-hint">Accepted formats: PDF, PNG, JPEG, DOC, DOCX up to 10MB.</span>

          {fileHash && (
            <div className="hash-preview-clean mt-3">
              <span className="hash-label">Calculated Document SHA-256 Digest:</span>
              <code className="hash-value">{fileHash}</code>
            </div>
          )}
        </div>

        <div className="form-actions mt-4">
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Registering on Blockchain..." : "Complete Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}
