// app/(dashboard)/curriculum-assessment/assessments/new/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssessmentForm from "@/components/curriculum/AssessmentForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewAssessmentPage({
  searchParams,
}: {
  searchParams: { student?: string; subject?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get students for dropdown
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_number, class_id")
    .eq("status", "active")
    .order("last_name");

  // Get subjects for dropdown
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, class_id")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center space-x-4">
        <Link
          href="/curriculum-assessment/assessments"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Record Assessment</h2>
          <p className="text-muted-foreground">
            Add test, quiz, or homework results
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <AssessmentForm
          students={students || []}
          subjects={subjects || []}
          preSelectedStudent={searchParams.student}
          preSelectedSubject={searchParams.subject}
        />
      </div>
    </div>
  );
}
