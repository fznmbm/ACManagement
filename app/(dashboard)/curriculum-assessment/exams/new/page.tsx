// app/(dashboard)/curriculum-assessment/exams/new/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ExamForm from "@/components/curriculum/ExamForm";

export default async function NewExamPage({
  searchParams,
}: {
  searchParams: { class?: string };
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

  // Teachers see only their own classes; admins see all active classes.
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
          href="/curriculum-assessment/exams"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">New exam</h2>
          <p className="text-muted-foreground">
            Set it up once, then enter the whole class&apos;s marks on one
            screen.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <ExamForm
          classes={classes || []}
          subjects={subjects || []}
          preSelectedClass={searchParams.class}
        />
      </div>
    </div>
  );
}
