import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUser, logout } from "../services/api";

/**
 * Modern minimalist left navigation sidebar.
 * Styled with legal/professional typography and zero icons/emojis.
 */
export default function Navbar() {
  const user = getUser();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/properties", label: "Property Directory" },
    { path: "/register", label: "Register Land", roles: ["admin"] },
    { path: "/transfer", label: "Transfer Ownership", roles: ["admin", "owner"] },
    { path: "/history", label: "Transaction History" },
    { path: "/verify", label: "Document Verification" },
    { path: "/admin", label: "Admin Control Panel", roles: ["admin"] },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-header">
        <Link to="/" className="brand-logo">
          <span className="brand-badge">L</span>
          <div className="brand-text-group">
            <span className="brand-name">LandChain</span>
            <span className="brand-subname">Land Registry</span>
          </div>
        </Link>
      </div>

      <div className="sidebar-body">
        <div className="nav-group-title">Navigation</div>
        <ul className="sidebar-menu">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="sidebar-menu-item">
                <Link
                  to={item.path}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-link-text">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sidebar-footer">
        {user ? (
          <div className="sidebar-user-card">
            <div className="user-avatar-initial">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-meta">
              <span className="user-display-name">{user.name}</span>
              <span className="user-role-tag">{user.role}</span>
            </div>
            <button
              className="btn-sidebar-logout"
              onClick={handleLogout}
              type="button"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary btn-full btn-sm">
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
