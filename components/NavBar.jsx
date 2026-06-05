"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import logo from "@/public/images/tvet-logo.png";
import TrackTicketModal from "@/components/TrackTicketModal";

const MotionLink = motion(Link);

export default function NavBar({ variant = "solid" }) {
  const [showTrackTicketModal, setShowTrackTicketModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isTransparent = variant === "transparent";
  const isFloating = isTransparent && !scrolled;

  useEffect(() => {
    if (!isTransparent) return;

    const updateScrolled = () => {
      setScrolled(window.scrollY > 24);
    };

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, [isTransparent]);

  return (
    <>
      <nav
        className={`z-50 w-full transition-all duration-300 ${
          isTransparent
            ? scrolled
              ? "fixed top-0 border-b border-slate-200 bg-white/95 text-slate-950 shadow-sm backdrop-blur"
              : "absolute top-0 bg-transparent text-white"
            : "sticky top-0 border-b border-slate-200 bg-white/90 text-slate-950 shadow-sm backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={logo}
              alt="TVET Support"
              width={40}
              height={40}
              className="h-7 w-7 md:h-10 md:w-10 lg:h-12 lg:w-12"
            />
            <span className="text-sm font-semibold md:text-lg">
              TVET Support
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* <MotionLink
              href="#"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded bg-blue-600 text-white text-xs md:text-sm lg:text-base"
            >
              Support
            </MotionLink> */}

            <motion.button
              onClick={() => setShowTrackTicketModal(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 md:text-sm lg:text-base"
            >
              Track Ticket
            </motion.button>

            <MotionLink
              href="/auth/login"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition md:text-sm lg:text-base ${
                isFloating
                  ? "border-white/35 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                  : "border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50"
              }`}
            >
              Login
            </MotionLink>
          </div>
        </div>
      </nav>

      <TrackTicketModal
        show={showTrackTicketModal}
        onClose={() => setShowTrackTicketModal(false)}
      />
    </>
  );
}
