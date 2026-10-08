"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiCheck, FiTag, FiUserPlus, FiX } from "react-icons/fi";
import { toast } from "sonner";

import api from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";

const AddAgentSchema = z
  .object({
    name: z.string().trim().min(1, "Full name is required"),
    email: z.string().trim().email("Enter a valid email address"),
    phone: z
      .string()
      .optional()
      .refine((value) => !value || /^[0-9+\-\s()]{6,25}$/.test(value), { message: "Enter a valid phone number" }),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm the password"),
    accountType: z.enum(["agent", "super_agent"]),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

type Values = z.infer<typeof AddAgentSchema>;
type Category = { id: string; title?: string; name?: string };

const field =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

/**
 * Create an agent or super agent, and place them in their categories in the
 * same step, so they receive tickets from the moment they first sign in.
 */
export default function AddAgentModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(AddAgentSchema),
    defaultValues: { accountType: "agent", phone: "", name: "", email: "", password: "", confirmPassword: "" },
  });
  const accountType = watch("accountType");

  useEffect(() => {
    if (!isOpen) return;
    api
      .get("/get-all-category/")
      .then((res) => setCategories(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setCategories([]));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function close() {
    setError(null);
    setPicked(new Set());
    reset();
    onClose();
  }

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const onSubmit = async (values: Values) => {
    setLoading(true);
    setError(null);
    const email = values.email.trim().toLowerCase();
    let userId: string | null = null;
    try {
      const res = await api.post("/sign-up/", {
        name: values.name.trim(),
        // The email is the username, so staff sign in with their address.
        username: email,
        email,
        password: values.password,
        account_type: values.accountType,
        phone_number: values.phone?.trim() || "",
      });
      userId = res?.data?.id ? String(res.data.id) : null;
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't create the account."));
      setLoading(false);
      return;
    }

    // The account exists now; place them in their categories.
    const failed: string[] = [];
    if (userId) {
      for (const id of picked) {
        try {
          await api.post("/assign-category/to-user/", { category_id: id, assigned_to_id: userId });
        } catch {
          failed.push(categories.find((c) => c.id === id)?.title ?? "a category");
        }
      }
    }
    setLoading(false);
    const role = values.accountType === "super_agent" ? "Super agent" : "Agent";
    if (failed.length) {
      toast.warning(`${role} created, but couldn't add them to ${failed.join(", ")}. Use Categories on their row to retry.`);
    } else {
      toast.success(picked.size ? `${role} created and added to ${picked.size} categor${picked.size === 1 ? "y" : "ies"}` : `${role} created`);
    }
    onSuccess?.();
    close();
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Add agent">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/50" onClick={() => !loading && close()} />
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <FiUserPlus className="text-blue-600" /> Add {accountType === "super_agent" ? "super agent" : "agent"}
                </h2>
                <p className="text-sm text-slate-500">They sign in with this email and password.</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <FiX className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div role="radiogroup" aria-label="Role" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                {(
                  [
                    ["agent", "Agent", "Answers tickets"],
                    ["super_agent", "Super agent", "Handles escalations"],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-lg px-3 py-2 text-center text-sm transition ${
                      accountType === value ? "bg-white font-semibold text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <input type="radio" value={value} {...register("accountType")} className="sr-only" />
                    <span className="block">{label}</span>
                    <span className="block text-[11px] font-normal text-slate-500">{hint}</span>
                  </label>
                ))}
              </div>

              <Field label="Full name" error={errors.name?.message}>
                <input {...register("name")} className={field} placeholder="Ada Obi" autoComplete="off" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" error={errors.email?.message}>
                  <input {...register("email")} type="email" className={field} placeholder="ada@example.com" autoComplete="off" />
                </Field>
                <Field label="Phone (optional)" error={errors.phone?.message}>
                  <input {...register("phone")} type="tel" className={field} placeholder="+234 800 000 0000" />
                </Field>
              </div>

              <fieldset>
                <legend className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <FiTag className="h-3.5 w-3.5" /> Categories
                </legend>
                <p className="mb-2 text-xs text-slate-500">
                  {accountType === "super_agent"
                    ? "They receive escalated tickets from these categories."
                    : "They receive tickets from these categories. Pick at least one, or they get nothing."}
                </p>
                {categories.length === 0 ? (
                  <p className="text-sm text-slate-500">Loading categories…</p>
                ) : (
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {categories.map((c) => {
                      const on = picked.has(c.id);
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => toggle(c.id)}
                            aria-pressed={on}
                            className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition ${
                              on ? "border-blue-300 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}
                              aria-hidden
                            >
                              {on && <FiCheck className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0 break-words">{c.title ?? c.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {picked.size === 0 && categories.length > 0 && (
                  <p className="mt-1.5 text-xs text-amber-700">No category picked: you can add them later from their row.</p>
                )}
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password" error={errors.password?.message}>
                  <input {...register("password")} type="password" className={field} autoComplete="new-password" />
                </Field>
                <Field label="Confirm password" error={errors.confirmPassword?.message}>
                  <input {...register("confirmPassword")} type="password" className={field} autoComplete="new-password" />
                </Field>
              </div>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            </div>

            <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button type="button" onClick={close} disabled={loading} className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <FiUserPlus /> {loading ? "Creating…" : `Create ${accountType === "super_agent" ? "super agent" : "agent"}`}
              </button>
            </footer>
          </motion.form>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
