import { apiFetch } from "./api.js";

export function createShelterPost({ shelterId, type, title, body, publish = false }) {
  return apiFetch("/shelter-posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shelter_id: shelterId, type, title, body, publish }),
  });
}

export function listShelterPosts({ shelterId, publishedOnly = false, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (shelterId) params.set("shelter_id", shelterId);
  if (publishedOnly) params.set("published_only", "true");
  params.set("limit", limit);
  params.set("offset", offset);
  return apiFetch(`/shelter-posts?${params}`);
}

export function updateShelterPost(postId, updates) {
  return apiFetch(`/shelter-posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export function deleteShelterPost(postId) {
  return apiFetch(`/shelter-posts/${postId}`, { method: "DELETE" });
}

export function publishShelterPost(postId) {
  return apiFetch(`/shelter-posts/${postId}/publish`, { method: "PATCH" });
}
