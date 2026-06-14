"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
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
    agent: "/agent/dashboard", // handle plural explicitly
    agents: "/agent/dashboard",
    super_agent: "/super_agent/dashboard",
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
    if (r.includes("super_agent") || r.includes("super-agent")) {
      return ROUTES.super_agent;
    }
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
        toast.error(message);
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
      toast.success("Signed in successfully");

      if (dest.startsWith("http://") || dest.startsWith("https://")) {
        window.location.href = dest;
      } else {
        // replace so signin page not kept in history
        router.replace(dest);
      }
    } catch (err) {
      console.error("Login error:", err);
      const message = err?.message || "Sign in failed";
      setError(message);
      toast.error(message);
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
      className="mx-auto w-full max-w-md"
    >
      <div className="rounded-4xl border border-slate-200 bg-white/95 px-6 py-10 shadow-2xl shadow-blue-950/10 backdrop-blur md:px-8">
        <div className="mb-8 grid justify-center text-center">
          <Image
            src={logo}
            alt="TVET Support"
            width={56}
            height={56}
            className="mx-auto rounded object-cover"
            priority
          />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
            Welcome back
          </p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Login
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Access your TVET support dashboard.
          </p>
        </div>

        {/* username */}
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
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
          className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />

        {/* password with toggle */}
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <div className="relative mb-4">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 pr-12 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <EyeOff className="h-5 w-5" aria-hidden />
            ) : (
              <Eye className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>

        <motion.button
          type="submit"
          disabled={loadingLocal}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingLocal ? "Signing in..." : "Log in"}
        </motion.button>
{/* 
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )} */}

        {/* <div className="mt-4 text-sm text-slate-600 text-center">
          <span className="mr-1">Don&apos;t have an account?</span>
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:underline"
          >
            Create an account
          </Link>
        </div> */}
      </div>
    </motion.form>
  );
}
