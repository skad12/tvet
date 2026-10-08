import ReportsPage from "@/components/admin/reports/ReportsPage";
import { landing } from "@/components/ui/landingStyles";

export default function Page() {
  return (
    <div className={`min-h-screen ${landing.card} p-4 sm:p-6`}>
      <ReportsPage />
    </div>
  );
}
