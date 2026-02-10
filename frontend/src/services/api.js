import { loadAuth } from "../auth/storage.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  const stored = loadAuth();
  if (stored?.token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${stored.token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorPayload = null;
    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = { error: response.statusText };
    }
    const message = errorPayload?.error || response.statusText || "Request failed";
    throw new Error(message);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}
