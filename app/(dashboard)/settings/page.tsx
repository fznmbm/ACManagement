// app/(dashboard)/settings/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsTabs from "@/components/settings/SettingsTabs";
import PageHeader from "@/components/layout/PageHeader";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Only admins can access settings
  if (profile?.role !== "super_admin" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get all settings from database
  const { data: settings } = await supabase
    .from("system_settings")
    .select("*")
    .order("category");

  // Convert settings array to object for easier access
  const settingsMap: Record<string, any> = {};
  settings?.forEach((setting) => {
    settingsMap[setting.setting_key] = setting.setting_value;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage system configuration and preferences."
      />

      <SettingsTabs initialSettings={settingsMap} />
    </div>
  );
}
