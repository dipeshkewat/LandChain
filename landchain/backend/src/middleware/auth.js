const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * Express middleware – verify JWT from Authorization header.
 * Attaches decoded user payload to `req.user`.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, wallet_address }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Factory – restrict route to specific roles.
 * @param  {...string} roles - Allowed roles (e.g. 'admin').
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

/**
 * Generate a signed JWT for a user record.
 * @param {{ id: string, email: string, role: string, wallet_address?: string }} user
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      wallet_address: user.wallet_address || null,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice(7);
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (_err) {
      // ignore invalid token for optional auth
    }
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate, authorize, generateToken };
