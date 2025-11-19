// src/utils/auth.js
import api from "./api";

export function saveTokens({ access, refresh }) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  api.defaults.headers.common["Authorization"] = "Bearer " + access;
}

export function clearTokens() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  delete api.defaults.headers.common["Authorization"];
}

export async function logoutBackend() {
  try {
    const refresh = localStorage.getItem("refresh");
    if (refresh) {
      await api.post("auth/logout/", { refresh });
    }
  } catch (e) {
    // ignore; logout locally anyway
  } finally {
    clearTokens();
  }
}
