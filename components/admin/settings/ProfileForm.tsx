"use client";

import { useState } from "react";
import { landing } from "@/components/ui/landingStyles";

export default function ProfileForm() {
  const [form, setForm] = useState({
    firstName: "Admin",
    lastName: "User",
    email: "admin@tvet.edu.ng",
    phone: "+234 800 000 0000",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  function update(k: string, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setMsg({ type: "success", text: "Profile saved." });
    } catch {
      setMsg({ type: "error", text: "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground">
          Profile Information
        </h3>
        <p className={landing.subtitle}>
          Update your personal and account information
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={landing.label}>First Name</label>
          <input
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            className={landing.input}
            placeholder="First name"
            required
          />
        </div>

        <div>
          <label className={landing.label}>Last Name</label>
          <input
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            className={landing.input}
            placeholder="Last name"
            required
          />
        </div>
      </div>

      <div>
        <label className={landing.label}>Email</label>
        <input
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          type="email"
          className={landing.input}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className={landing.label}>Phone</label>
        <input
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className={landing.input}
          placeholder="+234 800 000 0000"
        />
      </div>

      <div>
        <label className={landing.label}>Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => update("bio", e.target.value)}
          rows={5}
          className={landing.textarea}
          placeholder="Tell us about yourself"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {msg ? (
          <div
            className={`rounded-2xl px-4 py-2 text-sm ${
              msg.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </div>
        ) : (
          <div />
        )}

        <button type="submit" disabled={saving} className={landing.btnPrimary}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
