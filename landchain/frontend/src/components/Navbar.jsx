import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUser, logout, demoLogin } from "../services/api";

export default function Navbar() {
  const user = getUser();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleQuickSwitch = async (role) => {
    try {
      await demoLogin(role);
      window.location.reload();
    } catch (err) {
      console.error("Demo switch failed:", err);
    }
  };

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
    },
    {
      path: "/properties",
      label: "Property Directory",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
    {
      path: "/register",
      label: "Register Land",
      badge: "Action",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      ),
    },
    {
      path: "/transfer",
      label: "Transfer Ownership",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9"></polyline>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
          <polyline points="7 23 3 19 7 15"></polyline>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
        </svg>
      ),
    },
    {
      path: "/verify",
      label: "Document Verification",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <polyline points="9 12 11 14 15 10"></polyline>
        </svg>
      ),
    },
    {
      path: "/history",
      label: "Transaction History",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
    },
    {
      path: "/admin",
      label: "Admin Control Panel",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
    },
  ];

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-header">
        <Link to="/" className="brand-logo">
          <div className="brand-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-name">LandChain</span>
            <span className="brand-subname">Decentralized Title Registry</span>
          </div>
        </Link>
      </div>

      {/* Network Status Badge */}
      <div className="network-pill-container">
        <div className="network-pill">
          <span className="network-pulse"></span>
          <span className="network-name">Ethereum Hardhat Local</span>
          <span className="network-state">Active</span>
        </div>
      </div>

      <div className="sidebar-body">
        <div className="nav-group-title">Registry Menu</div>
        <ul className="sidebar-menu">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="sidebar-menu-item">
                <Link
                  to={item.path}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  <span className="sidebar-link-text">{item.label}</span>
                  {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Quick Demo Role Switcher */}
        <div className="quick-roles-section">
          <div className="nav-group-title">Switch Demo Identity</div>
          <div className="role-switch-buttons">
            <button
              type="button"
              className={`role-switch-btn ${user?.role === "admin" ? "active" : ""}`}
              onClick={() => handleQuickSwitch("admin")}
              title="Registrar Authority with full registration & administration rights"
            >
              Admin
            </button>
            <button
              type="button"
              className={`role-switch-btn ${user?.role === "owner" ? "active" : ""}`}
              onClick={() => handleQuickSwitch("owner")}
              title="Verified Property Owner"
            >
              Owner
            </button>
            <button
              type="button"
              className={`role-switch-btn ${user?.role === "viewer" ? "active" : ""}`}
              onClick={() => handleQuickSwitch("viewer")}
              title="Public Citizen & Property Buyer"
            >
              Viewer
            </button>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        {user ? (
          <div className="sidebar-user-card">
            <div className="user-avatar-initial">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-meta">
              <span className="user-display-name">{user.name}</span>
              <span className={`user-role-badge role-${user.role}`}>
                {user.role}
              </span>
            </div>
            <button
              className="btn-sidebar-logout"
              onClick={handleLogout}
              type="button"
              title="Sign Out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        ) : (
          <div className="sidebar-auth-cta">
            <button
              type="button"
              className="btn btn-primary btn-full btn-sm"
              onClick={() => handleQuickSwitch("admin")}
            >
              Instant Demo Login (Admin)
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
