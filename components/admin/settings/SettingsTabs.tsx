"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ProfileForm from "./ProfileForm";
import NotificationsPanel from "./NotificationsPanel";
import AiSettings from "./AiSettings";

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "ai", label: "AI Settings" },
];

export default function SettingsTabs() {
  const [active, setActive] = useState("profile");

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your platform preferences
        </p>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-3 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              active === t.id
                ? "bg-white text-slate-800 shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            aria-pressed={active === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* pane */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-slate-50 p-6 rounded-lg"
      >
        <div className="bg-white rounded-lg borde p-6">
          {active === "profile" && <ProfileForm />}
          {active === "notifications" && <NotificationsPanel />}
          {active === "ai" && <AiSettings />}
        </div>
      </motion.div>
    </section>
  );
}
