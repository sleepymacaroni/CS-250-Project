const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? {Authorization: `Bearer ${token}`} : {};
}

async function request(path, options = {}) {
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

export async function getMarketplaceCrops() {
  return request("/crops/marketplace");
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
