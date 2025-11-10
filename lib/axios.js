import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});
console.log("Base URL:", process.env.NEXT_PUBLIC_API_BASE);

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API error:", err);
    return Promise.reject(err);
  }
);

export default api;
