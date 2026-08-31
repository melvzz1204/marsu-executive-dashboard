import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error("VITE_API_URL must be configured for production builds.");
}

export const API_BASE_URL = (
  configuredApiUrl || "http://localhost:5000/api/v1"
).replace(/\/$/, "");
export const API_TIMEOUT_MS =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 60000;

const api = axios.create({
  baseURL: API_BASE_URL,
  // Render may need tens of seconds to wake a spun-down service. A short
  // timeout incorrectly reports that normal cold start as a connection error.
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn(
        "Unauthorized access matrix detected — purging token clearance.",
      );
      localStorage.removeItem("token");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
