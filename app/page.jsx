"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import supportImage from "../public/images/support.jpg";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import FloatingWidget from "@/components/FloatingWidget";
import FAQ from "@/components/support/Faq";
import TicketForm from "@/components/support/TicketForm";

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
              <div className="mt-4">
                <Link
                  href="/support"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition border border-slate-300"
                >
                  Create Ticket
                </Link>
              </div>
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
