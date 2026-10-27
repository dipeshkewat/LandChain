import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, demoLogin } from "../services/api";
import ErrorDisplay from "../components/ErrorDisplay";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", wallet_address: "", role: "viewer" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoSignIn = async (role) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(role);
      navigate("/");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate("/");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="auth-page-clean">
      <div className="auth-card-clean">
        <div className="auth-header-clean">
          <div className="auth-brand-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <h1>LandChain</h1>
          <p className="auth-subtitle">Decentralized Blockchain Land Registry</p>
        </div>

        {/* 1-Click Instant Demo Profiles */}
        <div className="demo-profiles-container mb-4">
          <span className="demo-profiles-title">Instant 1-Click Access:</span>
          <div className="demo-cards-row">
            <button
              type="button"
              className="demo-card-btn"
              onClick={() => handleDemoSignIn("admin")}
              disabled={loading}
            >
              <span className="demo-card-badge admin-badge">Registrar Admin</span>
              <span className="demo-card-name">Dipesh Kewat</span>
              <span className="demo-card-sub">Full cadastre privileges</span>
            </button>
            <button
              type="button"
              className="demo-card-btn"
              onClick={() => handleDemoSignIn("owner")}
              disabled={loading}
            >
              <span className="demo-card-badge owner-badge">Property Owner</span>
              <span className="demo-card-name">Chirag Khaire</span>
              <span className="demo-card-sub">Title holder wallet</span>
            </button>
            <button
              type="button"
              className="demo-card-btn"
              onClick={() => handleDemoSignIn("viewer")}
              disabled={loading}
            >
              <span className="demo-card-badge viewer-badge">Public Citizen</span>
              <span className="demo-card-name">Public Viewer</span>
              <span className="demo-card-sub">Explorer & buyer</span>
            </button>
          </div>
        </div>

        <div className="auth-divider">
          <span>or sign in manually</span>
        </div>

        <div className="auth-tabs-clean mt-3">
          <button
            type="button"
            className={`tab-btn-clean ${!isRegister ? "active" : ""}`}
            onClick={() => setIsRegister(false)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab-btn-clean ${isRegister ? "active" : ""}`}
            onClick={() => setIsRegister(true)}
          >
            Create Account
          </button>
        </div>

        <ErrorDisplay error={error} />

        <form onSubmit={handleSubmit} className="auth-form-clean">
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="admin@landchain.demo"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label htmlFor="wallet">Wallet Address (Optional)</label>
                <input
                  id="wallet"
                  type="text"
                  value={form.wallet_address}
                  onChange={(e) => updateField("wallet_address", e.target.value)}
                  placeholder="0x..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => updateField("role", e.target.value)}
                >
                  <option value="viewer">Viewer (Public / Buyer)</option>
                  <option value="owner">Owner (Property Seller)</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg mt-3" disabled={loading}>
            {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In to LandChain"}
          </button>
        </form>

        <div className="auth-footer-clean">
          <p className="demo-credentials-note text-center">
            Standard Demo Password: <code>admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
