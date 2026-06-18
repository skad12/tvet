"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

type ThemeToggleProps = {
  className?: string;
  variant?: "default" | "ghost" | "floating";
};

export default function ThemeToggle({
  className = "",
  variant = "default",
}: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  const variantClasses = {
    default:
      "border-border bg-card text-foreground hover:bg-surface-muted",
    ghost:
      "border-transparent bg-transparent text-muted hover:bg-surface-muted hover:text-foreground",
    floating:
      "border-white/35 bg-white/10 text-white backdrop-blur hover:bg-white/20",
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${variantClasses[variant]} ${className}`}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4" aria-hidden="true" />
        )
      ) : (
        <span className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
