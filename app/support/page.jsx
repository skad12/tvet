"use client";

import { motion } from "framer-motion";
import TicketForm from "../../components/support/TicketForm";
import FAQ from "../../components/support/Faq";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

export default function SupportPage() {
  return (
    <>
      <motion.main
        className="max-w-6xl mx-auto px-4 mt-20"
        initial={{ opacity: 0, y: 20 }} // starting state
        animate={{ opacity: 1, y: 0 }} // animate in
        exit={{ opacity: 0, y: -20 }} // animate out
        transition={{ duration: 0.4, ease: "easeOut" }} // animation speed
      >
        <TicketForm />
        <FAQ />
      </motion.main>
    </>
  );
}
