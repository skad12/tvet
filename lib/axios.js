// import axios from "axios";

// const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_BASE,
//   timeout: 20000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// api.interceptors.request.use((config) => {
//   return config;
// });

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     console.error("API error:", err);
//     return Promise.reject(err);
//   }
// );

// export default api;

// lib/axios.js
// import axios from "axios";

// const rawBase = (process.env.NEXT_PUBLIC_API_BASE || "").trim();
// const BASE = rawBase.replace(/\/+$/, ""); // remove trailing slash(s)

// const api = axios.create({
//   baseURL: BASE || undefined,
//   timeout: 20000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// api.interceptors.request.use((config) => {
//   // log resolved URL for debug (comment out in prod)
//   try {
//     const url = config.baseURL
//       ? `${config.baseURL.replace(/\/$/, "")}${config.url}`
//       : config.url;
//     console.debug("[API request]", config.method?.toUpperCase(), url);
//   } catch (e) {}
//   return config;
// });

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     console.error(
//       "API error:",
//       err?.response?.status,
//       err?.response?.data ?? err.message
//     );
//     return Promise.reject(err);
//   }
// );

// export default api;

// lib/axios.js
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
  } catch (e) {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(
      "API error:",
      err?.response?.status,
      err?.response?.data ?? err.message
    );
    return Promise.reject(err);
  }
);

export default api;
