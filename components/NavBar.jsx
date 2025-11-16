"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import logo from "@/public/images/tvet-logo.png";

const MotionLink = motion(Link);

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src={logo} alt="TVET Support" width={40} height={40} />
          <span className="font-semibold text-lg">TVET Support</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-3">
          <MotionLink
            href="/support"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Support
          </MotionLink>

          <MotionLink
            href="/register"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Register
          </MotionLink>

          <MotionLink
            href="/auth/login"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded bg-white border border-slate-300"
          >
            Login
          </MotionLink>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md border border-slate-300"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
        >
          {/* Hamburger icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-slate-200 bg-white"
          >
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
              <Link
                href="/support"
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={() => setOpen(false)}
              >
                Support
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={() => setOpen(false)}
              >
                Register
              </Link>
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded bg-white border border-slate-300"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
