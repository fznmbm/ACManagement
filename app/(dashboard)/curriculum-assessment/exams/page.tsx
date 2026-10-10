// app/(dashboard)/curriculum-assessment/exams/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import ExamFilters from "@/components/curriculum/ExamFilters";
import ExamsList, { ExamRow } from "@/components/curriculum/ExamsList";

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: {
    class?: string;
    subject?: string;
    from?: string;
    to?: string;
  };
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

  const isTeacher = profile?.role === "teacher";

  // Teachers only see their own classes (and exams within them).
  let classesQuery = supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  if (isTeacher) classesQuery = classesQuery.eq("teacher_id", user.id);

  const [{ data: classes }, { data: subjects }] = await Promise.all([
    classesQuery,
    supabase
      .from("subjects")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  const teacherClassIds = (classes || []).map((c) => c.id);

  // Exams query.
  let examQuery = supabase
    .from("exams")
    .select(
      `
      id, title, exam_date, class_id,
      subjects ( name ),
      classes ( name )
    `,
    )
    .order("exam_date", { ascending: false });

  if (isTeacher) {
    // Restrict to the teacher's classes (empty list → no exams).
    examQuery = examQuery.in(
      "class_id",
      teacherClassIds.length ? teacherClassIds : ["00000000-0000-0000-0000-000000000000"],
    );
  }
  if (searchParams.class) examQuery = examQuery.eq("class_id", searchParams.class);
  if (searchParams.subject)
    examQuery = examQuery.eq("subject_id", searchParams.subject);
  if (searchParams.from) examQuery = examQuery.gte("exam_date", searchParams.from);
  if (searchParams.to) examQuery = examQuery.lte("exam_date", searchParams.to);

  const { data: exams } = await examQuery;

  const examIds = (exams || []).map((e) => e.id);
  const classIds = Array.from(
    new Set((exams || []).map((e) => e.class_id).filter(Boolean) as string[]),
  );

  // Marked counts per exam (one query, tallied here) and class sizes.
  const [{ data: resultRows }, { data: studentRows }] = await Promise.all([
    examIds.length
      ? supabase
          .from("academic_progress")
          .select("exam_id")
          .in("exam_id", examIds)
      : Promise.resolve({ data: [] as { exam_id: string }[] }),
    classIds.length
      ? supabase
          .from("students")
          .select("class_id")
          .eq("status", "active")
          .in("class_id", classIds)
      : Promise.resolve({ data: [] as { class_id: string }[] }),
  ]);

  const markedByExam = new Map<string, number>();
  for (const r of resultRows || []) {
    if (!r.exam_id) continue;
    markedByExam.set(r.exam_id, (markedByExam.get(r.exam_id) || 0) + 1);
  }
  const sizeByClass = new Map<string, number>();
  for (const s of studentRows || []) {
    if (!s.class_id) continue;
    sizeByClass.set(s.class_id, (sizeByClass.get(s.class_id) || 0) + 1);
  }

  const rows: ExamRow[] = (exams || []).map((e) => ({
    id: e.id,
    title: e.title,
    exam_date: e.exam_date,
    subjectName: (e as any).subjects?.name || "—",
    className: (e as any).classes?.name || "—",
    marked: markedByExam.get(e.id) || 0,
    classSize: e.class_id ? sizeByClass.get(e.class_id) || 0 : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Results</h2>
          <p className="text-muted-foreground">
            Exams and the marks for each class.
          </p>
        </div>
        <Link
          href="/curriculum-assessment/exams/new"
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New exam</span>
        </Link>
      </div>

      <ExamFilters classes={classes || []} subjects={subjects || []} />

      <ExamsList exams={rows} />
    </div>
  );
}
