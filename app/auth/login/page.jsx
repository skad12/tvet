"use client";

import LoginForm from "@/components/LoginForm";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <main className="relative grid min-h-screen bg-[radial-gradient(circle_at_top_left,rgb(219_234_254/0.8),transparent_30%),linear-gradient(135deg,#f8fafc,#eef6ff_45%,#f8fafc)] lg:grid-cols-2">
      <button
        type="button"
        onClick={handleBack}
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white sm:left-6 sm:top-6"
        aria-label="Go back"
      >
        <span aria-hidden="true">&larr;</span>
        Back
      </button>

      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-lg">
          <LoginForm />
        </div>
      </div>

      <section className="relative hidden min-h-screen overflow-hidden bg-slate-950 text-white lg:block">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="https://assets.mixkit.co/videos/42628/42628-720.mp4"
          poster="https://assets.mixkit.co/videos/42628/42628-thumb-720-0.jpg"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(37_99_235/0.42),transparent_34%),linear-gradient(120deg,rgb(15_23_42/0.94),rgb(15_23_42/0.56)_52%,rgb(15_23_42/0.25))]" />

        <div className="relative z-10 flex min-h-screen flex-col justify-between p-12">
          <div>
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100 backdrop-blur">
              TVET Support
            </p>
            <h1 className="mt-6 max-w-xl text-5xl font-bold leading-tight tracking-tight">
              Support teams and learners connected in one workspace.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-200">
              Sign in to manage tickets, follow conversations, and keep every
              support request moving toward resolution.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["Fast routing", "Live tracking"].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm font-semibold backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
