// app/(dashboard)/curriculum-assessment/exams/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, BookOpen, Users, Calendar } from "lucide-react";
import ResultsGrid from "@/components/curriculum/ResultsGrid";
import { formatDate } from "@/lib/utils/helpers";

export default async function ExamGridPage({
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
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: exam, error } = await supabase
    .from("exams")
    .select(
      `
      id, title, exam_date, written_max, subject_id, class_id,
      subjects ( name ),
      classes ( name )
    `,
    )
    .eq("id", params.id)
    .single();

  if (error || !exam) notFound();

  // Active students in the exam's class.
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_number")
    .eq("class_id", exam.class_id)
    .eq("status", "active")
    .order("first_name");

  // Marks already entered for this exam.
  const { data: existing } = await supabase
    .from("academic_progress")
    .select("id, student_id, written_score")
    .eq("exam_id", exam.id);

  const canManage = ["super_admin", "admin", "teacher"].includes(
    profile?.role || "",
  );

  const subjectName = (exam as any).subjects?.name || "Subject";
  const className = (exam as any).classes?.name || "Class";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/curriculum-assessment/exams"
            className="p-2 hover:bg-accent rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold">{exam.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {subjectName}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {className}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(exam.exam_date, "long")}
              </span>
              <span>Out of {Number(exam.written_max)}</span>
            </div>
          </div>
        </div>
        {canManage && (
          <Link
            href={`/curriculum-assessment/exams/${exam.id}/edit`}
            className="btn-outline flex items-center gap-2 shrink-0"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit exam</span>
          </Link>
        )}
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Enter each student&apos;s score, then tap <strong>Save all</strong>.
          You can come back and edit any time.
        </p>
        <ResultsGrid
          exam={{
            id: exam.id,
            subject_id: exam.subject_id,
            class_id: exam.class_id,
            exam_date: exam.exam_date,
            written_max: Number(exam.written_max),
          }}
          students={students || []}
          existing={existing || []}
        />
      </div>
    </div>
  );
}
