// File: app/(dashboard)/users/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UsersClient from "@/components/users/UsersClient";

// Server-side gate: only super_admins ever reach the client UI. Previously the
// page was fully client-side and fetched the user list before a delayed
// client redirect — i.e. the data was pulled into a non-admin's browser first.
export default async function UsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  return <UsersClient />;
}
