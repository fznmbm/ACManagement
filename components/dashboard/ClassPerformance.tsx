// components/dashboard/ClassPerformance.tsx
import { createClient } from "@/lib/supabase/server";
import { TrendingUp, TrendingDown, Users, Award } from "lucide-react";
import Link from "next/link";

export default async function ClassPerformance() {
  const supabase = await createClient();

  // Get all active classes
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (!classes || classes.length === 0) {
    return null; // Don't render if no classes
  }

  // Calculate metrics for each class
  const classMetrics = await Promise.all(
    classes.map(async (classItem) => {
      // Student count
      const { count: studentCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classItem.id)
        .eq("status", "active");

      // Attendance rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: totalAttendance } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classItem.id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

      const { count: presentCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classItem.id)
        .eq("status", "present")
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

      const attendanceRate =
        totalAttendance && totalAttendance > 0
          ? Math.round((presentCount! / totalAttendance) * 100)
          : 0;

      // Average grade (all subjects)
      const { data: grades } = await supabase
        .from("academic_progress")
        .select("percentage")
        .in(
          "student_id",
          (
            await supabase
              .from("students")
              .select("id")
              .eq("class_id", classItem.id)
              .eq("status", "active")
          ).data?.map((s) => s.id) || []
        );

      const avgGrade =
        grades && grades.length > 0
          ? Math.round(
              grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length
            )
          : 0;

      return {
        id: classItem.id,
        name: classItem.name,
        studentCount: studentCount || 0,
        attendanceRate,
        avgGrade,
      };
    })
  );

  // Sort by attendance rate (best performing first)
  const sortedClasses = classMetrics
    .filter((c) => c.studentCount > 0) // Only show classes with students
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 5); // Show top 5

  if (sortedClasses.length === 0) {
    return null; // Don't render if no classes with students
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Class Performance</h3>
        <Link href="/classes" className="text-sm text-primary hover:underline">
          View All →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-semibold">Class</th>
              <th className="text-center py-3 px-2 font-semibold">Students</th>
              <th className="text-center py-3 px-2 font-semibold">
                Attendance
              </th>
              <th className="text-center py-3 px-2 font-semibold">Avg Grade</th>
              <th className="text-center py-3 px-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedClasses.map((classItem, index) => {
              const isTopPerformer = index === 0;
              const attendanceStatus =
                classItem.attendanceRate >= 90
                  ? "excellent"
                  : classItem.attendanceRate >= 75
                  ? "good"
                  : "needs-improvement";

              return (
                <tr
                  key={classItem.id}
                  className="hover:bg-accent transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {isTopPerformer && (
                        <Award className="h-4 w-4 text-yellow-500" />
                      )}
                      <Link
                        href={`/classes/${classItem.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {classItem.name}
                      </Link>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{classItem.studentCount}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className={`font-semibold ${
                          attendanceStatus === "excellent"
                            ? "text-green-600 dark:text-green-400"
                            : attendanceStatus === "good"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-orange-600 dark:text-orange-400"
                        }`}
                      >
                        {classItem.attendanceRate}%
                      </span>
                      {attendanceStatus === "excellent" ? (
                        <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : attendanceStatus === "needs-improvement" ? (
                        <TrendingDown className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`font-semibold ${
                        classItem.avgGrade >= 80
                          ? "text-green-600 dark:text-green-400"
                          : classItem.avgGrade >= 60
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {classItem.avgGrade > 0
                        ? `${classItem.avgGrade}%`
                        : "N/A"}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        attendanceStatus === "excellent"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : attendanceStatus === "good"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                      }`}
                    >
                      {attendanceStatus === "excellent"
                        ? "Excellent"
                        : attendanceStatus === "good"
                        ? "Good"
                        : "Fair"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center">
        Performance based on last 30 days
      </div>
    </div>
  );
}
