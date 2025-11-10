"use client";
import { useState } from "react";
import api from "../lib/axios";
import { motion } from "framer-motion";

export default function TicketForm() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = { category, description, email };
      await api.post("/tickets", payload);
      setMessage({ type: "success", text: "Ticket submitted successfully." });
      setCategory("");
      setDescription("");
      setEmail("");
    } catch {
      setMessage({ type: "error", text: "Failed to submit ticket." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded shadow">
      <h3 className="text-2xl font-semibold mb-4">
        Get Started with Help Desk
      </h3>
      <form onSubmit={submit} className="space-y-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- Select Category --</option>
          <option value="onboarding">General</option>
          <option value="registration">Issue with the centre</option>
          <option value="finance">Finance</option>
          <option value="onboarding">Onboarding Issues and Sign In</option>
          <option value="other">Other</option>
        </select>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description (optional)"
          className="w-full border rounded px-3 py-2"
          rows="4"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email Address"
          className="w-full border rounded px-3 py-2"
          required
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
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
