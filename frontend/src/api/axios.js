import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  return config;
});

// Auto-refresh expired access tokens on 401 then retry once
let isRefreshing = false;
let queue = [];
const flushQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    if (err.response && err.response.status === 401 && !original._retry) {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        // clear bad access header for next public calls
        localStorage.removeItem("access");
        delete api.defaults.headers.common["Authorization"];
        return Promise.reject(err);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers = original.headers || {};
          original.headers["Authorization"] = "Bearer " + token;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const resp = await axios.post("http://127.0.0.1:8000/api/auth/token/refresh/", { refresh });
        const newAccess = resp.data.access;
        localStorage.setItem("access", newAccess);
        api.defaults.headers.common["Authorization"] = "Bearer " + newAccess;
        flushQueue(null, newAccess);
        isRefreshing = false;
        original.headers = original.headers || {};
        original.headers["Authorization"] = "Bearer " + newAccess;
        return api(original);
      } catch (e) {
        flushQueue(e, null);
        isRefreshing = false;
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        delete api.defaults.headers.common["Authorization"];
        return Promise.reject(e);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
