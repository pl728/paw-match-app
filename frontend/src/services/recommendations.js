import { apiFetch } from "./api.js";

export function getRecommendationPreferences() {
  return apiFetch("/recommendations/preferences");
}

export function updateRecommendationPreferences(preferences) {
  return apiFetch("/recommendations/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });
}

export function getRecommendationQueue({ limit = 20 } = {}) {
  return apiFetch(`/recommendations/queue?limit=${limit}`);
}

export function recordRecommendationInteraction({ petId, interactionType }) {
  return apiFetch("/recommendations/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pet_id: petId, interaction_type: interactionType }),
  });
}
