"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ProfileForm from "./ProfileForm";
import NotificationsPanel from "./NotificationsPanel";
import AiSettings from "./AiSettings";
import { landing, tabClass } from "@/components/ui/landingStyles";

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "ai", label: "AI Settings" },
];

export default function SettingsTabs() {
  const [active, setActive] = useState("profile");

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-8">
        <p className={landing.eyebrow}>Admin workspace</p>
        <h1 className={landing.title}>Settings</h1>
        <p className={landing.subtitle}>Manage your platform preferences</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={tabClass(active === t.id)}
            aria-pressed={active === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`${landing.panel} p-5 sm:p-8`}
      >
        {active === "profile" && <ProfileForm />}
        {active === "notifications" && <NotificationsPanel />}
        {active === "ai" && <AiSettings />}
      </motion.div>
    </section>
  );
}
