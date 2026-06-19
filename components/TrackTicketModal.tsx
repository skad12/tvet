"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { landing } from "@/components/ui/landingStyles";
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
      const message = "Please enter your email";
      setError(message);
      toast.error(message);
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
      toast.success(message);

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
      const message = apiMsg || err?.message || "Failed to send email";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      const message = "Please enter the OTP";
      setError(message);
      toast.error(message);
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
      toast.success("OTP verified successfully");
      router.push("/customer/dashboard");
      handleClose();
    } catch (err) {
      console.error("Failed to verify OTP:", err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (err?.response?.data ? JSON.stringify(err.response.data) : null);
      const message = apiMsg || err?.message || "Invalid OTP. Please try again.";
      setError(message);
      toast.error(message);
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
          className={`${landing.modalOverlay} z-[60] flex items-end justify-center p-0 md:items-center md:p-4`}
        >
          <div className={landing.modalBackdrop} onClick={handleClose} />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`${landing.modal} relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl p-6 md:max-w-md md:rounded-3xl md:p-8`}
          >
            <button
              onClick={handleClose}
              className={`${landing.btnGhost} absolute right-4 top-4`}
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
                <p className={landing.eyebrow}>Guest access</p>
                <h2 className={`${landing.title} mb-2`}>
                  Track Your Ticket
                </h2>
                <p className={`${landing.subtitle} mb-6`}>
                  Enter your email to receive a verification code
                </p>

                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <label htmlFor="email" className={landing.label}>
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className={landing.input}
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
                    className={`${landing.btnPrimary} w-full`}
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

                <h2 className={`${landing.title} mb-2`}>
                  Enter Verification Code
                </h2>
                <p className={`${landing.subtitle} mb-6`}>
                  We sent a code to <span className="font-medium">{email}</span>
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label htmlFor="otp" className={landing.label}>
                      Verification Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className={`${landing.input} text-center text-lg tracking-widest`}
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
                    className={`${landing.btnPrimary} w-full`}
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
