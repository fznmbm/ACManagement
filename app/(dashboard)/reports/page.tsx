// app/(dashboard)/reports/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReportsDashboard from "@/components/reports/ReportsDashboard";

export default async function ReportsPage() {
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

  // Get classes for filters
  let classesQuery = supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (profile?.role === "teacher") {
    classesQuery = classesQuery.eq("teacher_id", user.id);
  }

  const { data: classes } = await classesQuery;

  // Get students for filters
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_number")
    .eq("status", "active")
    .order("last_name");

  // Get some summary statistics
  const [
    { count: totalStudents },
    { count: totalClasses },
    { data: recentAttendance },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("attendance")
      .select("date")
      .order("date", { ascending: false })
      .limit(1),
  ]);

  const stats = {
    totalStudents: totalStudents || 0,
    totalClasses: totalClasses || 0,
    lastAttendanceDate: recentAttendance?.[0]?.date || null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-muted-foreground">
          Generate and export attendance and progress reports
        </p>
      </div>

      <ReportsDashboard
        classes={classes || []}
        students={students || []}
        stats={stats}
        userRole={profile?.role || "teacher"}
      />
    </div>
  );
}
