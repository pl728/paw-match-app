import { apiFetch } from "./api.js";

export async function getMyProfile() {
  return apiFetch("/users/me");
}
