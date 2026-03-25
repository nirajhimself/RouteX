import axios from "axios";

// ✅ Use environment variable (works for both local + production)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// 🔥 Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🚀 Request interceptor (attach token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("routex-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 🚀 Response interceptor (handle errors globally)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "[RouteX API ERROR]",
      error?.response?.status,
      error?.message,
    );

    // Optional: handle unauthorized globally
    if (error?.response?.status === 401) {
      localStorage.removeItem("routex-token");
      // window.location.href = "/login"; // optional redirect
    }

    return Promise.reject(error);
  },
);

export default api;
