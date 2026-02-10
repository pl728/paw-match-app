import { apiFetch } from "./api.js";

export async function getShelters() {
  return apiFetch("/shelters");
}

export async function createShelter(data) {
  return apiFetch("/shelters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export async function deleteShelter(shelterId) {
  return apiFetch(`/shelters/${shelterId}`, {
    method: "DELETE"
  });
}
