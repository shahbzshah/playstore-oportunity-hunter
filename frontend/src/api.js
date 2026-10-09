const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const TOKEN_KEY = "oph_token";
const USER_KEY = "oph_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function setSession(user, token) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body (e.g. 204) */
  }
  if (!res.ok) {
    const message =
      data?.message ||
      (data?.errors ? Object.values(data.errors).flat().join(" ") : null) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  register: (payload) => request("/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/me"),
  logout: () => request("/logout", { method: "POST" }),

  listScans: () => request("/scans"),
  createScan: (keyword, limit = 20) =>
    request("/scans", { method: "POST", body: { keyword, limit } }),
  getScan: (id) => request(`/scans/${id}`),

  listOpportunities: ({ search = "", bookmarked = false, page = 1 } = {}) => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (bookmarked) q.set("bookmarked", "1");
    if (page > 1) q.set("page", String(page));
    const qs = q.toString();
    return request(`/opportunities${qs ? `?${qs}` : ""}`);
  },
  getOpportunity: (id) => request(`/opportunities/${id}`),
  updateOpportunity: (id, payload) =>
    request(`/opportunities/${id}`, { method: "PATCH", body: payload }),
  deleteOpportunity: (id) => request(`/opportunities/${id}`, { method: "DELETE" }),

  analyze: (appId, opportunityId) =>
    request(`/analyze/${encodeURIComponent(appId)}`, {
      method: "POST",
      body: opportunityId ? { opportunity_id: opportunityId } : {},
    }),
  deleteAnalysis: (id) => request(`/analyses/${id}`, { method: "DELETE" }),
};
