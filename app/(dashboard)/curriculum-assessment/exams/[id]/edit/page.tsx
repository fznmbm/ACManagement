// app/(dashboard)/curriculum-assessment/exams/[id]/edit/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ExamForm from "@/components/curriculum/ExamForm";

export default async function EditExamPage({
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
    .select("id, class_id, subject_id, title, exam_date, written_max")
    .eq("id", params.id)
    .single();

  if (error || !exam) notFound();

  let classesQuery = supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  if (profile?.role === "teacher") {
    classesQuery = classesQuery.eq("teacher_id", user.id);
  }

  const [{ data: classes }, { data: subjects }] = await Promise.all([
    classesQuery,
    supabase
      .from("subjects")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/curriculum-assessment/exams/${exam.id}`}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Edit exam</h2>
          <p className="text-muted-foreground">
            Change the details. Marks already entered are kept.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <ExamForm
          classes={classes || []}
          subjects={subjects || []}
          exam={{
            id: exam.id,
            class_id: exam.class_id,
            subject_id: exam.subject_id,
            title: exam.title,
            exam_date: exam.exam_date,
            written_max: Number(exam.written_max),
          }}
        />
      </div>
    </div>
  );
}
