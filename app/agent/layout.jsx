import ProtectedRoute from "@/components/ProtectedRoute";

export default function SupportLayout({ children }) {
  return (
    <ProtectedRoute allowed={["agent"]}>
      <div>{children}</div>
    </ProtectedRoute>
  );
}
