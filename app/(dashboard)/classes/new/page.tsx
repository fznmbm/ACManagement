// app/(dashboard)/classes/new/page.tsx
import { createClient } from "@/lib/supabase/server";
import ClassForm from "@/components/classes/ClassForm";
import { redirect } from "next/navigation";

export default async function NewClassPage() {
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

  // Only admins can create classes
  if (profile?.role !== "super_admin" && profile?.role !== "admin") {
    redirect("/classes");
  }

  // Get all teachers for dropdown
  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("role", ["teacher", "admin", "super_admin"])
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Add New Class</h2>
        <p className="text-muted-foreground">
          Create a new class and assign a teacher
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <ClassForm teachers={teachers || []} />
      </div>
    </div>
  );
}
