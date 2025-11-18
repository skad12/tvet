"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import logo from "@/public/images/tvet-logo.png";

const MotionLink = motion(Link);

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src={logo} alt="TVET Support" width={40} height={40} />
          <span className="font-semibold text-lg">TVET Support</span>
        </Link>

        <div className="flex items-center gap-3">
          <MotionLink
            href="#"
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
      </div>
    </nav>
  );
}
