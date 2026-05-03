import { apiFetch } from "./api.js";

export function getEmailNotificationPrefs(userId) {
  return apiFetch(`/email-notifications/${userId}`);
}

export function updateEmailNotificationPrefs(userId, updates) {
  return apiFetch(`/email-notifications/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}
