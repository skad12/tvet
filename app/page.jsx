"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import FloatingWidget from "@/components/FloatingWidget";
import FAQ from "@/components/support/Faq";
import TicketForm from "@/components/support/TicketForm";
import HeroVideoMontage from "@/components/marketing/HeroVideoMontage";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const heroSlides = [
  {
    eyebrow: "Responsive support, from ticket to resolution",
    title: "Student support that feels fast, clear, and human.",
    body: "Open a ticket for registration, finance, onboarding, or general TVET questions and keep every update in one easy place.",
    primaryHref: "#support",
    primaryLabel: "Create Ticket",
    secondaryHref: "#faq",
    secondaryLabel: "Browse FAQs",
  },
  {
    eyebrow: "Registration and onboarding help",
    title:
      "Get unstuck quickly when forms, accounts, or documents slow you down.",
    body: "Share the details once, attach what matters, and let the support team route your request to the right desk.",
    primaryHref: "#support",
    primaryLabel: "Start a request",
    secondaryHref: "#about",
    secondaryLabel: "How it works",
  },
  {
    eyebrow: "Finance and payment queries",
    title: "Track finance questions without losing context.",
    body: "Tickets keep conversations, proof of payment, and escalation notes together so every reply moves the issue forward.",
    primaryHref: "#support",
    primaryLabel: "Open finance ticket",
    secondaryHref: "#faq",
    secondaryLabel: "Common questions",
  },
  {
    eyebrow: "Clear updates for every student",
    title: "Know what is happening, who is helping, and what comes next.",
    body: "Follow ticket status from submission to resolution with a support workflow designed for transparency.",
    primaryHref: "#support",
    primaryLabel: "Get support",
    secondaryHref: "#about",
    secondaryLabel: "Learn more",
  },
];

export default function Home() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <NavBar />
      <motion.div
        className="min-h-screen flex flex-col"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.2 }}
      >
        {/* Banner */}
        <motion.header
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
          className="relative min-h-[720px] overflow-hidden bg-slate-950 text-white"
        >
          <HeroVideoMontage />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgb(37_99_235/0.42),transparent_34%),linear-gradient(90deg,rgb(15_23_42/0.92),rgb(15_23_42/0.68)_48%,rgb(15_23_42/0.30)),linear-gradient(to_top,rgb(15_23_42/0.9),transparent_52%)]" />

          <div className="relative z-10 mx-auto flex min-h-[720px] max-w-6xl items-center px-4 py-24">
            <motion.div
              variants={fadeInLeft}
              transition={{ duration: 0.6 }}
              className="w-full max-w-3xl"
            >
              <div className="hero-content-slider relative min-h-[430px]">
                {heroSlides.map((slide, index) => (
                  <div
                    key={slide.title}
                    className="hero-content-slide absolute inset-0 flex flex-col justify-center space-y-6"
                    style={{ animationDelay: `${index * 8}s` }}
                  >
                    <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-medium text-cyan-100 shadow-sm backdrop-blur">
                      {slide.eyebrow}
                    </p>
                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                      {slide.title}
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-blue-50 md:text-lg">
                      {slide.body}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <motion.div
                        whileHover={!shouldReduceMotion ? { scale: 1.04 } : {}}
                        whileTap={!shouldReduceMotion ? { scale: 0.97 } : {}}
                      >
                        <Link
                          href={slide.primaryHref}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm shadow-blue-950/25 transition hover:bg-blue-700"
                        >
                          {slide.primaryLabel}
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                      </motion.div>
                      <Link
                        href={slide.secondaryHref}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                      >
                        {slide.secondaryLabel}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                {heroSlides.map((slide, index) => (
                  <span
                    key={slide.title}
                    className="hero-content-tick h-1.5 w-12 rounded-full bg-white/25"
                    style={{ animationDelay: `${index * 8}s` }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          <div className="h-8 md:h-12 w-full bg-white rounded-t-full -mt-6"></div>
        </motion.header>

        {/* Main content */}
        <motion.main
          variants={fadeInUp}
          transition={{ duration: 0.4 }}
          className="flex-1"
        >
          <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">
            {/* About section */}
            <motion.section
              id="about"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="grid md:grid-cols-2 gap-8 items-center"
            >
              <div>
                <h2 className="text-2xl font-semibold">About TVET Support</h2>
                <p className="mt-3 text-gray-700">
                  TVET Support is dedicated to helping prospective and current
                  trainees with every step of their TVET journey — from
                  registration and documentation to finance queries and course
                  guidance.
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li>• Centralised ticket tracking</li>
                  <li>• Fast response & escalation paths</li>
                  <li>• Clear guidance for registration & finance</li>
                </ul>
              </div>

              <motion.div
                variants={fadeInUp}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded shadow"
              >
                <h3 className="font-medium">Why open a ticket?</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Tickets keep conversations in one place, preserve attachments,
                  and let you track status updates until your issue is resolved.
                </p>
                <div className="mt-4">
                  <Link
                    href="#support"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Create Ticket
                  </Link>
                </div>
              </motion.div>
            </motion.section>

            {/* FAQ */}
            <motion.section
              id="faq"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
              className="bg-white rounded shadow p-6 space-y-10"
            >
              <div>
                <TicketForm />
              </div>
              <div className="space-y-3">
                <FAQ />
              </div>
            </motion.section>

            {/* CTA */}
            {/*  */}

            {/* Contact */}
          </div>
        </motion.main>
      </motion.div>

      <Footer />
    </>
  );
}
