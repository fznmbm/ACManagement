// app/(dashboard)/students/[id]/edit/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditStudentForm from "@/components/students/EditStudentForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditStudentPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get student data
  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !student) {
    notFound();
  }

  // Get classes for dropdown
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center space-x-4">
        <Link
          href={`/students/${student.id}`}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Edit Student</h2>
          <p className="text-muted-foreground">
            Update information for {student.first_name} {student.last_name}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <EditStudentForm student={student} classes={classes || []} />
      </div>
    </div>
  );
}
