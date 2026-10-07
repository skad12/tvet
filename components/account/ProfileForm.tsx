"use client";

import { useEffect, useState } from "react";
import { FiMail, FiPhone, FiSave, FiUser } from "react-icons/fi";
import { toast } from "sonner";

import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";

type Profile = { name: string; email: string; phone_number: string };

function Field({
  id,
  label,
  icon,
  hint,
  ...input
}: { id: string; label: string; icon: React.ReactNode; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
          {icon}
        </span>
        <input
          id={id}
          {...input}
          className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
        />
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/**
 * The signed-in user's own name, email and phone, saved to /me/. (The old
 * Settings profile form only pretended to save.)
 */
export default function ProfileForm() {
  const [saved, setSaved] = useState<Profile | null>(null);
  const [form, setForm] = useState<Profile>({ name: "", email: "", phone_number: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/me/")
      .then((res) => {
        const p = { name: res.data.name ?? "", email: res.data.email ?? "", phone_number: res.data.phone_number ?? "" };
        setSaved(p);
        setForm(p);
      })
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load your profile.")));
  }, []);

  const changed = !!saved && (form.name !== saved.name || form.email !== saved.email || form.phone_number !== saved.phone_number);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!saved) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.patch("/me/", form);
      const p = { name: res.data.name ?? "", email: res.data.email ?? "", phone_number: res.data.phone_number ?? "" };
      const emailChanged = p.email !== saved.email;
      setSaved(p);
      setForm(p);
      // Keep the name and email shown around the dashboard in step.
      try {
        const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, name: p.name, email: p.email, username: p.email }));
      } catch {}
      toast.success(emailChanged ? "Saved. Sign in with your new email from now on." : "Profile saved");
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Your profile</h3>
        <p className="text-sm text-slate-500">Your email is also what you sign in with.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="profile-name" label="Full name" icon={<FiUser />} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!saved} />
        <Field
          id="profile-phone"
          label="Phone"
          icon={<FiPhone />}
          type="tel"
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          disabled={!saved}
        />
        <div className="sm:col-span-2">
          <Field
            id="profile-email"
            label="Email"
            icon={<FiMail />}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={!saved}
            hint={saved && form.email !== saved.email ? "You will sign in with this new email after saving." : undefined}
          />
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!changed || saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          <FiSave /> {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
