// components/dashboard/CriticalAlerts.tsx
import { createClient } from "@/lib/supabase/server";
import {
  AlertTriangle,
  CreditCard,
  UserX,
  FileText,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default async function CriticalAlerts() {
  const supabase = await createClient();

  // Unpaid Fees (overdue)
  const { count: overdueFeesCount } = await supabase
    .from("fee_invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "overdue");

  // Uncollected Fines
  const { count: pendingFinesCount } = await supabase
    .from("fines")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Low Attendance Students (below 80% in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("status", "active");

  let lowAttendanceCount = 0;

  if (students) {
    for (const student of students) {
      const { count: totalClasses } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("student_id", student.id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

      const { count: presentCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("student_id", student.id)
        .eq("status", "present")
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

      if (totalClasses && totalClasses > 0) {
        const attendanceRate = (presentCount || 0) / totalClasses;
        if (attendanceRate < 0.8) {
          lowAttendanceCount++;
        }
      }
    }
  }

  // Pending Applications
  const currentYear = new Date().getFullYear();
  const { count: pendingApplicationsCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("academic_year", `${currentYear}/${currentYear + 1}`);

  // Upcoming Events (next 7 days)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const { count: upcomingEventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .gte("event_date", new Date().toISOString().split("T")[0])
    .lte("event_date", sevenDaysFromNow.toISOString().split("T")[0]);

  const alerts = [
    {
      id: "overdue_fees",
      title: "Overdue Fees",
      count: overdueFeesCount || 0,
      icon: CreditCard,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      href: "/fees?status=overdue",
      priority: "critical",
    },
    {
      id: "pending_fines",
      title: "Uncollected Fines",
      count: pendingFinesCount || 0,
      icon: AlertTriangle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-200 dark:border-orange-800",
      href: "/fines?status=pending",
      priority: "high",
    },
    {
      id: "low_attendance",
      title: "Low Attendance",
      count: lowAttendanceCount,
      icon: UserX,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      href: "/reports",
      priority: "medium",
    },
    {
      id: "pending_apps",
      title: "Pending Applications",
      count: pendingApplicationsCount || 0,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      href: "/applications?status=pending",
      priority: "normal",
    },
    {
      id: "upcoming_events",
      title: "Events This Week",
      count: upcomingEventsCount || 0,
      icon: Calendar,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      href: "/events",
      priority: "normal",
    },
  ];

  // Filter out alerts with 0 count
  const activeAlerts = alerts.filter((alert) => alert.count > 0);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Critical Alerts</h3>
        {activeAlerts.length > 0 && (
          <span className="px-2 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
            {activeAlerts.length}
          </span>
        )}
      </div>

      {activeAlerts.length > 0 ? (
        <div className="space-y-3">
          {activeAlerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <Link
                key={alert.id}
                href={alert.href}
                className={`flex items-center justify-between p-3 ${alert.bgColor} border ${alert.borderColor} rounded-lg hover:shadow-md transition-all`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${alert.color}`} />
                  <div>
                    <p className={`font-medium text-sm ${alert.color}`}>
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.count} {alert.count === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <span className={`text-xl font-bold ${alert.color}`}>
                  {alert.count}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm font-medium">All Clear!</p>
          <p className="text-xs text-muted-foreground mt-1">
            No critical alerts at the moment
          </p>
        </div>
      )}
    </div>
  );
}
