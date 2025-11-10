"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NavBar() {
  return (
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
              TS
            </div>
            <span className="font-semibold text-lg">TVET Support</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/support">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              Support
            </motion.button>
          </Link>
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded  bg-blue-600 text-white"
            >
              Register
            </motion.button>
          </Link>
          <Link href="/admin/login">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded bg-white border"
            >
              Login
            </motion.button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
