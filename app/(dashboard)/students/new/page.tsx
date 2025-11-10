// app/(dashboard)/students/new/page.tsx
import { createClient } from "@/lib/supabase/server";
import StudentForm from "@/components/students/StudentForm";
import { redirect } from "next/navigation";

export default async function NewStudentPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get classes for the dropdown
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Add New Student</h2>
        <p className="text-muted-foreground">
          Enter student details to add them to the system
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <StudentForm classes={classes || []} />
      </div>
    </div>
  );
}
