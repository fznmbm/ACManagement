// app/parent/layout.tsx
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: {
    default: "Parent Portal - Al Hikmah Institute",
    template: "%s | Parent Portal",
  },
  description: "Access your child's academic progress and school information",
};

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get centre name from settings (optional, for branding)
  const supabase = await createClient();

  const { data: centreSettings } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "centre_info")
    .maybeSingle();

  let centreName = "Al Hikmah Institute";
  if (centreSettings?.setting_value) {
    let settings = centreSettings.setting_value;
    if (typeof settings === "string") {
      try {
        settings = JSON.parse(settings);
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
    centreName = settings?.centre_name || "Al Hikmah Institute";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {children}
    </div>
  );
}
