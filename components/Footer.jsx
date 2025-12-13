"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 mt-20 ">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between gap-6 items-start">
        <div>
          <h4 className="font-semibold text-white">TVET Support</h4>
          <p className="text-sm text-slate-300 mt-2">
            Centralized help desk for TVET applicants and learners.
          </p>
        </div>

        <nav className="flex gap-4">
          <Link href="/support" className="text-sm hover:underline">
            Support
          </Link>
          <Link href="/register" className="text-sm hover:underline">
            Register
          </Link>
          <a href="#contact" className="text-sm hover:underline">
            Contact
          </a>
        </nav>

        <div className="text-sm text-slate-400">
          © {new Date().getFullYear()} TVET Support — All rights reserved.
        </div>
      </div>
    </footer>
  );
}
