// app/(dashboard)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  Users,
  BookOpen,
  CheckCircle,
  TrendingUp,
  FileText,
  CreditCard,
  AlertCircle,
  Calendar,
  DollarSign,
  Award,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import CriticalAlerts from "@/components/dashboard/CriticalAlerts";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ClassPerformance from "@/components/dashboard/ClassPerformance";

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

  // ==================================================
  // BASIC STATISTICS
  // ==================================================
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

  // ==================================================
  // NEW STATISTICS (Financial, Applications, Events, Fines)
  // ==================================================

  // Pending Applications (current year)
  const currentYear = new Date().getFullYear();
  const { count: pendingApplications } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("academic_year", `${currentYear}/${currentYear + 1}`);

  // Outstanding Fees
  const { data: outstandingInvoices } = await supabase
    .from("fee_invoices")
    .select("amount_due, amount_paid")
    .in("status", ["pending", "partial", "overdue"]);

  const outstandingFees =
    outstandingInvoices?.reduce(
      (sum, inv) => sum + (inv.amount_due - inv.amount_paid),
      0
    ) || 0;

  // Active (Uncollected) Fines
  const { data: activeFines } = await supabase
    .from("fines")
    .select("amount")
    .eq("status", "pending");

  const activeFinesAmount =
    activeFines?.reduce((sum, fine) => sum + fine.amount, 0) || 0;

  // Upcoming Events (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { count: upcomingEventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .gte("event_date", new Date().toISOString().split("T")[0])
    .lte("event_date", thirtyDaysFromNow.toISOString().split("T")[0]);

  // ==================================================
  // STATS CARDS CONFIGURATION
  // ==================================================
  const stats = [
    {
      name: "Total Students",
      value: totalStudents || 0,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      hoverBorderColor: "hover:border-blue-600 dark:hover:border-blue-400",
      href: "/students",
    },
    {
      name: "Active Classes",
      value: totalClasses || 0,
      icon: BookOpen,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      hoverBorderColor: "hover:border-green-600 dark:hover:border-green-400",
      href: "/classes",
    },
    {
      name: "Today Present",
      value: todayAttendance || 0,
      icon: CheckCircle,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      hoverBorderColor: "hover:border-purple-600 dark:hover:border-purple-400",
      href: "/attendance",
    },
    {
      name: "Attendance Rate",
      value: `${attendancePercentage}%`,
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      hoverBorderColor: "hover:border-orange-600 dark:hover:border-orange-400",
      href: "/reports",
    },
    {
      name: "Pending Applications",
      value: pendingApplications || 0,
      icon: FileText,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
      hoverBorderColor: "hover:border-indigo-600 dark:hover:border-indigo-400",
      href: "/applications",
    },
    {
      name: "Outstanding Fees",
      value: `£${outstandingFees.toFixed(2)}`,
      icon: CreditCard,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      hoverBorderColor: "hover:border-red-600 dark:hover:border-red-400",
      href: "/fees",
    },
    {
      name: "Active Fines",
      value: `£${activeFinesAmount.toFixed(2)}`,
      icon: AlertCircle,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      hoverBorderColor: "hover:border-yellow-600 dark:hover:border-yellow-400",
      href: "/fines",
    },
    {
      name: "Upcoming Events",
      value: upcomingEventsCount || 0,
      icon: Calendar,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
      hoverBorderColor: "hover:border-pink-600 dark:hover:border-pink-400",
      href: "/events",
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
          Here's what's happening with your centre today.
        </p>
      </div>

      {/* Statistics Cards - 8 cards in 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className={`bg-card border-2 border-border rounded-lg p-5 hover:shadow-lg transition-all duration-200 ${stat.hoverBorderColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Overview */}
          <FinancialOverview />

          {/* Upcoming Events */}
          <UpcomingEvents />

          {/* Recent Activity */}
          <RecentActivity />

          {/* Class Performance */}
          <ClassPerformance />
        </div>

        {/* Right Column - 1/3 width - Sidebar */}
        <div className="space-y-6">
          {/* Critical Alerts */}
          <CriticalAlerts />

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/attendance"
                className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <span>Mark Attendance</span>
                <CheckCircle className="h-5 w-5" />
              </Link>
              <Link
                href="/students/new"
                className="flex items-center justify-between px-4 py-3 bg-background border-2 border-border rounded-lg font-medium hover:border-primary hover:bg-accent transition-colors"
              >
                <span>Add New Student</span>
                <UserPlus className="h-5 w-5" />
              </Link>
              <Link
                href="/fees"
                className="flex items-center justify-between px-4 py-3 bg-background border-2 border-border rounded-lg font-medium hover:border-primary hover:bg-accent transition-colors"
              >
                <span>Collect Fee</span>
                <DollarSign className="h-5 w-5" />
              </Link>
              <Link
                href="/messages"
                className="flex items-center justify-between px-4 py-3 bg-background border-2 border-border rounded-lg font-medium hover:border-primary hover:bg-accent transition-colors"
              >
                <span>Send Message</span>
                <MessageSquare className="h-5 w-5" />
              </Link>
              <Link
                href="/events"
                className="flex items-center justify-between px-4 py-3 bg-background border-2 border-border rounded-lg font-medium hover:border-primary hover:bg-accent transition-colors"
              >
                <span>Create Event</span>
                <Calendar className="h-5 w-5" />
              </Link>
              <Link
                href="/reports"
                className="flex items-center justify-between px-4 py-3 bg-background border-2 border-border rounded-lg font-medium hover:border-primary hover:bg-accent transition-colors"
              >
                <span>Generate Report</span>
                <FileText className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Recent Students */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Students</h3>
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
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{student.student_number}
                      </p>
                    </div>
                    <Award className="h-4 w-4 text-primary" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No students found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
