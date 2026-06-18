"use client";

import { motion } from "framer-motion";

type TypingIndicatorProps = {
  label?: string;
  align?: "left" | "right";
};

export default function TypingIndicator({
  label = "Typing",
  align = "left",
}: TypingIndicatorProps) {
  return (
    <motion.div
      key="typing-indicator"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`flex ${align === "right" ? "justify-end" : "justify-start"} mt-2`}
      aria-live="polite"
      role="status"
    >
      <div className="max-w-[75%] rounded-lg rounded-tl-none bg-surface-muted px-4 py-3 text-foreground shadow-sm">
        <span className="sr-only">{label}</span>
        <span className="inline-flex h-4 items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-2 w-2 rounded-full bg-muted"
              animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: dot * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}
