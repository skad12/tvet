"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import api from "../../lib/axios";
import { motion, AnimatePresence } from "framer-motion";

export default function TicketForm() {
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState(null);

  const [categoryId, setCategoryId] = useState(""); // chosen category id (auto)
  const [description, setDescription] = useState(""); // this will be sent as `message` in payload
  const [email, setEmail] = useState("");
  const [priority, setPriority] = useState("Low"); // NEW: Low | Medium | High | Urgent

  const [loading, setLoading] = useState(false);
  // Renamed UI alert state to avoid clashing with API `message` field
  const [alert, setAlert] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const router = useRouter();
  const popupTimer = useRef(null);

  // Fallback default category object
  const FALLBACK_GENERAL = { id: "general", title: "General" };

  // fetch categories on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setCatLoading(true);
      setCatError(null);
      try {
        const res = await api.get("/get-all-category/");
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.categories ?? [];

        if (mounted) {
          setCategories(data);
          // pick default: prefer a category whose title or id contains "general"
          const found =
            data.find((c) =>
              String(c.title || c.name || c.label || c.id || "")
                .toLowerCase()
                .includes("general")
            ) ??
            data.find((c) => String(c.id || "").toLowerCase() === "general") ??
            data[0] ??
            null;

          if (found)
            setCategoryId(
              found.id ?? found._id ?? String(found.title ?? found.name ?? "")
            );
          else setCategoryId(FALLBACK_GENERAL.id);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
        setCatError("Failed to load categories. Using default General.");
        if (mounted) {
          setCategories([FALLBACK_GENERAL]);
          setCategoryId(FALLBACK_GENERAL.id);
        }
      } finally {
        if (mounted) setCatLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      // cleanup timers on unmount
      if (popupTimer.current) clearTimeout(popupTimer.current);
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    // find selected category from list, otherwise use fallback
    const selected =
      categories.find(
        (c) =>
          String(
            c.id ?? c._id ?? c.title ?? c.name ?? c.label ?? ""
          ).toString() === String(categoryId ?? "")
      ) ?? FALLBACK_GENERAL;

    if (!email.trim()) {
      setAlert({ type: "error", text: "Please enter an email address." });
      setLoading(false);
      return;
    }

    if (!description.trim()) {
      setAlert({ type: "error", text: "Please enter a message." });
      setLoading(false);
      return;
    }

    try {
      // NOTE: API expects `message` field in the body. We send the description state as `message`.
      const payload = {
        email: email.trim(),
        category_id: selected.id ?? selected._id ?? FALLBACK_GENERAL.id,
        priority: priority || "Low",
        message: description.trim(),
      };

      const res = await api.post("/tickets/create/", payload);

      const ok = res?.status === 201 || res?.data?.ok || res?.status === 200;
      if (ok) {
        const successText =
          "Ticket created successfully. A Confirmation mail has been sent to your Address";

        // show popup instead of inline success message
        setAlert({ type: "success", text: successText });
        setShowPopup(true);

        // clear form fields
        setDescription("");
        setEmail("");

        if (typeof window !== "undefined")
          localStorage.setItem("tvet_user_email", email.trim());

        // Auto-close popup after 5 seconds
        if (popupTimer.current) clearTimeout(popupTimer.current);
        popupTimer.current = setTimeout(() => {
          setShowPopup(false);
        }, 5000);

        //
      } else {
        setAlert({
          type: "error",
          text: res?.data?.message ?? "Failed to create ticket.",
        });
      }
    } catch (err) {
      console.error("submit error", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit ticket.";
      setAlert({ type: "error", text: serverMsg });
    } finally {
      setLoading(false);
    }
  };

  // determine display title for chosen category
  const chosenCategory =
    categories.find(
      (c) =>
        String(
          c.id ?? c._id ?? c.title ?? c.name ?? c.label ?? ""
        ).toString() === String(categoryId ?? "")
    ) ??
    categories[0] ??
    FALLBACK_GENERAL;

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded shadow relative">
      <h3 className="text-2xl font-semibold mb-4">
        Get Started with Help Desk
      </h3>

      {catError && <div className="mb-3 text-sm text-red-600">{catError}</div>}

      <form onSubmit={submit} className="space-y-4">
        {/* Category is defaulted to "General" and shown as a pill */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Category <span className="text-red-600">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border rounded px-3 py-2 border-slate-500"
            disabled={catLoading}
            required
          >
            {categories.map((c, idx) => {
              const value = String(
                c.id ?? c._id ?? c.title ?? c.name ?? c.label ?? ""
              );
              const label = c.title ?? c.name ?? c.label ?? value;
              return (
                <option key={value || idx} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
          {catLoading && (
            <span className="text-xs text-slate-400">Loading categories…</span>
          )}
        </div>

        <label className="block text-sm font-medium">
          Message <span className="text-red-600">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue "
          className="w-full border rounded px-3 py-2 border-slate-500"
          rows="4"
          required
        />

        {/* <label className="block text-sm font-medium">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full border rounded px-3 py-2 border-slate-500"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select> */}

        <label className="block text-sm font-medium">
          Email Address <span className="text-red-600">*</span>
        </label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email Address"
          className="w-full border rounded px-3 py-2 border-slate-500"
          required
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
          disabled={loading || catLoading}
        >
          {loading ? "Submitting..." : "Submit"}
        </motion.button>

        {/* Inline error message (don't show inline success because we use popup for success) */}
        {alert && alert.type !== "success" && (
          <div
            className={`p-3 rounded ${
              alert.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {alert.text}
          </div>
        )}
      </form>

      {/* Popup Toast for success */}
      <AnimatePresence>
        {showPopup && alert?.type === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto fixed right-4 top-6 z-50 w-full max-w-sm rounded shadow-lg"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3 p-3 rounded bg-white border border-slate-200">
              <div className="flex-shrink-0">
                {/* green check icon inside circle */}
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600 border border-green-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">Success</p>
                <p className="text-sm text-slate-600">{alert?.text}</p>
              </div>

              <div className="flex items-start ml-3">
                <button
                  onClick={() => setShowPopup(false)}
                  aria-label="Close"
                  className="inline-flex p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
