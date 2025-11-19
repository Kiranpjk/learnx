// src/utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

// attach token if exists
function attachToken() {
  const token = localStorage.getItem("access");
  if (token) api.defaults.headers.common["Authorization"] = "Bearer " + token;
  else delete api.defaults.headers.common["Authorization"];
}
attachToken();

// Refresh mechanism
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      // try to refresh
      const refresh = localStorage.getItem("refresh");
      if (!refresh) return Promise.reject(err);
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((e) => Promise.reject(e));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const resp = await axios.post("/api/auth/token/refresh/", { refresh });
        const newAccess = resp.data.access;
        localStorage.setItem("access", newAccess);
        api.defaults.headers.common["Authorization"] = "Bearer " + newAccess;
        processQueue(null, newAccess);
        isRefreshing = false;
        originalRequest.headers["Authorization"] = "Bearer " + newAccess;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        // if refresh fails, remove tokens
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        delete api.defaults.headers.common["Authorization"];
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export function setAuthHeaderFromStorage() {
  attachToken();
}

export default api;
