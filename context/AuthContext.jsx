"use client";

import React, { createContext, useContext, useEffect } from "react";
import api from "@/lib/axios";
import { useUserStore } from "@/stores/useUserStore";

const AuthContext = createContext(null);

/**
 * Named export: AuthProvider
 * - Client component (use client)
 * - Exposes: user, token, loading, signIn, signOut
 * - Now uses Zustand store internally for unified state management
 */
export function AuthProvider({ children }) {
  const {
    user,
    token,
    loading,
    setUser,
    setToken,
    clearUser,
    setLoading,
    setError,
  } = useUserStore();

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const rawUser = localStorage.getItem("user");
      const rawToken = localStorage.getItem("token");
      if (rawUser && !user) {
        try {
          const parsedUser = JSON.parse(rawUser);
          setUser(parsedUser);
        } catch (e) {
          console.warn("Failed to parse user from localStorage", e);
        }
      }
      if (rawToken && !token) {
        setToken(rawToken);
      }
    } catch (e) {
      console.warn("Auth bootstrap failed", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  async function signIn({ username, password }) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/sign-in/", { username, password });
      const data = res?.data ?? {};
      const resolvedToken =
        data.token || data.access || data.access_token || null;
      const returnedUser =
        data.user ?? { id: data.id, account_type: data.account_type } ?? data;

      if (resolvedToken) {
        setToken(resolvedToken);
        // Also store in localStorage for backward compatibility
        try {
          localStorage.setItem("token", resolvedToken);
        } catch (e) {}
      }
      if (returnedUser) {
        setUser(returnedUser);
        // Also store in localStorage for backward compatibility
        try {
          localStorage.setItem("user", JSON.stringify(returnedUser));
          const role =
            returnedUser.account_type ??
            returnedUser.role ??
            returnedUser.type ??
            null;
          if (role) {
            localStorage.setItem("account_type", role);
          }
        } catch (e) {}
      }

      return { ok: true, user: returnedUser, token: resolvedToken, raw: data };
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Sign-in failed";
      setError(message);
      return {
        ok: false,
        error: message,
        status: err?.response?.status ?? null,
      };
    } finally {
      setLoading(false);
    }
  }

  async function signOut(redirect = "/auth/login") {
    try {
      // Call sign-out endpoint
      if (api && typeof api.post === "function") {
        try {
          await api.post("/sign-out/");
        } catch (err) {
          // Continue with logout even if endpoint fails
          console.warn("Sign-out endpoint failed:", err);
        }
      }
    } catch (err) {
      console.warn("Sign-out error:", err);
    }
    
    clearUser(); // This will clear both user and token, and localStorage
    // Clear tickets as well when logging out
    useUserStore.getState().setTickets([]);
    // Redirect to login page by default
    if (typeof window !== "undefined") {
      window.location.href = redirect;
    }
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
