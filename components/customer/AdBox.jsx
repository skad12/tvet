"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import logo from "@/public/images/tvet-logo.png";

export default function AdBox() {
  const heroVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={heroVariants}
      transition={{ duration: 0.4 }}
      className="bg-white rounded shadow p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <Image
            src={logo}
            alt="Customer dashboard hero"
            width={200}
            height={200}
            className="rounded object-cover"
            priority
          />
        </div>

        <div>
          <h4 className="text-xl font-semibold">
            Experience efficient support management with TVET Support
          </h4>
          <p className="mt-3 text-sm text-slate-600">
            Centralized ticketing software designed to streamline your support
            requests — track progress, chat with agents, and get notified when
            your issue is resolved.
          </p>

          <div className="mt-4 text-sm text-slate-500">
            <div>
              <strong>Email:</strong> support@tvet.local
            </div>
            <div className="mt-1">
              <strong>Phone:</strong> +234 800 000 0000
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
