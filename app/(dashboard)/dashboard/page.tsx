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
  PoundSterling,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import { latestClassDay } from "@/lib/utils/classDay";
import AlertsDashboard from "@/components/alerts/AlertsDashboard";
import RegistersBoard from "@/components/attendance/RegistersBoard";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ClassPerformance from "@/components/dashboard/ClassPerformance";

const QUICK_ACTIONS = [
  { label: "Mark attendance", href: "/attendance", icon: CheckCircle },
  { label: "Add student", href: "/students/new", icon: UserPlus },
  { label: "Collect fee", href: "/fees", icon: PoundSterling },
  { label: "Send update", href: "/send-update", icon: MessageSquare },
  { label: "Create event", href: "/events", icon: Calendar },
  { label: "Reports", href: "/reports", icon: FileText },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const todayDate = latestClassDay();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const todayStr = new Date().toISOString().split("T")[0];

  // Basic stats — one batch.
  const [
    { count: totalStudents },
    { count: totalClasses },
    { count: todayAttendance },
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
      .eq("date", todayDate)
      .eq("status", "present"),
  ]);

  // Financial / events / attendance totals + the active app year — one batch.
  const [
    { count: totalTodayRecords },
    { data: outstandingInvoices },
    { data: activeFines },
    { count: upcomingEventsCount },
    { data: activeAppYear },
  ] = await Promise.all([
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", todayDate),
    supabase
      .from("fee_invoices")
      .select("amount_due, amount_paid")
      .in("status", ["pending", "partial", "overdue"]),
    supabase.from("fines").select("amount").eq("status", "pending"),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("event_date", todayStr)
      .lte("event_date", thirtyDaysFromNow.toISOString().split("T")[0]),
    supabase
      .from("application_settings")
      .select("academic_year")
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  // Pending applications — depends on the active year, so it runs after.
  let pendingAppQuery = supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (activeAppYear?.academic_year) {
    pendingAppQuery = pendingAppQuery.eq(
      "academic_year",
      activeAppYear.academic_year,
    );
  }
  const { count: pendingApplications } = await pendingAppQuery;

  const attendancePercentage = totalTodayRecords
    ? Math.round(((todayAttendance || 0) / totalTodayRecords) * 100)
    : 0;
  const outstandingFees =
    outstandingInvoices?.reduce(
      (sum, inv) => sum + (inv.amount_due - inv.amount_paid),
      0,
    ) || 0;
  const activeFinesAmount =
    activeFines?.reduce((sum, fine) => sum + fine.amount, 0) || 0;

  // Decorative tiles share the brand treatment; colour is kept only where it
  // carries meaning (money owed = attention).
  const brand = {
    color: "text-primary",
    bgColor: "bg-primary/10",
  };
  const stats = [
    {
      name: "Total Students",
      value: totalStudents || 0,
      icon: Users,
      ...brand,
      href: "/students",
    },
    {
      name: "Active Classes",
      value: totalClasses || 0,
      icon: BookOpen,
      ...brand,
      href: "/classes",
    },
    {
      name: "Present (last session)",
      value: todayAttendance || 0,
      icon: CheckCircle,
      ...brand,
      href: "/attendance",
    },
    {
      name: "Attendance Rate",
      value: `${attendancePercentage}%`,
      icon: TrendingUp,
      ...brand,
      href: "/reports",
    },
    {
      name: "Pending Applications",
      value: pendingApplications || 0,
      icon: FileText,
      ...brand,
      href: "/applications",
    },
    {
      name: "Outstanding Fees",
      value: `£${outstandingFees.toFixed(2)}`,
      icon: PoundSterling,
      color: "text-danger",
      bgColor: "bg-danger/10",
      href: "/fees",
    },
    {
      name: "Active Fines",
      value: `£${activeFinesAmount.toFixed(2)}`,
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
      href: "/fines",
    },
    {
      name: "Upcoming Events",
      value: upcomingEventsCount || 0,
      icon: Calendar,
      ...brand,
      href: "/events",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-foreground md:text-3xl">
          Welcome back, {profile?.full_name}!
        </h2>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your centre.
        </p>
      </div>

      {/* Quick actions — now at the top */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{a.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Registers board — who still owes a register for the latest class day */}
      <RegistersBoard />

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FinancialOverview />
          <UpcomingEvents />
          <RecentActivity />
          <ClassPerformance />
        </div>
        <div className="space-y-6">
          <AlertsDashboard compact={true} />
        </div>
      </div>
    </div>
  );
}
