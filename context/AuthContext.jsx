// // components/auth/LoginForm.jsx
// "use client";

// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import logo from "@/public/images/tvet-logo.png";
// import { useAuth } from "@/context/AuthContext"; // adjust path if needed

// export default function LoginForm({ demoCredentials = true }) {
//   const router = useRouter();
//   const { signIn, user: authUser } = useAuth();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [show, setShow] = useState(false);
//   const [error, setError] = useState(null);
//   const [loadingLocal, setLoadingLocal] = useState(false);

//   // canonical route map (accepts 'agents' plural)
//   const ROUTES = {
//     admin: "/admin/dashboard/analytics",
//     agent: "/agent/dashboard",
//     agents: "/agents/dashboard",
//     customer: "/customer/dashboard",
//     user: "/dashboard",
//   };

//   function normalizeRole(v) {
//     if (v === null || v === undefined) return null;
//     return String(v).trim().toLowerCase();
//   }

//   function routeForRole(role) {
//     if (!role) return ROUTES.customer;
//     const r = normalizeRole(role);
//     if (!r) return ROUTES.customer;
//     if (ROUTES[r]) return ROUTES[r];
//     if (r.includes("agent"))
//       return r === "agents" ? ROUTES.agents : ROUTES.agent;
//     if (r.includes("admin")) return ROUTES.admin;
//     if (r.includes("cust")) return ROUTES.customer;
//     return ROUTES.customer;
//   }

//   function ensureAbsolutePath(path) {
//     if (!path) return "/";
//     try {
//       const u = new URL(path);
//       return u.href;
//     } catch (e) {}
//     if (path.startsWith("/")) return path;
//     return `/${path.replace(/^\/+/, "")}`;
//   }

//   const submit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setLoadingLocal(true);

//     try {
//       // small UX delay
//       await new Promise((r) => setTimeout(r, 200));

//       const result = await signIn({ username: email, password });

//       console.debug("[Login] signIn result:", result);
//       console.debug("[Login] authUser from context:", authUser);

//       if (!result || result.ok === false) {
//         const message = result?.error || "Invalid credentials — try again";
//         setError(message);
//         return;
//       }

//       // use role returned directly from signIn if present
//       let role = result.role ?? null;

//       // fallback: derive from returned user if present
//       if (!role && result.user) {
//         role =
//           result.user.account_type ??
//           result.user.accountType ??
//           result.user.role ??
//           result.user.type ??
//           null;
//       }
//       // normalize
//       role = normalizeRole(role) || "customer";

//       console.debug("[Login] resolved role:", role);

//       const rawDest = routeForRole(role);
//       const dest = ensureAbsolutePath(rawDest);

//       if (dest.startsWith("http://") || dest.startsWith("https://")) {
//         window.location.href = dest;
//       } else {
//         router.replace(dest);
//       }
//     } catch (err) {
//       console.error("Login error:", err);
//       setError(err?.message || "Sign in failed");
//     } finally {
//       setLoadingLocal(false);
//     }
//   };

//   return (
//     <motion.form
//       onSubmit={submit}
//       initial={{ opacity: 0, y: 6 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.45 }}
//       className="w-full max-w-md mx-auto"
//     >
//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <div className="grid justify-center">
//           <Image
//             src={logo}
//             alt="Customer dashboard hero"
//             width={40}
//             height={40}
//             className="rounded object-cover"
//             priority
//           />
//           <h3 className="text-2xl font-semibold mb-4 text-slate-800">Login</h3>
//         </div>

//         {/* email */}
//         <label className="block text-sm text-slate-600 mb-1">Email</label>
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="admin@tvet.local"
//           required
//           className="w-full px-3 py-2 rounded-md mb-3 transition-shadow duration-150 outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
//         />

//         {/* password with toggle */}
//         <label className="block text-sm text-slate-600 mb-1">Password</label>
//         <div className="relative mb-3">
//           <input
//             type={show ? "text" : "password"}
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Password"
//             required
//             className="w-full px-3 py-2 rounded-md pr-20 transition-shadow duration-150 outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
//           />

//           <button
//             type="button"
//             onClick={() => setShow((s) => !s)}
//             className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-sm text-slate-600"
//             aria-label={show ? "Hide password" : "Show password"}
//           >
//             {show ? "Hide" : "Show"}
//           </button>
//         </div>

//         <motion.button
//           type="submit"
//           disabled={loadingLocal}
//           whileTap={{ scale: 0.98 }}
//           className="w-full bg-blue-600 text-white py-2 rounded-md hover:opacity-95 disabled:opacity-60"
//         >
//           {loadingLocal ? "Signing in..." : "Log in"}
//         </motion.button>

//         {error && (
//           <motion.div
//             initial={{ opacity: 0, y: -6 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.25 }}
//             className="mt-3 text-red-700 text-sm"
//           >
//             {error}
//           </motion.div>
//         )}
//       </div>
//     </motion.form>
//   );
// }

// context/AuthContext.jsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Optional axios helper
let api = null;
try {
  api = require("@/lib/axios").default;
} catch (e) {
  api = null;
}

const AuthContext = createContext();

/** normalize a role-like value to lowercase string or null */
function normalizeRoleValue(v) {
  if (v === null || v === undefined) return null;
  return String(v).trim().toLowerCase();
}

/** Extract role/account_type from many possible shapes */
function parseRoleFromResponse(data, fallbackEmail) {
  if (!data) return null;

  // array case: pick matching email or first
  if (Array.isArray(data)) {
    if (fallbackEmail) {
      const found = data.find(
        (x) =>
          (x?.email && x.email.toLowerCase() === fallbackEmail.toLowerCase()) ||
          (x?.username &&
            x.username.toLowerCase() === fallbackEmail.toLowerCase())
      );
      if (found)
        return normalizeRoleValue(
          found.account_type ?? found.role ?? found.type
        );
    }
    const first = data[0];
    if (first)
      return normalizeRoleValue(first.account_type ?? first.role ?? first.type);
    return null;
  }

  // object case
  const user = data?.user ?? data;
  const cand =
    user?.account_type ??
    user?.accountType ??
    user?.role ??
    user?.type ??
    data?.role ??
    data?.account_type;
  if (cand !== undefined && cand !== null) return normalizeRoleValue(cand);

  return null;
}

/** Parse an app_user_id from a user object */
function parseAppUserIdFromUser(userObj) {
  if (!userObj) return null;
  return (
    userObj?.app_user_id ??
    userObj?.appUserId ??
    userObj?.user_id ??
    userObj?.userId ??
    userObj?.id ??
    userObj?.pk ??
    null
  );
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // bootstrap from localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const rawUser = localStorage.getItem("user");
        const rawToken = localStorage.getItem("token");
        if (rawUser) setUser(JSON.parse(rawUser));
        if (rawToken) setToken(rawToken);
      }
    } catch (err) {
      console.warn("Auth bootstrap failed", err);
    }
  }, []);

  // attempt endpoints to discover account_type by email
  async function attemptFetchAccountTypeByEmail(email) {
    if (!email) return null;
    const endpoints = [
      "/users/me/",
      "/profile/",
      "/get-all-agents/",
      "/agents/",
      "/get-all-agents",
    ];
    for (const ep of endpoints) {
      try {
        if (api && typeof api.get === "function") {
          const res = await api.get(ep);
          const data = res?.data;
          if (!data) continue;
          if (Array.isArray(data)) {
            const found = data.find(
              (x) => x?.email && x.email.toLowerCase() === email.toLowerCase()
            );
            if (found)
              return normalizeRoleValue(
                found.account_type ?? found.role ?? found.type
              );
          } else if (data?.account_type || data?.role || data?.type) {
            return normalizeRoleValue(
              data.account_type ?? data.role ?? data.type
            );
          } else if (
            data?.user &&
            (data.user.account_type || data.user.role || data.user.type)
          ) {
            return normalizeRoleValue(
              data.user.account_type ?? data.user.role ?? data.user.type
            );
          } else if (data?.results && Array.isArray(data.results)) {
            const found = data.results.find(
              (x) => x?.email && x.email.toLowerCase() === email.toLowerCase()
            );
            if (found)
              return normalizeRoleValue(
                found.account_type ?? found.role ?? found.type
              );
          }
        } else {
          const base =
            typeof window !== "undefined"
              ? process.env.NEXT_PUBLIC_API_BASE
              : undefined;
          const url = base ? `${base.replace(/\/$/, "")}${ep}` : ep;
          const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (!res.ok) continue;
          const data = await res.json().catch(() => null);
          if (!data) continue;
          if (Array.isArray(data)) {
            const found = data.find(
              (x) => x?.email && x.email.toLowerCase() === email.toLowerCase()
            );
            if (found)
              return normalizeRoleValue(
                found.account_type ?? found.role ?? found.type
              );
          } else if (data?.account_type || data?.role || data?.type) {
            return normalizeRoleValue(
              data.account_type ?? data.role ?? data.type
            );
          } else if (
            data?.user &&
            (data.user.account_type || data.user.role || data.user.type)
          ) {
            return normalizeRoleValue(
              data.user.account_type ?? data.user.role ?? data.user.type
            );
          } else if (data?.results && Array.isArray(data.results)) {
            const found = data.results.find(
              (x) => x?.email && x.email.toLowerCase() === email.toLowerCase()
            );
            if (found)
              return normalizeRoleValue(
                found.account_type ?? found.role ?? found.type
              );
          }
        }
      } catch (err) {
        // ignore endpoint errors and try next
        console.debug(
          "discover account_type failed for",
          ep,
          err?.message ?? err
        );
      }
    }
    return null;
  }

  async function signIn({ username, password }) {
    setLoading(true);
    const usernameEmail = username;

    try {
      if (api && typeof api.post === "function") {
        const res = await api.post("/sign-in/", { username, password });
        const data = res?.data ?? {};
        if (res.status >= 400) {
          const message =
            data?.detail || data?.message || data?.error || "Sign-in failed";
          throw new Error(message);
        }
        return await handleSuccess(data, usernameEmail);
      }

      const base =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_API_BASE
          : undefined;
      const endpoint = base
        ? `${base.replace(/\/$/, "")}/sign-in/`
        : "/api/sign-in";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          data?.detail ||
          data?.message ||
          data?.error ||
          `Sign-in failed (${res.status})`;
        throw new Error(message);
      }
      return await handleSuccess(data, usernameEmail);
    } catch (err) {
      console.error("signIn error", err);
      return { ok: false, error: err.message || "Sign-in failed" };
    } finally {
      setLoading(false);
    }

    async function handleSuccess(data, usernameEmail) {
      let returnedUser = null;
      let possibleToken = null;

      if (Array.isArray(data)) {
        if (usernameEmail) {
          const found = data.find(
            (x) =>
              (x?.email &&
                x.email.toLowerCase() === usernameEmail.toLowerCase()) ||
              (x?.username &&
                x.username.toLowerCase() === usernameEmail.toLowerCase())
          );
          returnedUser = found ?? data[0] ?? null;
        } else {
          returnedUser = data[0] ?? null;
        }
        possibleToken = data.token ?? null;
      } else {
        returnedUser = data.user ?? data;
        possibleToken =
          data.token || data.access || data.access_token || data.jwt || null;
      }

      if (Array.isArray(returnedUser)) {
        const found = usernameEmail
          ? returnedUser.find(
              (x) =>
                (x?.email &&
                  x.email.toLowerCase() === usernameEmail.toLowerCase()) ||
                (x?.username &&
                  x.username.toLowerCase() === usernameEmail.toLowerCase())
            )
          : null;
        returnedUser = found ?? returnedUser[0] ?? null;
      }

      returnedUser = returnedUser ?? {};

      let role = parseRoleFromResponse(data, usernameEmail);
      if (!role) {
        role =
          normalizeRoleValue(
            returnedUser?.account_type ??
              returnedUser?.accountType ??
              returnedUser?.role ??
              returnedUser?.type
          ) ?? null;
      }

      if (!role && usernameEmail) {
        try {
          const discovered = await attemptFetchAccountTypeByEmail(
            usernameEmail
          );
          if (discovered) role = discovered;
        } catch (err) {
          console.debug("discover fallback failed", err?.message ?? err);
        }
      }

      const appUserId =
        parseAppUserIdFromUser(returnedUser) ?? usernameEmail ?? null;
      returnedUser.app_user_id = returnedUser.app_user_id ?? appUserId;

      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(returnedUser));
          if (possibleToken) localStorage.setItem("token", possibleToken);
        }
      } catch (err) {
        console.warn("Failed to save auth to localStorage", err);
      }

      setUser(returnedUser);
      setToken(possibleToken);

      const normalizedRole = (role || "").toString().toLowerCase() || null;

      return { ok: true, role: normalizedRole, user: returnedUser };
    }
  }

  function signOut(redirectTo = "/auth/login") {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } catch (err) {
      console.warn("Failed to clear storage during signout", err);
    }
    setUser(null);
    setToken(null);
    router.push(redirectTo);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Named export used by client components */
export function useAuth() {
  return useContext(AuthContext);
}
