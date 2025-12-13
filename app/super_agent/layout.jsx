import ProtectedRoute from "@/components/ProtectedRoute";

export default function SuperAgentLayout({ children }) {
  return (
    <ProtectedRoute allowed={["super_agent"]}>
      <div>{children}</div>
    </ProtectedRoute>
  );
}

