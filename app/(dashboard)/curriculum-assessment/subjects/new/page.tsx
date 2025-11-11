// app/(dashboard)/curriculum-assessment/subjects/new/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubjectForm from "@/components/curriculum/SubjectForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewSubjectPage() {
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

  // Only admins can create subjects
  if (profile?.role !== "super_admin" && profile?.role !== "admin") {
    redirect("/curriculum-assessment/subjects");
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
          href="/curriculum-assessment/subjects"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Add New Subject</h2>
          <p className="text-muted-foreground">
            Create a new curriculum subject
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <SubjectForm classes={classes || []} />
      </div>
    </div>
  );
}
