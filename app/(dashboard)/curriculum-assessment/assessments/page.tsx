// app/(dashboard)/curriculum-assessment/assessments/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssessmentsList from "@/components/curriculum/AssessmentsList";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: {
    student?: string;
    subject?: string;
    type?: string;
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
    .select("*")
    .eq("id", user.id)
    .single();

  // Build query
  let query = supabase
    .from("academic_progress")
    .select(
      `
      *,
      students (
        id,
        first_name,
        last_name,
        student_number
      ),
      subjects (
        id,
        name
      )
    `
    )
    .order("assessment_date", { ascending: false });

  // Apply filters
  if (searchParams.student) {
    query = query.eq("student_id", searchParams.student);
  }

  if (searchParams.subject) {
    query = query.eq("subject_id", searchParams.subject);
  }

  if (searchParams.type) {
    query = query.eq("assessment_type", searchParams.type);
  }

  if (searchParams.from) {
    query = query.gte("assessment_date", searchParams.from);
  }

  if (searchParams.to) {
    query = query.lte("assessment_date", searchParams.to);
  }

  const { data: assessments, error } = await query;

  if (error) {
    console.error("Error fetching assessments:", error);
  }

  // Get students for filter dropdown
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_number")
    .eq("status", "active")
    .order("last_name");

  // Get subjects for filter dropdown
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assessments</h2>
          <p className="text-muted-foreground">
            View and manage student assessments
          </p>
        </div>
        <Link
          href="/curriculum-assessment/assessments/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Record Assessment</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <form method="GET" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <select
              name="student"
              defaultValue={searchParams.student}
              className="form-input"
            >
              <option value="">All Students</option>
              {students?.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} (#
                  {student.student_number})
                </option>
              ))}
            </select>

            <select
              name="subject"
              defaultValue={searchParams.subject}
              className="form-input"
            >
              <option value="">All Subjects</option>
              {subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              name="type"
              defaultValue={searchParams.type}
              className="form-input"
            >
              <option value="">All Types</option>
              <option value="test">Test</option>
              <option value="quiz">Quiz</option>
              <option value="homework">Homework</option>
              <option value="oral_test">Oral Test</option>
            </select>

            <input
              type="date"
              name="from"
              defaultValue={searchParams.from}
              placeholder="From date"
              className="form-input"
            />

            <input
              type="date"
              name="to"
              defaultValue={searchParams.to}
              placeholder="To date"
              className="form-input"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button type="submit" className="btn-primary">
              Apply Filters
            </button>
            {(searchParams.student ||
              searchParams.subject ||
              searchParams.type ||
              searchParams.from ||
              searchParams.to) && (
              <Link
                href="/curriculum-assessment/assessments"
                className="btn-outline"
              >
                Clear Filters
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Assessments List */}
      <AssessmentsList assessments={assessments || []} />
    </div>
  );
}
