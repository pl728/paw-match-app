import { apiFetch } from "./api.js";

export function loginUser({ username, password }) {
  return apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function registerUser({
  username,
  email,
  password,
  role = "adopter",
  city,
  state,
  postal_code,
  latitude,
  longitude,
  radius_miles,
}) {
  return apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email,
      password,
      role,
      city,
      state,
      postal_code,
      latitude,
      longitude,
      radius_miles,
    }),
  });
}

export function reverseGeocodeLocation({ latitude, longitude }) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  return apiFetch(`/auth/reverse-geocode?${params.toString()}`);
}

