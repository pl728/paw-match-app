import { apiFetch } from "./api.js";

export function getFavorites() {
  return apiFetch("/favorites");
}

export function addFavorite(petId) {
  return apiFetch("/favorites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pet_id: petId }),
  });
}

export function removeFavorite(petId) {
  return apiFetch("/favorites", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pet_id: petId }),
  });
}