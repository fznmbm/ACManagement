// app/(auth)/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If there's an auth error, the user is not logged in
  // This prevents false redirects
  if (!authError && user) {
    // User is genuinely logged in, determine correct dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "parent") {
      redirect("/parent/dashboard");
    } else if (
      ["admin", "super_admin", "teacher"].includes(profile?.role || "")
    ) {
      redirect("/dashboard");
    }
  }

  // Get centre name from settings
  const { data: centreSettings } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "centre_info")
    .maybeSingle();

  let centreName = "Madrasa System";
  if (centreSettings?.setting_value) {
    let settings = centreSettings.setting_value;
    if (typeof settings === "string") {
      try {
        settings = JSON.parse(settings);
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
    centreName = settings?.centre_name || "Madrasa System";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-primary mb-2"
            suppressHydrationWarning
          >
            {centreName}
          </h1>
          <p className="text-muted-foreground">
            Islamic Educational Centre Management
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 Attendance & Curriculum System System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
