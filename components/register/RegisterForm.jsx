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
