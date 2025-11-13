// "use client";
// import { useState } from "react";
// import api from "../lib/axios";
// import { motion } from "framer-motion";

// export default function TicketForm() {
//   const [category, setCategory] = useState("");
//   const [description, setDescription] = useState("");
//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState(null);

//   const submit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage(null);
//     try {
//       const payload = { category, description, email };
//       await api.post("/tickets", payload);
//       setMessage({ type: "success", text: "Ticket submitted successfully." });
//       setCategory("");
//       setDescription("");
//       setEmail("");
//     } catch {
//       setMessage({ type: "error", text: "Failed to submit ticket." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto bg-white p-8 rounded shadow">
//       <h3 className="text-2xl font-semibold mb-4">
//         Get Started with Help Desk
//       </h3>
//       <form onSubmit={submit} className="space-y-4">
//         <select
//           value={category}
//           onChange={(e) => setCategory(e.target.value)}
//           className="w-full border rounded px-3 py-2"
//         >
//           <option value="">-- Select Category --</option>
//           <option value="onboarding">General</option>
//           <option value="registration">Issue with the centre</option>
//           <option value="finance">Finance</option>
//           <option value="onboarding">Onboarding Issues and Sign In</option>
//           <option value="other">Other</option>
//         </select>
//         <textarea
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           placeholder="Brief description (optional)"
//           className="w-full border rounded px-3 py-2"
//           rows="4"
//         />
//         <input
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           type="email"
//           placeholder="Email Address"
//           className="w-full border rounded px-3 py-2"
//           required
//         />
//         <motion.button
//           whileHover={{ scale: 1.02 }}
//           whileTap={{ scale: 0.98 }}
//           type="submit"
//           className="w-full bg-blue-600 text-white py-2 rounded"
//         >
//           {loading ? "Submitting..." : "Submit"}
//         </motion.button>
//         {message && (
//           <div
//             className={`p-3 rounded ${
//               message.type === "success"
//                 ? "bg-green-50 text-green-700"
//                 : "bg-red-50 text-red-700"
//             }`}
//           >
//             {message.text}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

// "use client";

// import { useState, useEffect } from "react";
// import api from "../lib/axios";
// import { motion } from "framer-motion";

// export default function TicketForm() {
//   const [categories, setCategories] = useState([]);
//   const [catLoading, setCatLoading] = useState(true);
//   const [catError, setCatError] = useState(null);

//   const [categoryId, setCategoryId] = useState("");
//   const [description, setDescription] = useState("");
//   const [email, setEmail] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState(null);

//   // fetch categories on mount
//   useEffect(() => {
//     let mounted = true;
//     const load = async () => {
//       setCatLoading(true);
//       setCatError(null);
//       try {
//         const res = await api.get("/get-all-category/");
//         // if API returns array as body (per your example), use it directly
//         const data = Array.isArray(res.data)
//           ? res.data
//           : res.data?.categories ?? [];
//         if (mounted) {
//           setCategories(data);
//         }
//       } catch (err) {
//         console.error("Failed to load categories", err);
//         setCatError("Failed to load categories. Showing default list.");
//         // fallback static categories (useful if API fails)
//         setCategories([
//           { id: "fallback-general", title: "General" },
//           { id: "fallback-finance", title: "Finance" },
//           { id: "fallback-onboarding", title: "Onboarding" },
//         ]);
//       } finally {
//         if (mounted) setCatLoading(false);
//       }
//     };

//     load();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const submit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage(null);

//     const selected = categories.find((c) => c.id === categoryId) ?? null;
//     if (!selected) {
//       setMessage({ type: "error", text: "Please select a category." });
//       setLoading(false);
//       return;
//     }

//     try {
//       // send both id and title so backend can use whichever it expects
//       const payload = {
//         categoryId: selected.id,
//         categoryTitle: (selected.title || "").trim(),
//         description,
//         email,
//       };
//       await api.post("/tickets", payload);

//       setMessage({ type: "success", text: "Ticket submitted successfully." });
//       setCategoryId("");
//       setDescription("");
//       setEmail("");
//     } catch (err) {
//       console.error("submit error", err);
//       setMessage({ type: "error", text: "Failed to submit ticket." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto bg-white p-8 rounded shadow">
//       <h3 className="text-2xl font-semibold mb-4">
//         Get Started with Help Desk
//       </h3>

//       {catError && <div className="mb-3 text-sm text-red-600">{catError}</div>}

//       <form onSubmit={submit} className="space-y-4">
//         <label className="block text-sm font-medium">Category *</label>
//         <select
//           value={categoryId}
//           onChange={(e) => setCategoryId(e.target.value)}
//           className="w-full border rounded px-3 py-2"
//           required
//           disabled={catLoading}
//         >
//           <option value="">
//             {catLoading ? "Loading categories..." : "-- Select Category --"}
//           </option>

//           {categories.map((c) => (
//             <option key={c.id} value={c.id}>
//               {c.title?.trim() ?? c.title}
//             </option>
//           ))}
//         </select>

//         <label className="block text-sm font-medium">Description</label>
//         <textarea
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           placeholder="Brief description (optional)"
//           className="w-full border rounded px-3 py-2"
//           rows="4"
//         />

//         <label className="block text-sm font-medium">Email Address *</label>
//         <input
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           type="email"
//           placeholder="Email Address"
//           className="w-full border rounded px-3 py-2"
//           required
//         />

//         <motion.button
//           whileHover={{ scale: 1.02 }}
//           whileTap={{ scale: 0.98 }}
//           type="submit"
//           className="w-full bg-blue-600 text-white py-2 rounded"
//           disabled={loading || catLoading}
//         >
//           {loading ? "Submitting..." : "Submit"}
//         </motion.button>

//         {message && (
//           <div
//             className={`p-3 rounded ${
//               message.type === "success"
//                 ? "bg-green-50 text-green-700"
//                 : "bg-red-50 text-red-700"
//             }`}
//           >
//             {message.text}
//           </div>
//         )}
//       </form>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import api from "../../lib/axios";
import { motion } from "framer-motion";

export default function TicketForm() {
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState(null);

  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState(""); // optional
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const router = useRouter();

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
        if (mounted) setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
        setCatError("Failed to load categories. Showing default list.");
        if (mounted)
          setCategories([
            { id: "fallback-general", title: "General" },
            { id: "fallback-finance", title: "Finance" },
            { id: "fallback-onboarding", title: "Onboarding" },
          ]);
      } finally {
        if (mounted) setCatLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const selected = categories.find((c) => c.id === categoryId) ?? null;
    if (!selected) {
      setMessage({ type: "error", text: "Please select a category." });
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter an email address." });
      setLoading(false);
      return;
    }

    try {
      // Endpoint requires { email, category_id } — include description optionally
      const payload = {
        email: email.trim(),
        category_id: selected.id,
        description: description.trim(), // included but not required
      };

      const res = await api.post("/tickets/create/", payload);

      const ok = res?.status === 201 || res?.data?.ok || res?.status === 200;
      if (ok) {
        setMessage({ type: "success", text: "Ticket created successfully." });
        setCategoryId("");
        setDescription("");
        setEmail("");
        localStorage.setItem("tvet_user_email", email.trim());
        router.push("/customer/dashboard");
      } else {
        setMessage({
          type: "error",
          text: res?.data?.message ?? "Failed to create ticket.",
        });
      }
    } catch (err) {
      console.error("submit error", err);
      const serverMsg = err?.response?.data?.message || err?.message;
      setMessage({
        type: "error",
        text: serverMsg || "Failed to submit ticket.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded shadow">
      <h3 className="text-2xl font-semibold mb-4">
        Get Started with Help Desk
      </h3>

      {catError && <div className="mb-3 text-sm text-red-600">{catError}</div>}

      <form onSubmit={submit} className="space-y-4">
        {/* <label className="block text-sm font-medium">
          Category <span className="text-red-600">*</span>
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border rounded px-3 py-2 border-slate-500"
          required
          disabled={catLoading}
        >
          <option value="">
            {catLoading ? "Loading categories..." : "-- Select Category --"}
          </option>

          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title?.trim() ?? c.title}
            </option>
          ))}
        </select> */}

        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description (optional)"
          className="w-full border rounded px-3 py-2 border-slate-500"
          rows="4"
        />

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
    </div>
  );
}
