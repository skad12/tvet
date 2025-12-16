"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/axios"; // ensure this exists and has baseURL set
import { useUserStore } from "@/stores/useUserStore";

export default function TrackTicketModal({ show = false, onClose = () => {} }) {
  const router = useRouter();
  const { setUser, setToken } = useUserStore();
  const [step, setStep] = useState("email"); // 'email' or 'otp'
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [resendDisabled, setResendDisabled] = useState(false);

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setOtp("");
    setError(null);
    setInfo(null);
    setLoading(false);
    setResendDisabled(false);
    onClose();
  };

  // Send email for authentication (handle the endpoint here)
  const handleSendEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      // POST /send-otp/ body: { email }
      const res = await api.post("/send-otp/", { email });

      // flexible handling depending on API response shape:
      // if API returns something like { success: true, message: "sent" }
      // use res.data.message; fallback to generic message
      const message =
        res?.data?.message ||
        res?.data?.detail ||
        "Verification code sent. Check your email.";

      setInfo(message);

      // Move to OTP step
      setStep("otp");

      // optionally disable resend for 20 seconds to avoid rapid re-sends
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 20000);
    } catch (err) {
      console.error("Failed to send email:", err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (err?.response?.data ? JSON.stringify(err.response.data) : null);
      setError(apiMsg || err?.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      // POST /verify-otp/ body: { email, otp }
      const res = await api.post("/verify-otp/", { email, otp });
      const data = res?.data ?? {};

      // Extract token and user data from response
      const resolvedToken =
        data.token || data.access || data.access_token || null;
      const returnedUser = data.user ?? {
        id: data.id,
        email: email,
        account_type: "customer",
        username: email.split("@")[0],
      };

      // Store user and token in auth store
      if (resolvedToken) {
        setToken(resolvedToken);
        try {
          localStorage.setItem("token", resolvedToken);
        } catch (e) {
          console.warn("Failed to save token to localStorage", e);
        }
      }

      if (returnedUser) {
        setUser(returnedUser);
        try {
          localStorage.setItem("user", JSON.stringify(returnedUser));
          localStorage.setItem("account_type", "customer");
          localStorage.setItem("tvet_user_email", email);
        } catch (e) {
          console.warn("Failed to save user to localStorage", e);
        }
      }

      // Route to customer dashboard after successful authentication
      router.push("/customer/dashboard");
      handleClose();
    } catch (err) {
      console.error("Failed to verify OTP:", err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (err?.response?.data ? JSON.stringify(err.response.data) : null);
      setError(apiMsg || err?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

          {/* Modal Content */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative bg-white rounded-t-3xl md:rounded-lg shadow-lg w-full md:max-w-md p-6 md:p-8 border-t md:border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Email Step */}
            {step === "email" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Track Your Ticket
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  Enter your email to receive a verification code
                </p>

                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                      {error}
                    </div>
                  )}

                  {info && (
                    <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                      {info}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send Verification Code"}
                  </button>
                </form>
              </motion.div>
            )}

            {/* OTP Step */}
            {step === "otp" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => {
                    setStep("email");
                    setError(null);
                    setOtp("");
                    setInfo(null);
                  }}
                  className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>

                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Enter Verification Code
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  We sent a code to <span className="font-medium">{email}</span>
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Verification Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                      maxLength={6}
                      disabled={loading}
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={loading || resendDisabled}
                    className="w-full text-sm text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
                  >
                    {resendDisabled
                      ? "Resend (wait)"
                      : "Didn't receive the code? Resend"}
                  </button>
                </form>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
