// app/(dashboard)/settings/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsTabs from "@/components/settings/SettingsTabs";

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

  // Get all users for user management
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage system configuration and preferences
        </p>
      </div>

      <SettingsTabs
        initialSettings={settingsMap}
        users={users || []}
        currentUserId={user.id}
      />
    </div>
  );
}
