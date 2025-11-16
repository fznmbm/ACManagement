// app/(dashboard)/attendance/page.tsx
import { createClient } from "@/lib/supabase/server";
import AttendanceMarkingInterface from "@/components/attendance/AttendanceMarkingInterface";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { class?: string; date?: string };
}) {
  const supabase = await createClient();

  // Get current user and profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get classes based on user role
  let classesQuery = supabase
    .from("classes")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // If teacher (not admin), only show their classes
  if (profile?.role === "teacher") {
    classesQuery = classesQuery.eq("teacher_id", user.id);
  }

  const { data: classes } = await classesQuery;

  // Get selected class (default to first class)
  const selectedClassId = searchParams.class || classes?.[0]?.id;

  // Get selected date (default to today)
  const selectedDate =
    searchParams.date || new Date().toISOString().split("T")[0];

  // Get students for selected class
  let students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }> = [];
  let existingAttendance = [];

  if (selectedClassId) {
    const { data: studentsData } = await supabase
      .from("students")
      .select("id, first_name, last_name, student_number, photo_url")
      .eq("class_id", selectedClassId)
      .eq("status", "active")
      .order("last_name");

    students = studentsData || [];

    // Get existing attendance for this class and date
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", selectedClassId)
      .eq("date", selectedDate);

    existingAttendance = attendanceData || [];
  }

  return (
    <div className="space-y-6">
      {/* Header with History Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mark Attendance</h2>
          <p className="text-muted-foreground">
            Select a class and date to mark or view attendance
          </p>
        </div>
        <Link
          href="/attendance/history"
          className="btn-outline flex items-center space-x-2"
        >
          <BarChart3 className="h-4 w-4" />
          <span>View History</span>
        </Link>
      </div>

      <AttendanceMarkingInterface
        classes={classes || []}
        students={students}
        existingAttendance={existingAttendance}
        selectedClassId={selectedClassId}
        selectedDate={selectedDate}
        userRole={profile?.role || "teacher"}
      />
    </div>
  );
}
