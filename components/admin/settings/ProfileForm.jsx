"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function ProfileForm() {
  const [form, setForm] = useState({
    firstName: "Admin",
    lastName: "User",
    email: "admin@tvet.edu.ng",
    phone: "+234 800 000 0000",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  function update(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      // replace with real API call if you have one
      await new Promise((r) => setTimeout(r, 700));
      setMsg({ type: "success", text: "Profile saved." });
    } catch (err) {
      setMsg({ type: "error", text: "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border rounded px-3 py-2 outline-none transition-shadow duration-150 focus:ring-2 focus:shadow-md";

  return (
    <form onSubmit={handleSave} className="space-y-6 border-slate-200">
      <div>
        <h3 className="text-xl font-semibold text-slate-800">
          Profile Information
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Update your personal and account information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-600 block mb-1">
            First Name
          </label>
          <input
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            className={`${inputClass} border-slate-200`}
            placeholder="First name"
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 block mb-1">Last Name</label>
          <input
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            className={`${inputClass} border-slate-200`}
            placeholder="Last name"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-600 block mb-1">Email</label>
        <input
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          type="email"
          className={`${inputClass} border-slate-200`}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="text-xs text-slate-600 block mb-1">Phone</label>
        <input
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className={`${inputClass} border-slate-200`}
          placeholder="+234 800 000 0000"
        />
      </div>

      <div>
        <label className="text-xs text-slate-600 block mb-1">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => update("bio", e.target.value)}
          rows={5}
          className={`${inputClass} border-slate-200 resize-none`}
          placeholder="Tell us about yourself"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          {msg && (
            <div
              className={`text-sm px-3 py-2 rounded ${
                msg.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-95 disabled:opacity-60`}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
