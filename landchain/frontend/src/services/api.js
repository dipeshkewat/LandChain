const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Get the stored JWT token.
 */
function getToken() {
  return localStorage.getItem("landchain_token");
}

/**
 * Store JWT token and user data.
 */
function setAuth(token, user) {
  localStorage.setItem("landchain_token", token);
  localStorage.setItem("landchain_user", JSON.stringify(user));
}

/**
 * Clear stored auth data.
 */
function clearAuth() {
  localStorage.removeItem("landchain_token");
  localStorage.removeItem("landchain_user");
}

/**
 * Get stored user data.
 */
function getUser() {
  const raw = localStorage.getItem("landchain_user");
  return raw ? JSON.parse(raw) : null;
}

/**
 * Build headers with optional JWT auth.
 */
function headers(includeAuth = true) {
  const h = { "Content-Type": "application/json" };
  if (includeAuth) {
    const token = getToken();
    if (token) h["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

/**
 * Generic fetch wrapper with error handling.
 */
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: options.headers || headers(options.auth !== false),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.details = body.details;
    throw error;
  }

  return res.json();
}

// ── Auth API ────────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuth(data.token, data.user);
  return data;
}

export async function register(userData) {
  const data = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  setAuth(data.token, data.user);
  return data;
}

export async function demoLogin(role = "admin") {
  const data = await request("/auth/demo-login", {
    method: "POST",
    body: JSON.stringify({ role }),
    auth: false,
  });
  setAuth(data.token, data.user);
  return data;
}

export function logout() {
  clearAuth();
}

export { getUser, getToken };

// ── Properties API ──────────────────────────────────────────────────
export async function getProperties(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/properties${qs ? `?${qs}` : ""}`);
}

export async function getProperty(id) {
  return request(`/properties/${id}`);
}

export async function createProperty(formData) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/properties`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData, // FormData for file upload
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function getPropertyHistory(id) {
  return request(`/properties/${id}/history`);
}

export async function verifyDocument(propertyId, formData) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/properties/${propertyId}/verify-document`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function transferProperty(propertyId, toAddress) {
  return request(`/properties/${propertyId}/transfer`, {
    method: "POST",
    body: JSON.stringify({ to_address: toAddress }),
  });
}

export async function confirmProperty(propertyId) {
  return request(`/properties/${propertyId}/confirm`, {
    method: "POST",
  });
}

// ── Transactions API ────────────────────────────────────────────────
export async function getTransactions(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/transactions${qs ? `?${qs}` : ""}`);
}

export async function getTransaction(hash) {
  return request(`/transactions/${hash}`);
}

// ── Admin API ───────────────────────────────────────────────────────
export async function getAdminStats() {
  return request("/admin/stats");
}

// ── Health ──────────────────────────────────────────────────────────
export async function getHealth() {
  return request("/health", { auth: false });
}
