"use client";

import { motion } from "framer-motion";

export default function Skeleton({
  className = "",
  variant = "default",
  lines = 1,
  width,
}) {
  const variants = {
    default: "bg-slate-200 rounded",
    text: "bg-slate-200 rounded h-4",
    avatar: "bg-slate-200 rounded-full",
    card: "bg-slate-200 rounded-lg",
    button: "bg-slate-200 rounded-md h-10",
  };

  const baseClasses = variants[variant] || variants.default;

  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            className={`${baseClasses} ${i === lines - 1 && width ? `w-${width}/12` : "w-full"}`}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${className}`}
      style={width ? { width: `${width}%` } : {}}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
      }}
    />
  );
}

// Specialized skeleton components
export function TicketSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton variant="text" className="w-3/4 mb-2" />
          <Skeleton variant="text" className="w-1/2 mb-2" />
          <div className="flex items-center gap-2 mt-2">
            <Skeleton variant="default" className="w-16 h-6" />
            <Skeleton variant="text" className="w-24" />
          </div>
        </div>
        <Skeleton variant="avatar" className="w-10 h-10" />
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              i % 2 === 0 ? "bg-blue-100" : "bg-slate-100"
            }`}
          >
            <Skeleton variant="text" lines={(i % 2) + 1} />
            <Skeleton variant="text" className="w-20 mt-2 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <TicketSkeleton key={i} />
      ))}
    </div>
  );
}
