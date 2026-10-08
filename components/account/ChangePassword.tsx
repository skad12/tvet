"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiEye, FiEyeOff, FiKey, FiX } from "react-icons/fi";
import { toast } from "sonner";

import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";

const MIN_LENGTH = 8;

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
        >
          {show ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/** Current, new and confirm; saves to /me/password/. */
export function ChangePasswordForm({ onDone }: { onDone?: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = next.length > 0 && next.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== next;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!current || !next) return setError("Fill in both passwords.");
    if (next.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (next !== confirm) return setError("The new passwords don't match.");
    setSaving(true);
    try {
      await api.post("/me/password/", { current_password: current, new_password: next });
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
      onDone?.();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't change the password."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PasswordInput id="pw-current" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
      <PasswordInput id="pw-new" label="New password" value={next} onChange={setNext} autoComplete="new-password" />
      <p className={`-mt-2 text-xs ${tooShort ? "text-amber-700" : "text-slate-500"}`}>At least {MIN_LENGTH} characters.</p>
      <PasswordInput id="pw-confirm" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {mismatch && <p className="-mt-2 text-xs text-amber-700">Doesn&apos;t match the new password yet.</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <FiKey /> {saving ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

/** A button that opens the change-password form in a popup. */
export default function ChangePasswordButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-slate-50 ${className}`}
      >
        <FiKey className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Change password</span>
        <span className="sm:hidden">Password</span>
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Change password">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
                <motion.div
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <FiKey className="text-blue-600" /> Change password
                      </h2>
                      <p className="text-sm text-slate-500">You stay signed in after changing it.</p>
                    </div>
                    <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                  <ChangePasswordForm onDone={() => setOpen(false)} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
