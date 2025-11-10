// app/(dashboard)/attendance/history/page.tsx
import { createClient } from "@/lib/supabase/server";
import AttendanceHistoryTable from "@/components/attendance/AttendanceHistoryTable";
import AttendanceFilters from "@/components/attendance/AttendanceFilters";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: {
    class?: string;
    student?: string;
    from?: string;
    to?: string;
    status?: string;
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

  // Get classes
  let classesQuery = supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (profile?.role === "teacher") {
    classesQuery = classesQuery.eq("teacher_id", user.id);
  }

  const { data: classes } = await classesQuery;

  // Get students for filter
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_number")
    .eq("status", "active")
    .order("last_name");

  // Build attendance query
  let query = supabase
    .from("attendance")
    .select(
      `
      *,
      students (
        id,
        first_name,
        last_name,
        student_number
      ),
      classes (
        id,
        name
      )
    `
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  // Apply filters
  if (searchParams.class) {
    query = query.eq("class_id", searchParams.class);
  }

  if (searchParams.student) {
    query = query.eq("student_id", searchParams.student);
  }

  if (searchParams.from) {
    query = query.gte("date", searchParams.from);
  }

  if (searchParams.to) {
    query = query.lte("date", searchParams.to);
  }

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  // Limit results
  query = query.limit(100);

  const { data: attendanceRecords } = await query;

  // Calculate statistics
  const total = attendanceRecords?.length || 0;
  const present =
    attendanceRecords?.filter((a) => a.status === "present").length || 0;
  const absent =
    attendanceRecords?.filter((a) => a.status === "absent").length || 0;
  const late =
    attendanceRecords?.filter((a) => a.status === "late").length || 0;
  const excused =
    attendanceRecords?.filter((a) => a.status === "excused").length || 0;

  const stats = { total, present, absent, late, excused };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance History</h2>
          <p className="text-muted-foreground">
            View and analyze attendance records
          </p>
        </div>
        <Link
          href="/attendance"
          className="btn-outline flex items-center space-x-2"
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>Mark Attendance</span>
        </Link>
      </div>

      <AttendanceFilters classes={classes || []} students={students || []} />

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Records</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Present</p>
          <p className="text-2xl font-bold text-green-700">
            {stats.present} (
            {total > 0 ? Math.round((present / total) * 100) : 0}%)
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Absent</p>
          <p className="text-2xl font-bold text-red-700">
            {stats.absent} ({total > 0 ? Math.round((absent / total) * 100) : 0}
            %)
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">Late</p>
          <p className="text-2xl font-bold text-orange-700">
            {stats.late} ({total > 0 ? Math.round((late / total) * 100) : 0}%)
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Excused</p>
          <p className="text-2xl font-bold text-blue-700">
            {stats.excused} (
            {total > 0 ? Math.round((excused / total) * 100) : 0}%)
          </p>
        </div>
      </div>

      <AttendanceHistoryTable records={attendanceRecords || []} />
    </div>
  );
}
