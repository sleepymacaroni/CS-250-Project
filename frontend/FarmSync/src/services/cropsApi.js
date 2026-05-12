const BASE_URL = "http://localhost:8000";

const DEMO_USER = {
  full_name: "Demo Farmer",
  email: "demo@farmsync.test",
  password: "password123",
  role: "Farmer",
};

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? {Authorization: `Bearer ${token}`} : {};
}

async function ensureDemoToken() {
  if (getToken()) return getToken();

  // This makes the current frontend usable before a real login/register UI exists.
  try {
    await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(DEMO_USER),
    });
  } catch {
    // Ignore; login below will show the real connection error if backend is down.
  }

  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email: DEMO_USER.email, password: DEMO_USER.password}),
  });

  if (!res.ok) throw new Error("Could not log in to the FarmSync backend");

  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  return data.access_token;
}

async function request(path, options = {}) {
  await ensureDemoToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    let detail = "FarmSync request failed";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // Keep default message.
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function getCrops() {
  return request("/crops/");
}

export async function createCrop(crop) {
  return request("/crops/", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(crop),
  });
}

export async function updateExistingCrop(updatedCrop, id) {
  return request(`/crops/${id}`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(updatedCrop),
  });
}

export async function deleteCrop(id) {
  return request(`/crops/${id}`, {method: "DELETE"});
}
