// app/(dashboard)/curriculum-assessment/subjects/[id]/edit/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditSubjectForm from "@/components/curriculum/EditSubjectForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditSubjectPage({
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

  // Only admins can edit subjects
  if (profile?.role !== "super_admin" && profile?.role !== "admin") {
    redirect("/curriculum-assessment/subjects");
  }

  // Get subject data
  const { data: subject, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !subject) {
    notFound();
  }

  // Get all classes for dropdown
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center space-x-4">
        <Link
          href={`/curriculum-assessment/subjects/${subject.id}`}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Edit Subject</h2>
          <p className="text-muted-foreground">
            Update information for {subject.name}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <EditSubjectForm subject={subject} classes={classes || []} />
      </div>
    </div>
  );
}
