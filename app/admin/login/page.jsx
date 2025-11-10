"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // fake network delay
    await new Promise((res) => setTimeout(res, 600));

    if (email === "admin@tvet.local" && password === "secret") {
      router.push("/admin/dashboard");
    } else {
      setError("Invalid credentials — try admin@tvet.local / secret");
    }

    setLoading(false);
  };

  return (
    <>
      <NavBar />

      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md bg-white rounded shadow p-8"
        >
          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-semibold mb-4 text-slate-800"
          >
            Admin Login
          </motion.h3>

          <form onSubmit={submit} className="space-y-3">
            <label className="block text-sm text-slate-600">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tvet.local"
              type="email"
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />

            <label className="block text-sm text-slate-600">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Log in"}
            </motion.button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-xs text-slate-500"
          >
            Demo credentials: <strong>admin@tvet.local</strong> /{" "}
            <strong>secret</strong>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </>
  );
}
