// app/(dashboard)/classes/[id]/edit/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditClassForm from "@/components/classes/EditClassForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditClassPage({
  params,
}: {
  params: { id: string };
}) {
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

  // Only admins can edit classes
  if (profile?.role !== "super_admin" && profile?.role !== "admin") {
    redirect("/classes");
  }

  // Get class data
  const { data: classData, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !classData) {
    notFound();
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
      <div className="mb-6 flex items-center space-x-4">
        <Link
          href={`/classes/${classData.id}`}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Edit Class</h2>
          <p className="text-muted-foreground">
            Update information for {classData.name}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <EditClassForm classData={classData} teachers={teachers || []} />
      </div>
    </div>
  );
}
