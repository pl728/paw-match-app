import { apiFetch } from "./api.js";

export function createPet(payload) {
  if (payload instanceof FormData) {
    return apiFetch("/pets", {
      method: "POST",
      body: payload,
    });
  }

  return apiFetch("/pets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getPets({ page = 1, limit = 25 } = {}) {
  return apiFetch(`/pets?page=${page}&limit=${limit}`);
}

export function getPetById(id) {
  return apiFetch(`/pets/${id}`);
}

export function updatePet(id, updates) {
  return apiFetch(`/pets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}
