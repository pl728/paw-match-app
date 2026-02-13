import { apiFetch } from "./api.js";

export function createPet(payload) {
  return apiFetch("/pets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getPets() {
  return apiFetch("/pets");
}

export function getPetById(id) {
  return apiFetch(`/pets/${id}`);
}
