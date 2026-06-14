

"use client";

import { motion } from "framer-motion";
import AgentCard from "./AgentCard";

export default function AgentsGrid({
  agents = [],
  currentUserEmail = null,
  onDelete,
}) {
  if (!Array.isArray(agents)) agents = [];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
      }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6"
    >
      {agents.map((a) => (
        <AgentCard
          key={a.id || a.username}
          agent={a}
          currentUserEmail={currentUserEmail}
          onDelete={onDelete}
        />
      ))}
    </motion.div>
  );
}
