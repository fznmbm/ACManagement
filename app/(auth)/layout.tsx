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
  } = await supabase.auth.getUser();

  // If already logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Madrasa Attendance
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
          © 2024 Madrasa Attendance System. Free for non-profit Islamic centres.
        </p>
      </div>
    </div>
  );
}
