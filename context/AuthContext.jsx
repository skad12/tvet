"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// try to import your axios instance (optional). If you don't have one,
// ensure the path is correct or remove the try/catch.
let api = null;
try {
  // adjust path if your axios helper lives elsewhere
  // eslint-disable-next-line import/no-unresolved
  api = require("@/lib/axios").default;
} catch (e) {
  api = null;
}

const AuthContext = createContext();

function parseRoleFromResponse(data) {
  const user = data?.user ?? data;
  return (
    (user && (user.account_type || user.role || user.type)) ||
    data?.role ||
    data?.account_type ||
    null
  );
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const rawUser =
        typeof window !== "undefined" && localStorage.getItem("user");
      const rawToken =
        typeof window !== "undefined" && localStorage.getItem("token");
      if (rawUser) setUser(JSON.parse(rawUser));
      if (rawToken) setToken(rawToken);
    } catch (err) {
      console.warn("Auth bootstrap failed", err);
    }
  }, []);

  async function signIn({ username, password }) {
    setLoading(true);

    try {
      // 1) prefer using your axios api helper if available
      if (api && typeof api.post === "function") {
        const res = await api.post("/sign-in/", { username, password });
        const data = res?.data ?? {};
        if (res.status >= 400) {
          const message =
            data?.detail || data?.message || data?.error || "Sign-in failed";
          throw new Error(message);
        }
        return handleSuccess(data);
      }

      // 2) otherwise try external base URL from env (set NEXT_PUBLIC_API_BASE in .env)
      //    e.g. NEXT_PUBLIC_API_BASE=http://localhost:8000
      const base =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_API_BASE
          : undefined;
      const endpoint = base
        ? `${base.replace(/\/$/, "")}/sign-in/`
        : "/api/sign-in"; // fallback to internal Next.js API route

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

      return handleSuccess(data);
    } catch (err) {
      console.error("signIn error", err);
      return { ok: false, error: err.message || "Sign-in failed" };
    } finally {
      setLoading(false);
    }

    // handle success in one place
    function handleSuccess(data) {
      const returnedUser = data.user ?? data;
      const possibleToken =
        data.token || data.access || data.access_token || data.jwt || null;

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

      const rawRole = parseRoleFromResponse(data);
      const role = (rawRole || "").toString().toLowerCase();

      return { ok: true, role, user: returnedUser };
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

export function useAuth() {
  return useContext(AuthContext);
}
