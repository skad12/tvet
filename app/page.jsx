"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Headphones,
  MailCheck,
  MessageSquareText,
  Route,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
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

const supportStats = [
  { value: "24/7", label: "ticket intake" },
  { value: "4", label: "support categories" },
  { value: "1", label: "central help desk" },
];

const supportHighlights = [
  {
    title: "One place for every request",
    body: "Submit registration, finance, login, and general enquiries without chasing different departments.",
    icon: Headphones,
  },
  {
    title: "Structured ticket history",
    body: "Messages, attachments, status changes, and resolution notes stay connected from the first update.",
    icon: FileText,
  },
  {
    title: "Clear ownership",
    body: "Requests can be routed to agents and escalated when specialist support is needed.",
    icon: Route,
  },
];

const serviceCards = [
  {
    title: "Registration support",
    body: "Resolve account setup, application, document, and onboarding questions with guided help.",
    icon: UsersRound,
  },
  {
    title: "Finance support",
    body: "Ask about payment records, confirmation delays, proof uploads, and finance-related updates.",
    icon: ShieldCheck,
  },
  {
    title: "Technical support",
    body: "Report login, access, dashboard, and platform issues so the team can investigate quickly.",
    icon: MessageSquareText,
  },
];

const processSteps = [
  "Choose the closest support category.",
  "Describe the issue with the important details.",
  "Submit your ticket and track replies from one thread.",
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
          <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
            <motion.section
              variants={fadeInUp}
              transition={{ duration: 0.45 }}
              className="-mt-24 grid gap-4 md:grid-cols-3"
            >
              {supportStats.map((stat) => (
                <div
                  key={stat.label}
                  className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white/95 p-6 shadow-xl shadow-blue-950/10 backdrop-blur"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100" />
                  <p className="relative text-4xl font-extrabold text-blue-700">
                    {stat.value}
                  </p>
                  <p className="relative mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.section>

            {/* About section */}
            <motion.section
              id="about"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="grid items-center gap-10 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[0.95fr_1.05fr] md:p-8"
            >
              <div className="space-y-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                  About the help desk
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  A smarter support front door for every TVET learner.
                </h2>
                <p className="text-base leading-relaxed text-slate-600">
                  TVET Support is dedicated to helping prospective and current
                  trainees with every step of their TVET journey — from
                  registration and documentation to finance queries and course
                  guidance.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Centralised ticket tracking", "Fast response paths", "Clear student guidance"].map(
                    (item) => (
                      <div
                        key={item}
                        className="rounded-2xl bg-slate-50 p-3 text-sm font-medium text-slate-700"
                      >
                        <CheckCircle2 className="mb-2 h-5 w-5 text-blue-600" />
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {supportHighlights.map((item) => (
                  <motion.div
                    key={item.title}
                    variants={fadeInUp}
                    transition={{ delay: 0.1 }}
                    className="group rounded-3xl border border-slate-200 bg-linear-to-br from-white to-blue-50/70 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-950">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <motion.section
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="grid gap-5 md:grid-cols-3"
            >
              {serviceCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <card.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {card.body}
                  </p>
                </div>
              ))}
            </motion.section>

            <motion.section
              id="support"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
              className="grid gap-8 rounded-4xl bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20 md:grid-cols-[0.9fr_1.1fr] md:p-8"
            >
              <div className="flex flex-col justify-between gap-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                    Create a ticket
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                    Tell us what happened. We will route it from there.
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">
                    The form captures the category, message, and email needed to
                    open a support thread. Use the FAQ below only when you want
                    quick self-service answers.
                  </p>
                </div>

                <div className="space-y-4">
                  {processSteps.map((step, index) => (
                    <div key={step} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
                        {index + 1}
                      </span>
                      <p className="pt-1 text-sm text-slate-200">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <Clock3 className="h-6 w-6 text-cyan-200" />
                  <p className="mt-3 text-sm font-medium">
                    Keep your ticket email handy so you can track status updates
                    and continue the conversation later.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-2 text-slate-950 shadow-xl">
                <TicketForm />
              </div>
            </motion.section>

            {/* FAQ */}
            <motion.section
              id="faq"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              <div className="space-y-3">
                <FAQ />
              </div>
            </motion.section>

            <motion.section
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
              className="overflow-hidden rounded-4xl bg-linear-to-r from-blue-700 via-blue-600 to-cyan-500 p-8 text-white shadow-xl shadow-blue-950/20"
            >
              <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
                    Need direct follow-up?
                  </p>
                  <h2 className="mt-2 text-2xl font-bold md:text-3xl">
                    Open a ticket now and keep every response documented.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-50">
                    The support team can review your request, contact you by
                    email, and keep the full history available for reference.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="#support"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    Create Ticket
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <span className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/30 px-5 text-sm font-semibold text-white">
                    <MailCheck className="h-4 w-4" />
                    Email updates enabled
                  </span>
                </div>
              </div>
            </motion.section>
          </div>
        </motion.main>
      </motion.div>

      <Footer />
    </>
  );
}
