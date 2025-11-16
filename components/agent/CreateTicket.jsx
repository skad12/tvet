// components/CreateTicket.jsx
// "use client";

// import { useEffect, useRef, useState } from "react";
// import { motion } from "framer-motion";
// import api from "@/lib/axios"; // adjust path if needed
// import { useRouter } from "next/navigation";

// export default function CreateTicket({
//   isOpen = false,
//   onClose = () => {},
//   defaultReporterEmail = "",
//   redirectAfter = null, // optional: "/customer/dashboard"
// }) {
//   const router = useRouter();
//   const [categories, setCategories] = useState([]);
//   const [catLoading, setCatLoading] = useState(true);
//   const [catError, setCatError] = useState(null);

//   const [categoryId, setCategoryId] = useState("");
//   const [subject, setSubject] = useState(""); // NEW
//   const [priority, setPriority] = useState("Low"); // NEW: Low | Medium | High | Urgent
//   const [description, setDescription] = useState("");
//   const [email, setEmail] = useState(defaultReporterEmail || "");

//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState(null);

//   const emailRef = useRef(null);
//   const modalRef = useRef(null);

//   // prevent body scroll while open
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     document.body.style.overflow = isOpen ? "hidden" : "";
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [isOpen]);

//   // load categories once
//   useEffect(() => {
//     let mounted = true;
//     async function loadCategories() {
//       setCatLoading(true);
//       setCatError(null);
//       try {
//         if (api && typeof api.get === "function") {
//           const res = await api.get("/get-all-category/");
//           const data = Array.isArray(res.data)
//             ? res.data
//             : res.data?.categories ?? [];
//           if (mounted) setCategories(data);
//         } else {
//           const base =
//             typeof window !== "undefined"
//               ? process.env.NEXT_PUBLIC_API_BASE
//               : undefined;
//           const endpoint = base
//             ? `${base.replace(/\/$/, "")}/get-all-category/`
//             : "/api/get-all-category";
//           const r = await fetch(endpoint, {
//             headers: { "Content-Type": "application/json" },
//           });
//           if (!r.ok) throw new Error(`Failed to load categories (${r.status})`);
//           const json = await r.json();
//           const data = Array.isArray(json) ? json : json?.categories ?? [];
//           if (mounted) setCategories(data);
//         }
//       } catch (err) {
//         console.error("Failed to load categories", err);
//         setCatError("Failed to load categories. Using default General.");
//         if (mounted) setCategories([{ id: "general", title: "General" }]);
//       } finally {
//         if (mounted) setCatLoading(false);
//       }
//     }

//     loadCategories();
//     return () => (mounted = false);
//   }, []);

//   // when categories load pick default category (prefer "general")
//   useEffect(() => {
//     if (!catLoading && categories.length > 0 && !categoryId) {
//       const found =
//         categories.find((c) =>
//           String(c.title ?? c.name ?? c.id ?? "")
//             .toLowerCase()
//             .includes("general")
//         ) ?? categories[0];
//       setCategoryId(
//         found.id ?? found._id ?? String(found.title ?? found.name ?? "")
//       );
//     }
//   }, [catLoading, categories, categoryId]);

//   // focus email on open & set default email
//   useEffect(() => {
//     if (isOpen) {
//       setTimeout(() => {
//         if (defaultReporterEmail) setEmail(defaultReporterEmail);
//         emailRef.current?.focus?.();
//       }, 60);
//     }
//   }, [isOpen, defaultReporterEmail]);

//   // close on Escape
//   useEffect(() => {
//     function onKey(e) {
//       if (e.key === "Escape") onClose();
//     }
//     if (isOpen) window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [isOpen, onClose]);

//   // click outside to close
//   useEffect(() => {
//     function onDocClick(e) {
//       if (!isOpen) return;
//       if (!modalRef.current) return;
//       if (!modalRef.current.contains(e.target)) onClose();
//     }
//     if (isOpen) document.addEventListener("mousedown", onDocClick);
//     return () => document.removeEventListener("mousedown", onDocClick);
//   }, [isOpen, onClose]);

//   const submit = async (ev) => {
//     ev.preventDefault();
//     setMessage(null);

//     if (!email.trim()) {
//       setMessage({ type: "error", text: "Please enter your email." });
//       return;
//     }
//     if (!categoryId) {
//       setMessage({ type: "error", text: "Please pick a category." });
//       return;
//     }
//     if (!subject.trim()) {
//       setMessage({
//         type: "error",
//         text: "Please enter a subject for the ticket.",
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       const payload = {
//         email: email.trim(),
//         category_id: categoryId,
//         subject: subject.trim(), // NEW
//         priority: priority || "Low", // NEW
//         description: description.trim(),
//       };

//       let res;
//       if (api && typeof api.post === "function") {
//         res = await api.post("/tickets/create/", payload);
//       } else {
//         const base =
//           typeof window !== "undefined"
//             ? process.env.NEXT_PUBLIC_API_BASE
//             : undefined;
//         const endpoint = base
//           ? `${base.replace(/\/$/, "")}/tickets/create/`
//           : "/api/tickets/create";
//         const r = await fetch(endpoint, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         });
//         if (!r.ok) {
//           const text = await r.text().catch(() => "");
//           throw new Error(`Create failed (${r.status}) ${text}`);
//         }
//         const json = await r.json().catch(() => ({}));
//         res = { status: r.status, data: json };
//       }

//       const ok = res?.status === 201 || res?.status === 200 || res?.data?.ok;
//       if (!ok) {
//         const txt =
//           res?.data?.message ?? JSON.stringify(res?.data ?? res ?? "");
//         setMessage({ type: "error", text: String(txt) });
//         setLoading(false);
//         return;
//       }

//       setMessage({ type: "success", text: "Ticket created successfully." });
//       try {
//         if (typeof window !== "undefined")
//           localStorage.setItem("tvet_user_email", email.trim());
//       } catch (e) {}

//       // clear fields (preserve category default if you want)
//       setSubject("");
//       setPriority("Low");
//       setDescription("");

//       // optionally redirect or just close
//       setTimeout(() => {
//         if (redirectAfter) {
//           router.push(redirectAfter);
//         } else {
//           onClose();
//         }
//       }, 700);
//     } catch (err) {
//       console.error("submit error", err);
//       const serverMsg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Failed to create ticket.";
//       setMessage({ type: "error", text: String(serverMsg) });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
//       {/* overlay */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 0.5 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 bg-black"
//       />

//       {/* panel (top aligned) */}
//       <motion.div
//         initial={{ opacity: 0, y: -8 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: -8 }}
//         className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden z-50"
//         role="dialog"
//         aria-modal="true"
//         ref={modalRef}
//       >
//         <div className="flex items-center justify-between p-4 border-b border-slate-300">
//           <h3 className="text-lg font-semibold">Create Support Ticket</h3>
//           <button
//             onClick={onClose}
//             aria-label="Close"
//             className="text-slate-500 hover:text-slate-800"
//           >
//             ✕
//           </button>
//         </div>

//         <form onSubmit={submit} className="p-6 space-y-4">
//           {catError && <div className="text-sm text-red-600">{catError}</div>}

//           <div>
//             <label className="block text-sm font-medium">Category</label>
//             <select
//               value={categoryId}
//               onChange={(e) => setCategoryId(e.target.value)}
//               className="w-full border border-slate-300 rounded px-3 py-2"
//               disabled={catLoading}
//               required
//             >
//               {catLoading ? (
//                 <option>Loading categories...</option>
//               ) : (
//                 categories.map((c) => (
//                   <option
//                     key={c.id ?? c._id ?? c.title}
//                     value={c.id ?? c._id ?? c.title}
//                   >
//                     {c.title ?? c.name ?? c.label ?? c.id}
//                   </option>
//                 ))
//               )}
//             </select>
//           </div>

//           {/* NEW: Subject */}
//           <div>
//             <label className="block text-sm font-medium">Subject</label>
//             <input
//               value={subject}
//               onChange={(e) => setSubject(e.target.value)}
//               type="text"
//               placeholder="Brief summary of the issue"
//               className="w-full border border-slate-300 rounded px-3 py-2"
//               required
//             />
//           </div>

//           {/* NEW: Priority */}
//           <div>
//             <label className="block text-sm font-medium">Priority</label>
//             <select
//               value={priority}
//               onChange={(e) => setPriority(e.target.value)}
//               className="w-full border border-slate-300 rounded px-3 py-2"
//             >
//               <option value="Low">Low</option>
//               <option value="Medium">Medium</option>
//               <option value="High">High</option>
//               <option value="Urgent">Urgent</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Description</label>
//             <textarea
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               placeholder="Brief description (optional)"
//               className="w-full border border-slate-300 rounded px-3 py-2"
//               rows="4"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Email Address</label>
//             <input
//               ref={emailRef}
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               type="email"
//               placeholder="your@email.com"
//               className="w-full border border-slate-300 rounded px-3 py-2"
//               required
//             />
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               type="submit"
//               disabled={loading || catLoading}
//               className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
//             >
//               {loading ? "Submitting..." : "Submit Ticket"}
//             </button>

//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border border-slate-300 rounded"
//             >
//               Cancel
//             </button>
//           </div>

//           {message && (
//             <div
//               className={`p-3 rounded ${
//                 message.type === "success"
//                   ? "bg-green-50 text-green-700"
//                   : "bg-red-50 text-red-700"
//               }`}
//             >
//               {message.text}
//             </div>
//           )}
//         </form>
//       </motion.div>
//     </div>
//   );
// }

"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/axios"; // adjust path if needed
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CreateTicket({
  isOpen = false,
  onClose = () => {},
  redirectAfter = null, // optional: "/customer/dashboard"
}) {
  const router = useRouter();
  const { user } = useAuth?.() ?? {};
  const subjectRef = useRef(null);
  const modalRef = useRef(null);

  // derive reporter email from auth user (no fallback)
  const authEmail = user?.email ?? user?.username ?? null;

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState(null);

  const [categoryId, setCategoryId] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Low");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // focus subject on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => subjectRef.current?.focus?.(), 60);
    }
  }, [isOpen]);

  // prevent body scroll while open
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // load categories once
  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      setCatLoading(true);
      setCatError(null);
      try {
        if (api && typeof api.get === "function") {
          const res = await api.get("/get-all-category/");
          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.categories ?? [];
          if (mounted) setCategories(data);
        } else {
          const base =
            typeof window !== "undefined"
              ? process.env.NEXT_PUBLIC_API_BASE
              : undefined;
          const endpoint = base
            ? `${base.replace(/\/$/, "")}/get-all-category/`
            : "/api/get-all-category";
          const r = await fetch(endpoint, {
            headers: { "Content-Type": "application/json" },
          });
          if (!r.ok) throw new Error(`Failed to load categories (${r.status})`);
          const json = await r.json();
          const data = Array.isArray(json) ? json : json?.categories ?? [];
          if (mounted) setCategories(data);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
        setCatError("Failed to load categories. Using default General.");
        if (mounted) setCategories([{ id: "general", title: "General" }]);
      } finally {
        if (mounted) setCatLoading(false);
      }
    }

    loadCategories();
    return () => (mounted = false);
  }, []);

  // when categories load pick default category (prefer "general")
  useEffect(() => {
    if (!catLoading && categories.length > 0 && !categoryId) {
      const found =
        categories.find((c) =>
          String(c.title ?? c.name ?? c.id ?? "")
            .toLowerCase()
            .includes("general")
        ) ?? categories[0];
      setCategoryId(
        found.id ?? found._id ?? String(found.title ?? found.name ?? "")
      );
    }
  }, [catLoading, categories, categoryId]);

  // close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // click outside to close
  useEffect(() => {
    function onDocClick(e) {
      if (!isOpen) return;
      if (!modalRef.current) return;
      if (!modalRef.current.contains(e.target)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isOpen, onClose]);

  const submit = async (ev) => {
    ev.preventDefault();
    setMessage(null);

    // REQUIRED: must be authenticated — no fallback email
    const reporterEmail = authEmail ? String(authEmail).trim() : "";

    if (!reporterEmail) {
      setMessage({
        type: "error",
        text: "You must be signed in to create a ticket. Please sign in and try again.",
      });
      return;
    }
    if (!categoryId) {
      setMessage({ type: "error", text: "Please pick a category." });
      return;
    }
    if (!subject.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a subject for the ticket.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: reporterEmail,
        category_id: categoryId,
        subject: subject.trim(),
        priority: priority || "Low",
        description: description.trim(),
      };

      let res;
      if (api && typeof api.post === "function") {
        res = await api.post("/tickets/create/", payload);
      } else {
        const base =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_API_BASE
            : undefined;
        const endpoint = base
          ? `${base.replace(/\/$/, "")}/tickets/create/`
          : "/api/tickets/create";
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          throw new Error(`Create failed (${r.status}) ${text}`);
        }
        const json = await r.json().catch(() => ({}));
        res = { status: r.status, data: json };
      }

      const ok = res?.status === 201 || res?.status === 200 || res?.data?.ok;
      if (!ok) {
        const txt =
          res?.data?.message ?? JSON.stringify(res?.data ?? res ?? "");
        setMessage({ type: "error", text: String(txt) });
        setLoading(false);
        return;
      }

      setMessage({ type: "success", text: "Ticket created successfully." });

      // clear fields
      setSubject("");
      setPriority("Low");
      setDescription("");

      // optionally redirect or just close
      setTimeout(() => {
        if (redirectAfter) {
          router.push(redirectAfter);
        } else {
          onClose();
        }
      }, 700);
    } catch (err) {
      console.error("submit error", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create ticket.";
      setMessage({ type: "error", text: String(serverMsg) });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black"
      />

      {/* panel (top aligned) */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden z-50"
        role="dialog"
        aria-modal="true"
        ref={modalRef}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-300">
          <h3 className="text-lg font-semibold">Create Support Ticket</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {catError && <div className="text-sm text-red-600">{catError}</div>}

          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
              disabled={catLoading}
              required
            >
              {catLoading ? (
                <option>Loading categories...</option>
              ) : (
                categories.map((c) => (
                  <option
                    key={c.id ?? c._id ?? c.title}
                    value={c.id ?? c._id ?? c.title}
                  >
                    {c.title ?? c.name ?? c.label ?? c.id}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium">Subject</label>
            <input
              ref={subjectRef}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              type="text"
              placeholder="Brief summary of the issue"
              className="w-full border border-slate-300 rounded px-3 py-2"
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              className="w-full border border-slate-300 rounded px-3 py-2"
              rows="4"
            />
          </div>

          {/* Reporter: show auth email or prompt to sign in (no editable fallback) */}
          <div>
            <label className="block text-sm font-medium">Reporter</label>
            <div className="w-full border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-700">
              {authEmail ? authEmail : "Sign in to create a ticket"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || catLoading || !authEmail}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded"
            >
              Cancel
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
