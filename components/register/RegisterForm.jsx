// "use client";

// import { useState, useEffect, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import logo from "@/public/images/tvet-logo.png";

// // Prefer your axios helper if available (optional)
// let api = null;
// try {
//   api = require("@/lib/axios").default;
// } catch (e) {
//   api = null;
// }

// export default function RegisterForm({}) {
//   const router = useRouter();
//   const [name, setName] = useState("");
//   const [username, setUsername] = useState("");
//   const [phone, setPhone] = useState("");
//   const [accountType, setAccountType] = useState("customer");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirm, setConfirm] = useState("");
//   const [terms, setTerms] = useState(false);

//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [showPopup, setShowPopup] = useState(false);
//   const [serverDebug, setServerDebug] = useState(null);

//   const popupTimer = useRef(null);
//   const mounted = useRef(true);
//   useEffect(() => () => (mounted.current = false), []);

//   useEffect(() => {
//     return () => {
//       if (popupTimer.current) clearTimeout(popupTimer.current);
//     };
//   }, []);

//   const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

//   const validate = () => {
//     const e = {};
//     if (!name.trim()) e.name = "Please enter your full name.";
//     if (!email.trim() || !isEmail(email))
//       e.email = "Enter a valid email address.";
//     if (!password || password.length < 8)
//       e.password = "Password must be at least 8 characters.";
//     if (password !== confirm) e.confirm = "Passwords do not match.";
//     if (!terms) e.terms = "You must accept terms to continue.";
//     // optional phone validation (very lenient)
//     if (phone && !/^[0-9+\-\s()]{6,25}$/.test(phone))
//       e.phone = "Enter a valid phone number (optional).";

//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   // create a sane default username if user didn't supply one
//   function deriveUsername(nameVal, emailVal) {
//     if (username) return username;
//     if (emailVal && isEmail(emailVal)) return emailVal.split("@")[0];
//     if (nameVal) return nameVal.toLowerCase().replace(/\s+/g, ".");
//     return `user${Date.now()}`;
//   }

//   const submit = async (ev) => {
//     ev.preventDefault();
//     setErrors({});
//     setServerDebug(null);

//     if (!validate()) return;

//     setLoading(true);
//     try {
//       const finalUsername = deriveUsername(name, email);
//       const payload = {
//         phone_number: phone || "",
//         account_type: accountType || "customer",
//         email: email.trim(),
//         username: finalUsername,
//         password,
//       };

//       let res;
//       // try axios helper
//       if (api && typeof api.post === "function") {
//         res = await api.post("/sign-up/", payload);
//       } else {
//         // use NEXT_PUBLIC_API_BASE if provided, otherwise local Next API path
//         const base =
//           typeof window !== "undefined"
//             ? process.env.NEXT_PUBLIC_API_BASE
//             : undefined;
//         const endpoint = base
//           ? `${base.replace(/\/$/, "")}/sign-up/`
//           : "/api/sign-up";
//         const r = await fetch(endpoint, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         });
//         // collect body for debug if not ok
//         if (!r.ok) {
//           const text = await r.text().catch(() => "");
//           const err = new Error(`Sign up failed (${r.status})`);
//           err.response = { status: r.status, data: text };
//           throw err;
//         }
//         const json = await r.json().catch(() => ({}));
//         res = { status: r.status, data: json };
//       }

//       const ok =
//         res && (res.status === 201 || res.status === 200 || res.data?.ok);
//       if (!ok) {
//         const message =
//           res?.data?.message ?? res?.data?.detail ?? "Registration failed";
//         setErrors({ form: message });
//         setServerDebug(res?.data ?? res);
//         return;
//       }

//       // Normalize returned user and token if present
//       const returned = res.data ?? {};
//       const createdUser =
//         returned.user ??
//         returned.data ??
//         (returned.email ? returned : null) ??
//         null;

//       const possibleToken =
//         returned.token ??
//         returned.access ??
//         returned.access_token ??
//         returned.jwt ??
//         null;

//       // store in localStorage
//       try {
//         if (typeof window !== "undefined") {
//           if (createdUser)
//             localStorage.setItem("user", JSON.stringify(createdUser));
//           if (possibleToken) localStorage.setItem("token", possibleToken);
//           localStorage.setItem("tvet_user_email", email.trim());
//         }
//       } catch (err) {
//         console.warn("Failed to save registration to localStorage", err);
//       }

//       if (mounted.current) {
//         setSuccess(true);
//         // ensure loading state is cleared so button text updates immediately
//         setLoading(false);
//         // show popup notification
//         setShowPopup(true);
//         if (popupTimer.current) clearTimeout(popupTimer.current);
//         popupTimer.current = setTimeout(() => setShowPopup(false), 5000);
//       }

//       // small delay then redirect (if provided)
//       setTimeout(() => {
//         if (!mounted.current) return;
//         if (redirectAfter) router.push(redirectAfter);
//       }, 800);
//     } catch (err) {
//       console.error("register error", err);
//       const msg =
//         err?.response?.data?.message ||
//         err?.response?.data ||
//         err?.message ||
//         "Unknown error during registration";
//       setErrors({ form: String(msg) });
//       if (err?.response?.data) setServerDebug(err.response.data);
//       else setServerDebug(err?.message ?? err);
//     } finally {
//       if (mounted.current) setLoading(false);
//     }
//   };

//   const fieldVariants = {
//     hidden: { opacity: 0, y: 8 },
//     visible: { opacity: 1, y: 0 },
//   };
//   const baseInput =
//     "w-full border px-3 py-2 rounded transition-shadow duration-150 outline-none focus:ring-2";

//   return (
//     <div className="w-full max-w-md mx-auto mt-16 px-4">
//       <motion.div
//         initial={{ opacity: 0, y: 14 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         className="bg-white p-8 rounded-2xl shadow-lg relative"
//       >
//         <div className="grid justify-center mb-3">
//           <Image
//             src={logo}
//             alt="logo"
//             width={48}
//             height={48}
//             className="rounded"
//             priority
//           />
//         </div>

//         <h3 className="text-2xl font-semibold text-center mb-4">
//           Create Account
//         </h3>

//         {errors.form && (
//           <div className="mb-3 text-sm text-red-700 bg-red-50 p-2 rounded">
//             {errors.form}
//           </div>
//         )}

//         {!success ? (
//           <motion.form
//             onSubmit={submit}
//             initial="hidden"
//             animate="visible"
//             variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
//             className="space-y-4"
//             noValidate
//           >
//             {/* form fields (unchanged) */}
//             <motion.div variants={fieldVariants}>
//               <label className="text-sm font-medium block mb-1">
//                 Full name
//               </label>
//               <input
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 placeholder="Jane Doe"
//                 required
//                 className={`${baseInput} ${
//                   errors.name
//                     ? "border-red-400 focus:ring-red-400"
//                     : "border-slate-200 focus:ring-blue-400"
//                 } shadow-sm`}
//                 aria-invalid={!!errors.name}
//               />
//               {errors.name && (
//                 <div className="text-xs text-red-600 mt-1">{errors.name}</div>
//               )}
//             </motion.div>

//             <motion.div variants={fieldVariants}>
//               <label className="text-sm font-medium block mb-1">
//                 Username (optional)
//               </label>
//               <input
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 placeholder="username"
//                 className={`${baseInput} border-slate-200 focus:ring-blue-400 shadow-sm`}
//               />
//               <div className="text-xs text-slate-400 mt-1">
//                 If left blank derive a username from your email.
//               </div>
//             </motion.div>

//             <motion.div variants={fieldVariants}>
//               <label className="text-sm font-medium block mb-1">
//                 Phone (optional)
//               </label>
//               <input
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value)}
//                 placeholder="+234 800 000 0000"
//                 className={`${baseInput} ${
//                   errors.phone
//                     ? "border-red-400 focus:ring-red-400"
//                     : "border-slate-200 focus:ring-blue-400"
//                 } shadow-sm`}
//               />
//               {errors.phone && (
//                 <div className="text-xs text-red-600 mt-1">{errors.phone}</div>
//               )}
//             </motion.div>

//             <motion.div variants={fieldVariants}>
//               <label className="text-sm font-medium block mb-1">
//                 Account type
//               </label>
//               <select
//                 value={accountType}
//                 onChange={(e) => setAccountType(e.target.value)}
//                 className={`${baseInput} border-slate-200 focus:ring-blue-400 shadow-sm`}
//               >
//                 <option value="customer">Customer</option>
//                 <option value="agent">agent</option>
//               </select>
//             </motion.div>

//             <motion.div variants={fieldVariants}>
//               <label className="text-sm font-medium block mb-1">
//                 Email address
//               </label>
//               <input
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 type="email"
//                 placeholder="you@example.com"
//                 required
//                 className={`${baseInput} ${
//                   errors.email
//                     ? "border-red-400 focus:ring-red-400"
//                     : "border-slate-200 focus:ring-blue-400"
//                 } shadow-sm`}
//                 aria-invalid={!!errors.email}
//               />
//               {errors.email && (
//                 <div className="text-xs text-red-600 mt-1">{errors.email}</div>
//               )}
//             </motion.div>

//             <motion.div variants={fieldVariants}>
//               <label className="text-sm font-medium block mb-1">Password</label>
//               <PasswordField
//                 value={password}
//                 onChange={setPassword}
//                 error={errors.password}
//               />
//               {errors.password && (
//                 <div className="text-xs text-red-600 mt-1">
//                   {errors.password}
//                 </div>
//               )}
//             </motion.div>

//             <motion.div variants={fieldVariants}>
//               <label className="text-sm font-medium block mb-1">
//                 Confirm password
//               </label>
//               <input
//                 value={confirm}
//                 onChange={(e) => setConfirm(e.target.value)}
//                 type="password"
//                 placeholder="Confirm password"
//                 required
//                 className={`${baseInput} ${
//                   errors.confirm
//                     ? "border-red-400 focus:ring-red-400"
//                     : "border-slate-200 focus:ring-blue-400"
//                 } shadow-sm`}
//                 aria-invalid={!!errors.confirm}
//               />
//               {errors.confirm && (
//                 <div className="text-xs text-red-600 mt-1">
//                   {errors.confirm}
//                 </div>
//               )}
//             </motion.div>

//             <motion.div
//               variants={fieldVariants}
//               className="flex items-center gap-2 text-sm"
//             >
//               <input
//                 id="terms"
//                 type="checkbox"
//                 checked={terms}
//                 onChange={(e) => setTerms(e.target.checked)}
//               />
//               <label htmlFor="terms" className="text-sm">
//                 I agree to the{" "}
//                 <a
//                   className="text-blue-600 underline"
//                   href="/terms"
//                   target="_blank"
//                   rel="noreferrer"
//                 >
//                   terms & conditions
//                 </a>
//               </label>
//             </motion.div>
//             {errors.terms && (
//               <div className="text-xs text-red-600 mt-1">{errors.terms}</div>
//             )}

//             <motion.button
//               variants={fieldVariants}
//               whileTap={{ scale: 0.985 }}
//               whileHover={{ scale: 1.01 }}
//               disabled={loading}
//               type="submit"
//               className={`w-full text-white py-2 rounded-lg ${
//                 loading ? "bg-blue-400" : "bg-blue-600"
//               } focus:outline-none focus:ring-2 focus:ring-blue-400`}
//             >
//               {loading ? "Creating account…" : "Register"}
//             </motion.button>

//             {serverDebug && (
//               <div className="mt-2 text-xs text-slate-500">
//                 <details>
//                   <summary className="text-xs underline cursor-pointer">
//                     Server debug (click to view)
//                   </summary>
//                   <pre className="text-xs bg-slate-100 p-2 rounded mt-1 max-h-40 overflow-auto">
//                     {typeof serverDebug === "string"
//                       ? serverDebug
//                       : JSON.stringify(serverDebug, null, 2)}
//                   </pre>
//                 </details>
//               </div>
//             )}
//           </motion.form>
//         ) : (
//           <SuccessBox />
//         )}

//         {/* Popup Toast for success */}
//         <AnimatePresence>
//           {showPopup && (
//             <motion.div
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               transition={{ duration: 0.18 }}
//               className="pointer-events-auto fixed right-4 top-6 z-50 w-full max-w-sm rounded shadow-lg"
//               role="status"
//               aria-live="polite"
//             >
//               <div className="flex items-start gap-3 p-3 rounded bg-white border border-slate-200">
//                 <div className="flex-shrink-0">
//                   <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 border border-green-100">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="w-5 h-5"
//                       viewBox="0 0 20 20"
//                       fill="currentColor"
//                       aria-hidden
//                     >
//                       <path
//                         fillRule="evenodd"
//                         d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                         clipRule="evenodd"
//                       />
//                     </svg>
//                   </div>
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium text-slate-900">
//                     Account created
//                   </p>
//                   <p className="text-sm text-slate-600">
//                     Check your email for verification.
//                   </p>
//                 </div>

//                 <div className="flex items-start ml-3">
//                   <button
//                     onClick={() => setShowPopup(false)}
//                     aria-label="Close"
//                     className="inline-flex p-1 rounded text-slate-400 hover:text-slate-600"
//                   >
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="w-4 h-4"
//                       viewBox="0 0 20 20"
//                       fill="currentColor"
//                       aria-hidden
//                     >
//                       <path
//                         fillRule="evenodd"
//                         d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
//                         clipRule="evenodd"
//                       />
//                     </svg>
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     </div>
//   );
// }

// /* ---------- Subcomponents (local) ---------- */

// function PasswordField({ value, onChange, error }) {
//   const [show, setShow] = useState(false);
//   const focusClass = error ? "focus:ring-red-400" : "focus:ring-blue-400";
//   return (
//     <div className="relative">
//       <input
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         type={show ? "text" : "password"}
//         placeholder="Create a password"
//         className={`w-full border px-3 py-2 rounded ${
//           error ? "border-red-400" : "border-slate-200"
//         } transition-shadow duration-150 outline-none focus:ring-2 ${focusClass} shadow-sm`}
//         aria-invalid={!!error}
//       />
//       <button
//         type="button"
//         onClick={() => setShow((s) => !s)}
//         aria-label={show ? "Hide password" : "Show password"}
//         className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-slate-600 px-2 py-1"
//       >
//         {show ? "Hide" : "Show"}
//       </button>
//     </div>
//   );
// }

// function SuccessBox() {
//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="flex flex-col items-center gap-4 py-8"
//     >
//       <motion.svg
//         width="80"
//         height="80"
//         viewBox="0 0 120 120"
//         fill="none"
//         xmlns="http://www.w3.org/2000/svg"
//       >
//         <motion.circle
//           cx="60"
//           cy="60"
//           r="50"
//           stroke="#10b981"
//           strokeWidth="6"
//           initial={{ pathLength: 0 }}
//           animate={{ pathLength: 1 }}
//         />
//         <motion.path
//           d="M36 62l14 14 34-38"
//           stroke="#10b981"
//           strokeWidth="6"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           initial={{ pathLength: 0 }}
//           animate={{ pathLength: 1 }}
//         />
//       </motion.svg>

//       <div className="text-center">
//         <h4 className="text-lg font-semibold">Account created</h4>
//         <p className="text-sm text-slate-600">
//           Check your email for verification (demo).
//         </p>
//       </div>
//     </motion.div>
//   );
// }

"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import logo from "@/public/images/tvet-logo.png";
import api from "@/lib/axios"; // if missing, the code falls back to fetch

// ----- validation schema -----
const RegisterSchema = z
  .object({
    name: z.string().min(1, "Please enter your full name"),
    username: z.string().optional().or(z.literal("")).nullable(),
    phone: z
      .string()
      .optional()
      .refine((v) => !v || /^[0-9+\-\s()]{6,25}$/.test(v), {
        message: "Enter a valid phone number",
      }),
    accountType: z.enum(["customer", "agent"]).default("customer"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
    terms: z.literal(true).refine(Boolean, {
      message: "You must accept terms to continue",
    }),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export default function RegisterForm({
  redirectAfter = "/customer/dashboard",
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [serverError, setServerError] = useState(null);
  const popupTimer = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      username: "",
      phone: "",
      accountType: "customer",
      email: "",
      password: "",
      confirm: "",
      terms: false,
    },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    setLoading(true);

    const payload = {
      name: values.name.trim(),
      username: values.username?.trim() || undefined,
      phone_number: values.phone?.trim() || "",
      account_type: values.accountType,
      email: values.email.trim(),
      password: values.password,
    };

    try {
      let res;
      if (api && typeof api.post === "function") {
        res = await api.post("/sign-up/", payload);
      } else {
        const base =
          typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE : "";
        const endpoint = base
          ? `${base.replace(/\/$/, "")}/sign-up/`
          : "/api/sign-up";
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await r.json().catch(() => ({}));
        res = { status: r.status, data };
        if (!r.ok) throw { response: { status: r.status, data } };
      }

      const ok =
        res && (res.status === 201 || res.status === 200 || res.data?.ok);
      if (!ok) {
        const msg =
          res?.data?.message ?? res?.data?.detail ?? "Registration failed";
        setServerError(String(msg));
        setLoading(false);
        return;
      }

      // save returned user/token to localStorage if provided
      const returned = res.data ?? {};
      const user = returned.user ?? returned.data ?? null;
      const token =
        returned.token ??
        returned.access ??
        returned.access_token ??
        returned.jwt ??
        null;
      try {
        if (typeof window !== "undefined") {
          if (user) localStorage.setItem("user", JSON.stringify(user));
          if (token) localStorage.setItem("token", token);
          localStorage.setItem("tvet_user_email", values.email.trim());
        }
      } catch (err) {
        console.warn("localStorage save failed", err);
      }

      // success UI
      setShowPopup(true);
      reset();
      popupTimer.current && clearTimeout(popupTimer.current);
      popupTimer.current = setTimeout(() => setShowPopup(false), 4500);

      // redirect slightly after success
      setTimeout(() => router.push(redirectAfter), 800);
    } catch (err) {
      console.error("Sign up error", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Unknown server error";
      setServerError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white p-6 rounded-2xl shadow"
      >
        <div className="flex justify-center mb-3">
          <Image src={logo} alt="logo" width={48} height={48} priority />
        </div>

        <h3 className="text-2xl font-semibold text-center mb-4">
          Create Account
        </h3>

        {serverError && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 p-2 rounded">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm block mb-1">Full name</label>
            <input
              {...register("name")}
              className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Jane Doe"
            />
            {errors.name && (
              <div className="text-xs text-red-600 mt-1">
                {errors.name.message}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm block mb-1">Username (optional)</label>
            <input
              {...register("username")}
              className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="username"
            />
            <div className="text-xs text-slate-400 mt-1">
              If blank, a username is derived from your email.
            </div>
          </div>

          <div>
            <label className="text-sm block mb-1">Phone (optional)</label>
            <input
              {...register("phone")}
              className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="+234 800 000 0000"
            />
            {errors.phone && (
              <div className="text-xs text-red-600 mt-1">
                {errors.phone.message}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm block mb-1">Account type</label>
            <select
              {...register("accountType")}
              className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="customer">customer</option>
              <option value="agent">agent</option>
            </select>
          </div>

          <div>
            <label className="text-sm block mb-1">Email address</label>
            <input
              {...register("email")}
              type="email"
              className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="you@example.com"
            />
            {errors.email && (
              <div className="text-xs text-red-600 mt-1">
                {errors.email.message}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm block mb-1">Password</label>
            <PasswordField {...register("password")} />
            {errors.password && (
              <div className="text-xs text-red-600 mt-1">
                {errors.password.message}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm block mb-1">Confirm password</label>
            <input
              {...register("confirm")}
              type="password"
              className="w-full border border-slate-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Confirm password"
            />
            {errors.confirm && (
              <div className="text-xs text-red-600 mt-1">
                {errors.confirm.message}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input {...register("terms")} id="terms" type="checkbox" />
            <label htmlFor="terms" className="text-sm">
              I agree to the{" "}
              <a
                className="text-blue-600 underline"
                href="/terms"
                target="_blank"
                rel="noreferrer"
              >
                terms & conditions
              </a>
            </label>
          </div>
          {errors.terms && (
            <div className="text-xs text-red-600 mt-1">
              {errors.terms.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-2 rounded ${
              loading ? "bg-blue-400" : "bg-blue-600"
            }`}
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        <AnimatePresence>
          {showPopup && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="fixed right-4 top-6 z-50 w-full max-w-sm"
            >
              <div className="p-3 rounded bg-white border border-slate-300 shadow">
                <div className="font-medium">Account created</div>
                <div className="text-sm text-slate-600">
                  Check your email for verification.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* small password-field component with toggle */
function PasswordField(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className="w-full border border-slate-300 px-3 py-2 rounded pr-20 focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="Create a password"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-600"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
