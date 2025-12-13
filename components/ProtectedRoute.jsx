"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({
  allowed,
  fallback = "/auth/login",
  children,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const { user, loading } = useAuth();

  function normalizePath(path) {
    if (!path) return "/auth/login";
    if (path.startsWith("/")) return path;
    return `/${path.replace(/^\/+/, "")}`;
  }

  function requiredRoleFromPath(path) {
    if (!path) return null;
    const p = path.toLowerCase();
    if (p.startsWith("/admin")) return "admin";
    if (p.startsWith("/agent")) return "agent";
    if (p.startsWith("/super_agent") || p.startsWith("/super-agent")) return "super_agent";
    if (p.startsWith("/customer")) return "customer";
    return null;
  }

  const allowedRoles = useMemo(() => {
    if (Array.isArray(allowed) && allowed.length > 0) {
      return allowed.map((r) => r.toString().toLowerCase());
    }
    const inferred = requiredRoleFromPath(pathname);
    return inferred ? [inferred] : null;
  }, [allowed, pathname]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const doCheck = async () => {
      if (!cancelled) setChecking(true);
      try {
        const normalizedFallback = normalizePath(fallback);

        let role = user?.account_type ?? user?.role ?? user?.type ?? null;

        if (!role && typeof window !== "undefined") {
          role = localStorage.getItem("account_type") ?? null;
          if (!role) {
            const rawUser = localStorage.getItem("user");
            if (rawUser) {
              try {
                const parsed = JSON.parse(rawUser);
                role = parsed?.account_type ?? parsed?.role ?? parsed?.type;
              } catch (err) {
                console.warn("Failed to parse stored user for role", err);
              }
            }
          }
        }

        role = role ? String(role).toLowerCase() : null;

        if (!role) {
          router.replace(normalizedFallback);
          return;
        }

        if (allowedRoles && !allowedRoles.includes(role)) {
          router.replace(normalizedFallback);
          return;
        }

        if (!cancelled) setChecking(false);
      } catch (err) {
        console.error("ProtectedRoute check failed (permissive):", err);
        // permissive fallback: render children
        if (!cancelled) setChecking(false);
      }
    };

    doCheck();
    return () => {
      cancelled = true;
    };
  }, [allowedRoles, fallback, loading, pathname, router, user]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[160px]">
        <svg
          className="animate-spin w-6 h-6 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}
