const BASE_URL = "http://localhost:8000";
const TOKEN_KEY = "token";
const USER_KEY = "farmsync_user";

export function normalizeRole(role) {
  const value = (role || "buyer").toLowerCase();
  if (value === "seller" || value === "farmer") return "seller";
  return "buyer";
}

function saveSession(data) {
  const user = {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    role: normalizeRole(data.role),
  };

  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

async function authRequest(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "FarmSync authentication failed";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // Keep default message.
    }
    throw new Error(detail);
  }

  return res.json();
}

export async function login({email, password}) {
  const data = await authRequest("/login", {email, password});
  return saveSession(data);
}

export async function register({fullName, email, password, role}) {
  await authRequest("/register", {
    full_name: fullName,
    email,
    password,
    role: normalizeRole(role),
  });

  return login({email, password});
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;

  try {
    const user = JSON.parse(stored);
    return {...user, role: normalizeRole(user.role)};
  } catch {
    return null;
  }
}

export function isBuyer() {
  return getCurrentUser()?.role === "buyer";
}

export function isSeller() {
  return getCurrentUser()?.role === "seller";
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
