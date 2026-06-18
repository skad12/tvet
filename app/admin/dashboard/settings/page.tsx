import SettingsTabs from "@/components/admin/settings/SettingsTabs";

export default function Page() {
  return (
    <div className="min-h-screen rounded-4xl border border-border bg-card/80 p-4 text-card-foreground shadow-xl shadow-slate-950/5 backdrop-blur">
      <SettingsTabs />
    </div>
  );
}
