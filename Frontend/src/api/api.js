import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://routex-f68h.onrender.com",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("routex-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("[RouteX API]", error?.response?.status, error?.message);
    return Promise.reject(error);
  },
);

export default api;
