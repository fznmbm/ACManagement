// app/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to appropriate portal
  if (user) {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Redirect based on role
    if (profile?.role === "parent") {
      redirect("/portal"); // Parent portal (we'll create this later)
    } else {
      redirect("/dashboard"); // Admin/Teacher dashboard
    }
  }

  // If NOT logged in, redirect to public home
  redirect("/home");
}
