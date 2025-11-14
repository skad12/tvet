"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/axios";

const AuthContext = createContext(null);

/**
 * Named export: AuthProvider
 * - Client component (use client)
 * - Exposes: user, token, loading, signIn, signOut
 */
export function AuthProvider({ children }) {
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
    } catch (e) {
      console.warn("Auth bootstrap failed", e);
    }
  }, []);

  async function signIn({ username, password }) {
    setLoading(true);
    try {
      const res = await api.post("/sign-in/", { username, password });
      const data = res?.data ?? {};
      const resolvedToken =
        data.token || data.access || data.access_token || null;
      const returnedUser =
        data.user ?? { id: data.id, account_type: data.account_type } ?? data;

      if (resolvedToken) {
        try {
          localStorage.setItem("token", resolvedToken);
        } catch (e) {}
      }
      try {
        localStorage.setItem("user", JSON.stringify(returnedUser));
      } catch (e) {}

      setUser(returnedUser);
      setToken(resolvedToken);

      return { ok: true, user: returnedUser, token: resolvedToken, raw: data };
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Sign-in failed";
      return {
        ok: false,
        error: message,
        status: err?.response?.status ?? null,
      };
    } finally {
      setLoading(false);
    }
  }

  function signOut(redirect = null) {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {}
    setUser(null);
    setToken(null);
    // optionally use the router to redirect if you want
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Named export: useAuth hook */
export function useAuth() {
  return useContext(AuthContext);
}
