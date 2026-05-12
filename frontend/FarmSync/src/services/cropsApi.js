const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

export async function getCrops() {
  const res = await fetch(`${BASE_URL}/crops/`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Could not get crops");
  return res.json();
}

export async function createCrop(crop) {
  const res = await fetch(`${BASE_URL}/crops/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(crop),
  });
  if (!res.ok) throw new Error("Crop could not be added");
  return res.json();
}

export async function updateExistingCrop(updatedCrop, id) {
  const res = await fetch(`${BASE_URL}/crops/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(updatedCrop),
  });
  if (!res.ok) throw new Error("Crop could not be updated");
  return res.json();
}

export async function deleteCrop(id) {
  const res = await fetch(`${BASE_URL}/crops/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Crop could not be deleted");
}