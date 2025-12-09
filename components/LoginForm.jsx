"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/images/tvet-logo.png";
import { useAuth } from "@/context/AuthContext"; // adjust if needed

export default function LoginForm({ demoCredentials = true }) {
  const router = useRouter();
  const { signIn, user: authUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [loadingLocal, setLoadingLocal] = useState(false);

  // canonical route map (accepts 'agents' plural)
  const ROUTES = {
    admin: "/admin/dashboard/analytics",
    agent: "/agent/dashboard",
    agents: "/agent/dashboard", // handle plural explicitly
    customer: "/customer/dashboard",
    user: "/dashboard",
  };

  function normalizeRole(v) {
    if (v === null || v === undefined) return null;
    return String(v).trim().toLowerCase();
  }

  // Detect account_type/role from many possible shapes
  function deriveAccountType(result, contextUser) {
    if (!result && !contextUser) return null;

    // direct fields on result
    if (result?.account_type) return normalizeRole(result.account_type);
    if (result?.role) return normalizeRole(result.role);
    if (result?.type) return normalizeRole(result.type);

    // nested shapes: data.user or result.user
    const maybeData = result?.data ?? result;
    const returnedUser = maybeData?.user ?? maybeData;

    if (returnedUser) {
      const candidates = [
        returnedUser.account_type,
        returnedUser.accountType,
        returnedUser.user_type,
        returnedUser.userType,
        returnedUser.role,
        returnedUser.type,
      ];
      for (const c of candidates) {
        if (c !== undefined && c !== null) {
          const norm = normalizeRole(c);
          if (norm && norm !== "null" && norm !== "undefined") return norm;
        }
      }
    }

    if (contextUser) {
      const candidates = [
        contextUser.account_type,
        contextUser.accountType,
        contextUser.user_type,
        contextUser.userType,
        contextUser.role,
        contextUser.type,
      ];
      for (const c of candidates) {
        if (c !== undefined && c !== null) {
          const norm = normalizeRole(c);
          if (norm && norm !== "null" && norm !== "undefined") return norm;
        }
      }
    }

    // heuristics from email/username
    const candidateEmail = String(
      result?.email ??
        result?.username ??
        returnedUser?.email ??
        contextUser?.email ??
        ""
    ).toLowerCase();
    if (candidateEmail.includes("@admin")) return "admin";
    if (candidateEmail.includes("@agent")) return "agent";
    if (candidateEmail.includes("agent@") || candidateEmail.includes("agent."))
      return "agent";

    // fallback literal search
    try {
      const txt = JSON.stringify(result ?? contextUser ?? "").toLowerCase();
      if (
        txt.includes('"account_type":"agents"') ||
        txt.includes('"account_type":"agent"') ||
        txt.includes('"role":"agents"') ||
        txt.includes('"role":"agent"')
      )
        return "agents";
      if (
        txt.includes('"account_type":"customer"') ||
        txt.includes('"role":"customer"')
      )
        return "customer";
    } catch (e) {}

    return null;
  }

  function routeForRole(role) {
    if (!role) return ROUTES.customer;
    const r = normalizeRole(role);
    if (!r) return ROUTES.customer;

    // direct mapping (handles 'agents' plural and synonyms)
    if (ROUTES[r]) return ROUTES[r];

    // substring heuristics
    if (r.includes("agent")) {
      // prefer plural route if the backend uses 'agents'
      if (r === "agents") return ROUTES.agents;
      return ROUTES.agent;
    }
    if (r.includes("admin")) return ROUTES.admin;
    if (r.includes("cust")) return ROUTES.customer;

    return ROUTES.customer;
  }

  function ensureAbsolutePath(path) {
    if (!path) return "/";
    try {
      const u = new URL(path);
      return u.href;
    } catch (e) {}
    if (path.startsWith("/")) return path;
    return `/${path.replace(/^\/+/, "")}`;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoadingLocal(true);

    try {
      // small UX delay
      await new Promise((r) => setTimeout(r, 200));

      const result = await signIn({ username, password });

      // debug logs — open DevTools to inspect response shape
      console.debug("[Login] signIn result:", result);
      console.debug("[Login] authUser from context:", authUser);

      if (!result || result.ok === false) {
        // prefer explicit server error, then raw.message/detail, then generic
        const message =
          result?.error ||
          result?.raw?.error ||
          result?.raw?.detail ||
          result?.raw?.message ||
          "Invalid credentials — try again";
        setError(message);
        return;
      }

      // Prioritize role from signIn result, then derive from user object
      let role = null;

      // First, check if signIn returned a role directly
      if (result.role) {
        role = normalizeRole(result.role);
      }

      // If no role, check the user object from result
      if (!role && result.user) {
        role = normalizeRole(
          result.user.account_type ||
            result.user.accountType ||
            result.user.role ||
            result.user.type
        );
      }

      // Fallback: use deriveAccountType function
      if (!role) {
        const acct = deriveAccountType(result, authUser);
        role = normalizeRole(acct);
      }

      // Final fallback to customer
      role = role || "customer";

      console.debug("[Login] resolved account_type:", role);

      const rawDest = routeForRole(role);
      const dest = ensureAbsolutePath(rawDest);

      if (dest.startsWith("http://") || dest.startsWith("https://")) {
        window.location.href = dest;
      } else {
        // replace so signin page not kept in history
        router.replace(dest);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.message || "Sign in failed");
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid justify-center">
          <Image
            src={logo}
            alt="Customer dashboard hero"
            width={40}
            height={40}
            className="rounded object-cover"
            priority
          />
          <h3 className="text-2xl font-semibold mb-4 text-slate-800">Login</h3>
        </div>

        {/* username */}
        <label htmlFor="username" className="block text-sm text-slate-600 mb-1">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          required
          className="w-full px-3 py-2 rounded-md mb-3 transition-shadow duration-150 outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />

        {/* password with toggle */}
        <label htmlFor="password" className="block text-sm text-slate-600 mb-1">
          Password
        </label>
        <div className="relative mb-3">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-3 py-2 rounded-md pr-20 transition-shadow duration-150 outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          />

          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-sm text-slate-600"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>

        <motion.button
          type="submit"
          disabled={loadingLocal}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:opacity-95 disabled:opacity-60"
        >
          {loadingLocal ? "Signing in..." : "Log in"}
        </motion.button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="mt-4 text-sm text-slate-600 text-center">
          <span className="mr-1">Don&apos;t have an account?</span>
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </motion.form>
  );
}
