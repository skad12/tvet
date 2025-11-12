"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/images/tvet-logo.png";

export default function AdminLoginForm({ demoCredentials = true }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // small artificial delay to show loading state
    await new Promise((r) => setTimeout(r, 600));

    if (email === "admin@tvet.local" && password === "secret") {
      router.push("/admin/dashboard/analytics");
    } else {
      setError("Invalid credentials — try admin@tvet.local / secret");
    }

    setLoading(false);
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
        <div className=" grid justify-center">
          <Image
            src={logo}
            alt="Customer dashboard hero"
            width={40}
            height={40}
            className="rounded object-cover"
            priority
          />
          <h3 className="text-2xl font-semibold mb-4  text-slate-800 ">
            Login
          </h3>
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
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-sm text-slate-600 "
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Log in"}
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

        {/* {demoCredentials && (
          <div className="mt-4 text-xs text-slate-500">
            Demo credentials: <strong>admin@tvet.local</strong> /{" "}
            <strong>secret</strong>
          </div>
        )} */}
      </div>
    </motion.form>
  );
}
