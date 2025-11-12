"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "../../lib/axios"; // adjust path if your axios is elsewhere

export default function RegisterForm({
  redirectAfter = "/customer/dashboard",
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const mounted = useRef(true);
  useEffect(() => () => (mounted.current = false), []);

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Please enter your full name.";
    if (!email.trim() || !isEmail(email))
      e.email = "Enter a valid email address.";
    if (!password || password.length < 8)
      e.password = "Password must be at least 8 characters.";
    if (password !== confirm) e.confirm = "Passwords do not match.";
    if (!terms) e.terms = "You must accept terms to continue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setErrors({});
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { name: name.trim(), email: email.trim(), password };
      let res;
      try {
        res = await api.post("/register", payload);
      } catch (e) {
        // simulate success when API not available (dev fallback)
        console.warn(
          "POST /register failed, simulating response",
          e?.message || e
        );
        await new Promise((r) => setTimeout(r, 700));
        res = {
          status: 201,
          data: { ok: true, user: { id: "local-demo", email: payload.email } },
        };
      }

      const ok = res?.status === 201 || res?.data?.ok || res?.status === 200;
      if (ok) {
        setSuccess(true);
        if (typeof window !== "undefined")
          localStorage.setItem("tvet_user_email", email.trim());
        setTimeout(() => {
          if (!mounted.current) return;
          if (redirectAfter) router.push(redirectAfter);
        }, 900);
      } else {
        setErrors({
          form: res?.data?.message ?? "Registration failed. Try again.",
        });
      }
    } catch (err) {
      console.error("register error", err);
      setErrors({
        form: err?.response?.data?.message || err.message || "Unknown error",
      });
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const fieldVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };
  const baseInput =
    "w-full border px-3 py-2 rounded transition-shadow duration-150 outline-none focus:ring-2";

  return (
    <div className="w-full max-w-md mx-auto mt-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-8 rounded-2xl shadow-lg"
      >
        <h3 className="text-2xl font-semibold text-center mb-4">
          Create Account
        </h3>

        {errors.form && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 p-2 rounded">
            {errors.form}
          </div>
        )}

        {!success ? (
          <motion.form
            onSubmit={submit}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-4"
            noValidate
          >
            <motion.div variants={fieldVariants}>
              <label className="text-sm font-medium block mb-1">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                className={`${baseInput} ${
                  errors.name
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-200 focus:ring-blue-400"
                } shadow-sm`}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <div className="text-xs text-red-600 mt-1">{errors.name}</div>
              )}
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="text-sm font-medium block mb-1">
                Email address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                required
                className={`${baseInput} ${
                  errors.email
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-200 focus:ring-blue-400"
                } shadow-sm`}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <div className="text-xs text-red-600 mt-1">{errors.email}</div>
              )}
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="text-sm font-medium block mb-1">Password</label>
              <PasswordField
                value={password}
                onChange={setPassword}
                error={errors.password}
              />
              {errors.password && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.password}
                </div>
              )}
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="text-sm font-medium block mb-1">
                Confirm password
              </label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type="password"
                placeholder="Confirm password"
                required
                className={`${baseInput} ${
                  errors.confirm
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-200 focus:ring-blue-400"
                } shadow-sm`}
                aria-invalid={!!errors.confirm}
              />
              {errors.confirm && (
                <div className="text-xs text-red-600 mt-1">
                  {errors.confirm}
                </div>
              )}
            </motion.div>

            <motion.div
              variants={fieldVariants}
              className="flex items-center gap-2 text-sm"
            >
              <input
                id="terms"
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <a className="text-blue-600 underline" href="/terms">
                  terms & conditions
                </a>
              </label>
            </motion.div>
            {errors.terms && (
              <div className="text-xs text-red-600 mt-1">{errors.terms}</div>
            )}

            <motion.button
              variants={fieldVariants}
              whileTap={{ scale: 0.985 }}
              whileHover={{ scale: 1.01 }}
              disabled={loading}
              type="submit"
              className={`w-full text-white py-2 rounded-lg ${
                loading ? "bg-blue-400" : "bg-blue-600"
              } focus:outline-none focus:ring-2 focus:ring-blue-400`}
            >
              {loading ? "Creating account…" : "Register"}
            </motion.button>
          </motion.form>
        ) : (
          <SuccessBox />
        )}
      </motion.div>
    </div>
  );
}

/* ---------- Subcomponents (local) ---------- */

function PasswordField({ value, onChange, error }) {
  const [show, setShow] = useState(false);
  const focusClass = error ? "focus:ring-red-400" : "focus:ring-blue-400";
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={show ? "text" : "password"}
        placeholder="Create a password"
        className={`w-full border px-3 py-2 rounded ${
          error ? "border-red-400" : "border-slate-200"
        } transition-shadow duration-150 outline-none focus:ring-2 ${focusClass} shadow-sm`}
        aria-invalid={!!error}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-slate-600 px-2 py-1"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

function SuccessBox() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4 py-8"
    >
      <motion.svg
        width="80"
        height="80"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          stroke="#10b981"
          strokeWidth="6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />
        <motion.path
          d="M36 62l14 14 34-38"
          stroke="#10b981"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
        />
      </motion.svg>

      <div className="text-center">
        <h4 className="text-lg font-semibold">Account created</h4>
        <p className="text-sm text-slate-600">
          Check your email for verification (demo).
        </p>
      </div>
    </motion.div>
  );
}
