import { apiFetch } from "./api.js";

export async function getShelters() {
  return apiFetch("/shelters");
}

export async function getShelterById(shelterId) {
  return apiFetch(`/shelters/${shelterId}`);
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

export async function followShelter(shelterId) {
  return apiFetch("/shelter-follows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shelter_id: shelterId }),
  });
}

export async function unfollowShelter(shelterId) {
  return apiFetch("/shelter-follows", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shelter_id: shelterId }),
  });
}

export async function getFollowedShelterIds() {
  const data = await apiFetch("/shelter-follows");
  return Array.isArray(data?.items) ? data.items : [];
}
