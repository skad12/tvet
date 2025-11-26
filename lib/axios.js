import axios from "axios";

const rawBase = (process.env.NEXT_PUBLIC_API_BASE || "").trim();
const BASE = rawBase.replace(/\/+$/, ""); // remove trailing slash(es)

const api = axios.create({
  baseURL: BASE || undefined,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  try {
    const url = config.baseURL
      ? `${config.baseURL.replace(/\/$/, "")}${config.url}`
      : config.url;
    console.debug("[API request]", config.method?.toUpperCase(), url);
    
    // Add token from localStorage if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isCanceled =
      (axios.isCancel && axios.isCancel(err)) ||
      err?.code === "ERR_CANCELED" ||
      err?.name === "CanceledError" ||
      err?.message === "canceled";
    if (isCanceled) {
      return Promise.reject(err);
    }
    console.error(
      "API error:",
      err?.response?.status ?? "unknown",
      err?.response?.data ?? err?.message
    );
    return Promise.reject(err);
  }
);

export default api;
