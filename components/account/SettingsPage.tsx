"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiBell, FiCpu, FiInfo, FiLock, FiSettings, FiUser } from "react-icons/fi";

import ProfileForm from "@/components/account/ProfileForm";
import { ChangePasswordForm } from "@/components/account/ChangePassword";
import NotificationsPanel from "@/components/admin/settings/NotificationsPanel";
import AiSettings from "@/components/admin/settings/AiSettings";

const tabs = [
  { id: "profile", label: "Profile", icon: FiUser, hint: "Your name, email and phone", preview: false },
  { id: "security", label: "Security", icon: FiLock, hint: "Your password", preview: false },
  { id: "notifications", label: "Notifications", icon: FiBell, hint: "Alerts and emails", preview: true },
  { id: "ai", label: "AI assistant", icon: FiCpu, hint: "How the chat AI behaves", preview: false },
] as const;

type TabId = (typeof tabs)[number]["id"];

/** Admin Settings: profile and password are real; the rest are marked as previews. */
export default function SettingsPage() {
  const [active, setActive] = useState<TabId>("profile");
  const tab = tabs.find((t) => t.id === active)!;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Account</p>
        <h1 className="mt-1 inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          <FiSettings className="h-7 w-7 text-blue-600" aria-hidden /> Settings
        </h1>
        <p className="mt-1 text-sm text-muted">Your profile and password, and how the help desk behaves.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
        {/* Sections: a column on wide screens, a scrolling row on phones */}
        <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {tabs.map((t) => {
            const on = active === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition lg:w-full ${
                  on ? "border-blue-200 bg-blue-50 text-blue-800" : "border-transparent text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${on ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-sm font-semibold">{t.label}</span>
                  <span className="hidden text-xs text-slate-500 lg:block">{t.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <motion.section
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          {tab.preview && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <FiInfo className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>These options are a preview and are not connected yet, so changes here are not saved.</span>
            </div>
          )}
          {active === "profile" && <ProfileForm />}
          {active === "security" && (
            <div className="max-w-md">
              <h3 className="text-lg font-semibold text-slate-900">Change password</h3>
              <p className="mb-5 text-sm text-slate-500">You stay signed in after changing it.</p>
              <ChangePasswordForm />
            </div>
          )}
          {active === "notifications" && <NotificationsPanel />}
          {active === "ai" && <AiSettings />}
        </motion.section>
      </div>
    </div>
  );
}
