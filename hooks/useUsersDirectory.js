"use client";

import { useCallback, useEffect, useRef, useState } from "react";

let api = null;
try {
  api = require("@/lib/axios").default;
} catch (err) {
  api = null;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cachedUsers = null;
let cachedAt = 0;
let pendingPromise = null;

const endpoint = "/get-all-users/";

async function fetchUsersDirectory(signal) {
  const headers = { "Content-Type": "application/json" };

  if (api && typeof api.get === "function") {
    const res = await api.get(endpoint, { signal });
    return res?.data ?? [];
  }

  const base =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "")
      : "";
  const url = base ? `${base}${endpoint}` : endpoint;

  const response = await fetch(url, {
    method: "GET",
    headers,
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch users (${response.status}) ${
        text || response.statusText
      }`
    );
  }

  return response.json().catch(() => []);
}

export function useUsersDirectory({ enabled = true } = {}) {
  const [state, setState] = useState({
    users: cachedUsers,
    loading: enabled && !cachedUsers,
    error: null,
  });

  const controllerRef = useRef(null);

  const loadUsers = useCallback(async () => {
    if (!enabled) return [];

    if (cachedUsers && Date.now() - cachedAt < CACHE_TTL) {
      setState({ users: cachedUsers, loading: false, error: null });
      return cachedUsers;
    }

    if (pendingPromise) {
      return pendingPromise;
    }

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    const promise = fetchUsersDirectory(controllerRef.current.signal)
      .then((users) => {
        cachedUsers = users;
        cachedAt = Date.now();
        setState({ users, loading: false, error: null });
        return users;
      })
      .catch((err) => {
        if (err.name === "AbortError") return [];
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Failed to load users",
        }));
        throw err;
      })
      .finally(() => {
        pendingPromise = null;
      });

    pendingPromise = promise;
    return promise;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return () => {};
    let mounted = true;

    const bootstrap = () => {
      if (cachedUsers && Date.now() - cachedAt < CACHE_TTL) {
        Promise.resolve().then(() => {
          if (mounted) {
            setState({ users: cachedUsers, loading: false, error: null });
          }
        });
        return;
      }

      setState((prev) => ({ ...prev, loading: true }));

      loadUsers().catch((err) => {
        if (!mounted || err.name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Failed to load users",
        }));
      });
    };

    bootstrap();

    return () => {
      mounted = false;
      controllerRef.current?.abort();
    };
  }, [enabled, loadUsers]);

  const getUserById = useCallback(
    (id) => {
      if (!id || !state.users) return null;
      return state.users.find(
        (user) => user?.id && String(user.id) === String(id)
      );
    },
    [state.users]
  );

  return {
    users: state.users ?? [],
    loading: Boolean(state.loading),
    error: state.error,
    refresh: loadUsers,
    getUserById,
  };
}

