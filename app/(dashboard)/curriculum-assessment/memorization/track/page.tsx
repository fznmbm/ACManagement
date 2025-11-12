// app/(dashboard)/curriculum-assessment/memorization/track/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentMemorizationTracker from "@/components/curriculum/StudentMemorizationTracker";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TrackMemorizationPage({
  searchParams,
}: {
  searchParams: { student?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get all students
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_number")
    .eq("status", "active")
    .order("last_name");

  // Get all memorization items
  const { data: items } = await supabase
    .from("memorization_items")
    .select("*")
    .order("sequence_order");

  // If student is selected, get their progress
  let studentProgress = null;
  if (searchParams.student) {
    const { data } = await supabase
      .from("student_memorization")
      .select("*")
      .eq("student_id", searchParams.student);

    studentProgress = data;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/curriculum-assessment/memorization"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Track Student Memorization</h2>
          <p className="text-muted-foreground">
            Update student progress on memorization items
          </p>
        </div>
      </div>

      <StudentMemorizationTracker
        students={students || []}
        items={items || []}
        studentProgress={studentProgress || []}
        selectedStudentId={searchParams.student}
      />
    </div>
  );
}
