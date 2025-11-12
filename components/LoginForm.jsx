// "use client";

// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import logo from "@/public/images/tvet-logo.png";
// import { useAuth } from "@/context/AuthContext"; // <-- adjust if your AuthContext path is different

// export default function LoginForm({ demoCredentials = true }) {
//   const router = useRouter();
//   const { signIn, user: authUser } = useAuth();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [show, setShow] = useState(false);
//   const [error, setError] = useState(null);
//   const [loadingLocal, setLoadingLocal] = useState(false);

//   // map account_type/role to dashboard routes (all absolute paths)
//   const REDIRECT_MAP = {
//     admin: "/admin/dashboard/analytics",
//     agent: "/agent/dashboard",
//     customer: "/customer/dashboard",
//     user: "/dashboard",
//   };

//   // Try to derive account_type from multiple likely places
//   function deriveAccountType(result, contextUser) {
//     // 1) result.role (if your signIn returns a 'role' directly)
//     if (result?.role) return String(result.role).toLowerCase();

//     // 2) result.user?.account_type or result.user?.role
//     const returnedUser = result?.user ?? result;
//     if (returnedUser) {
//       if (returnedUser.account_type)
//         return String(returnedUser.account_type).toLowerCase();
//       if (returnedUser.role) return String(returnedUser.role).toLowerCase();
//       if (returnedUser.type) return String(returnedUser.type).toLowerCase();
//     }

//     // 3) context authUser (in case signIn populated context.user)
//     if (contextUser) {
//       if (contextUser.account_type)
//         return String(contextUser.account_type).toLowerCase();
//       if (contextUser.role) return String(contextUser.role).toLowerCase();
//       if (contextUser.type) return String(contextUser.type).toLowerCase();
//     }

//     // 4) fallback: if email looks like an admin or agent pattern (optional)
//     if (result?.email || contextUser?.email) {
//       const e = String(result?.email ?? contextUser?.email).toLowerCase();
//       if (e.includes("@admin")) return "admin";
//       if (e.includes("@agent")) return "agent";
//     }

//     return null;
//   }

//   // ensure path is absolute or a full URL
//   function ensureAbsolutePath(path) {
//     if (!path) return "/";
//     try {
//       // if it's a full URL, return as-is
//       const url = new URL(path);
//       return url.href;
//     } catch (e) {
//       // not a full URL, continue
//     }
//     if (path.startsWith("/")) return path;
//     return `/${path.replace(/^\/+/, "")}`;
//   }

//   const submit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setLoadingLocal(true);

//     try {
//       // small artificial delay (optional, UX)
//       await new Promise((r) => setTimeout(r, 300));

//       // call the context signIn which posts to /sign-in/
//       const result = await signIn({ username: email, password });

//       // expected result shape from the AuthContext: { ok, role, user, error }
//       if (!result || result.ok === false) {
//         const message = result?.error || "Invalid credentials — try again";
//         setError(message);
//         return;
//       }

//       // derive account_type / role robustly
//       const acctType = deriveAccountType(result, authUser) || "customer";
//       const role = acctType.toLowerCase();

//       // choose destination from map, fallback to customer/dashboard
//       const rawDest = REDIRECT_MAP[role] ?? REDIRECT_MAP.customer;
//       const dest = ensureAbsolutePath(rawDest);

//       // if full URL -> redirect via window.location, else use router
//       if (dest.startsWith("http://") || dest.startsWith("https://")) {
//         window.location.href = dest;
//       } else {
//         router.push(dest);
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

//         {/* {demoCredentials && (
//           <div className="mt-4 text-xs text-slate-500">
//             Demo credentials: <strong>admin@tvet.local</strong> /{" "}
//             <strong>secret</strong>
//           </div>
//         )} */}
//       </div>
//     </motion.form>
//   );
// }

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/images/tvet-logo.png";
import { useAuth } from "@/context/AuthContext"; // adjust if needed

export default function LoginForm({ demoCredentials = true }) {
  const router = useRouter();
  const { signIn, user: authUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [loadingLocal, setLoadingLocal] = useState(false);

  // canonical route map (accepts 'agents' plural)
  const ROUTES = {
    admin: "/admin/dashboard/analytics",
    agent: "/agent/dashboard", // if you use singular route
    agents: "/agents/dashboard", // handle plural explicitly
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

      const result = await signIn({ username: email, password });

      // debug logs — open DevTools to inspect response shape
      console.debug("[Login] signIn result:", result);
      console.debug("[Login] authUser from context:", authUser);

      if (!result || result.ok === false) {
        const message = result?.error || "Invalid credentials — try again";
        setError(message);
        return;
      }

      // derive account_type (will be 'admin' | 'customer' | 'agents' in your case)
      const acct = deriveAccountType(result, authUser) || "customer";
      let role = normalizeRole(acct) || "customer";

      // If backend returns plural 'agents', keep it; routeForRole handles it.
      console.debug("[Login] derived account_type:", role);

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

        {/* email */}
        <label className="block text-sm text-slate-600 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@tvet.local"
          required
          className="w-full px-3 py-2 rounded-md mb-3 transition-shadow duration-150 outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />

        {/* password with toggle */}
        <label className="block text-sm text-slate-600 mb-1">Password</label>
        <div className="relative mb-3">
          <input
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
        {/* 
        {demoCredentials && (
          <div className="mt-4 text-xs text-slate-500">
            Demo credentials: <strong>admin@tvet.local</strong> /{" "}
            <strong>secret</strong>
          </div>
        )} */}
      </div>
    </motion.form>
  );
}
