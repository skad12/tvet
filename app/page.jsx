"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import supportImage from "../public/images/support.jpg";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import FloatingWidget from "@/components/FloatingWidget";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
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
          className="relative bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
        >
          <div className="max-w-6xl mx-auto px-4 py-24 flex flex-col md:flex-row items-center gap-8">
            <motion.div variants={fadeInUp} className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                TVET Support — Help Desk
              </h1>
              <p className="mt-4 text-blue-100 max-w-xl">
                Fast, reliable support for registrations, finance queries and
                general student onboarding — open a ticket and track progress
                from start to finish.
              </p>

              <motion.div
                variants={fadeInUp}
                transition={{ delay: 0.1 }}
                className="mt-6 flex flex-wrap gap-3"
              >
                <Link
                  href="/support"
                  className="inline-block px-6 py-3 bg-white text-blue-700 rounded shadow font-medium hover:scale-105 transition-transform"
                >
                  Create Ticket
                </Link>
                <Link
                  href="/register"
                  className="inline-block px-6 py-3 border border-white/30 text-white rounded font-medium hover:bg-white/10 transition"
                >
                  Register
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
              className="md:w-1/2 flex justify-center"
            >
              <div className="w-full max-w-md rounded overflow-hidden shadow-lg bg-white">
                <Image
                  src={supportImage}
                  alt="support hero"
                  width={800}
                  height={600}
                  className="block object-cover"
                  priority
                />
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
                    href="/support"
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
              className="bg-white rounded shadow p-6"
            >
              <h2 className="text-2xl font-semibold mb-4">
                Frequently Asked Questions
              </h2>

              <div className="space-y-3">
                {[
                  {
                    q: "Who can apply?",
                    a: "Any eligible applicant meeting the program requirements — check the specific course page for qualification details.",
                  },
                  {
                    q: "How long does registration take?",
                    a: "Registration is typically processed within 24–48 hours, depending on document verification.",
                  },
                  {
                    q: "What documents are required?",
                    a: "Valid ID, proof of residence, and any relevant certificates if applicable.",
                  },
                ].map(({ q, a }) => (
                  <motion.details
                    key={q}
                    variants={fadeInUp}
                    transition={{ duration: 0.3 }}
                    className="p-3 border rounded"
                  >
                    <summary className="font-medium cursor-pointer">
                      {q}
                    </summary>
                    <p className="mt-2 text-gray-600 text-sm">{a}</p>
                  </motion.details>
                ))}
              </div>
            </motion.section>

            {/* CTA */}
            <motion.section
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
              className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded shadow"
            >
              <div>
                <h3 className="text-lg font-semibold">Need help now?</h3>
                <p className="text-gray-600 mt-1">
                  Open a ticket and one of our support agents will contact you.
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <Link
                  href="/support"
                  className="px-5 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Create Ticket
                </Link>
              </div>
            </motion.section>

            {/* Contact */}
            <motion.section
              id="contact"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
              className="grid md:grid-cols-2 gap-8 items-start"
            >
              <div className="bg-white p-6 rounded shadow">
                <h2 className="text-2xl font-semibold">Contact Us</h2>
                <p className="mt-2 text-gray-600">
                  Prefer email or phone? Use the details below.
                </p>
                <div className="mt-4 space-y-2 text-gray-700">
                  <div>
                    <strong>Email:</strong>{" "}
                    <a
                      className="text-blue-600"
                      href="mailto:support@tvet.local"
                    >
                      support@tvet.local
                    </a>
                  </div>
                  <div>
                    <strong>Phone:</strong>{" "}
                    <a className="text-blue-600" href="tel:+2348000000000">
                      +234 800 000 0000
                    </a>
                  </div>
                  <div>
                    <strong>Support hours:</strong> Mon–Fri, 8:00 — 17:00
                  </div>
                </div>
              </div>

              <motion.div
                variants={fadeInUp}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded shadow"
              >
                <h3 className="font-medium">Send a quick message</h3>
                <p className="text-sm text-gray-600 mt-2">
                  This is a UI-only form. Hook it to an API or mailer to make it
                  functional.
                </p>
                <form className="mt-4 grid gap-3">
                  <input
                    name="name"
                    placeholder="Your name"
                    className="border px-3 py-2 rounded"
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    className="border px-3 py-2 rounded"
                  />
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Message"
                    className="border px-3 py-2 rounded"
                  />
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Send Message
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.section>
          </div>
        </motion.main>
      </motion.div>

      {/* Floating support widget */}
      <FloatingWidget />
      <Footer />
    </>
  );
}
