// app/(dashboard)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  // Get statistics
  const [
    { count: totalStudents },
    { count: totalClasses },
    { count: todayAttendance },
    { data: recentStudents },
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
      .select("*", { count: "exact", head: true })
      .eq("date", new Date().toISOString().split("T")[0])
      .eq("status", "present"),
    supabase
      .from("students")
      .select("id, first_name, last_name, student_number, enrollment_date")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Calculate attendance percentage for today
  const todayDate = new Date().toISOString().split("T")[0];
  const { count: totalTodayRecords } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("date", todayDate);

  const attendancePercentage = totalTodayRecords
    ? Math.round(((todayAttendance || 0) / totalTodayRecords) * 100)
    : 0;

  const stats = [
    {
      name: "Total Students",
      value: totalStudents || 0,
      icon: Users,
      color: "text-blue-600 bg-blue-100",
      href: "/students",
    },
    {
      name: "Active Classes",
      value: totalClasses || 0,
      icon: BookOpen,
      color: "text-green-600 bg-green-100",
      href: "/classes",
    },
    {
      name: "Today Present",
      value: todayAttendance || 0,
      icon: CheckCircle,
      color: "text-purple-600 bg-purple-100",
      href: "/attendance",
    },
    {
      name: "Attendance Rate",
      value: `${attendancePercentage}%`,
      icon: TrendingUp,
      color: "text-orange-600 bg-orange-100",
      href: "/reports",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">
          Welcome back, {profile?.full_name}!
        </h2>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your madrasa today.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/attendance" className="btn-primary">
            Mark Attendance
          </Link>
          <Link href="/students?action=new" className="btn-secondary">
            Add New Student
          </Link>
          <Link href="/reports" className="btn-outline">
            Generate Report
          </Link>
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recently Added Students</h3>
          <Link
            href="/students"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {recentStudents && recentStudents.length > 0 ? (
          <div className="space-y-3">
            {recentStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-medium">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Student #: {student.student_number}
                  </p>
                </div>
                <Link
                  href={`/students/${student.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No students found. Add your first student to get started.
          </p>
        )}
      </div>
    </div>
  );
}
