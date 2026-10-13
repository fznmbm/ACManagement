import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import dynamic from "next/dynamic";

// Code-split: only the active tab's report generator is fetched, instead of
// bundling all six into the Reports route.
const loading = () => (
  <div className="py-12 text-center text-sm text-muted-foreground">
    Loading report…
  </div>
);
const AttendanceReportGenerator = dynamic(
  () => import("@/components/reports/AttendanceReportGenerator"),
  { loading },
);
const AcademicReportGenerator = dynamic(
  () => import("@/components/reports/AcademicReportGenerator"),
  { loading },
);
const FeeCollectionReport = dynamic(
  () => import("@/components/reports/FeeCollectionReport"),
  { loading },
);
const StudentReportGenerator = dynamic(
  () => import("@/components/reports/StudentReportGenerator"),
  { loading },
);
const YearEndSummaryReport = dynamic(
  () => import("@/components/reports/YearEndSummaryReport"),
  { loading },
);
const PrayerComplianceReport = dynamic(
  () => import("@/components/reports/PrayerComplianceReport"),
  { loading },
);
const LowAttendanceReportGenerator = dynamic(
  () => import("@/components/reports/LowAttendanceReportGenerator"),
  { loading },
);
const ParentEngagementReport = dynamic(
  () => import("@/components/reports/ParentEngagementReport"),
  { loading },
);
const ApplicationStatsReport = dynamic(
  () => import("@/components/reports/ApplicationStatsReport"),
  { loading },
);

const TABS = [
  { id: "attendance", label: "Attendance" },
  { id: "academic", label: "Academic Progress" },
  { id: "fees", label: "Fee Collection" },
  { id: "student", label: "Student Report" },
  { id: "prayer", label: "Prayer Compliance" },
  { id: "lowattendance", label: "Low Attendance" },
  { id: "engagement", label: "Parent Engagement" },
  { id: "applications", label: "Application Stats" },
  { id: "yearend", label: "Year End Summary" },
] as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["super_admin", "admin", "teacher"].includes(profile?.role || "")) {
    redirect("/dashboard");
  }

  const activeTab = searchParams.tab || "attendance";

  // Fetch shared data needed by multiple reports
  const [{ data: classes }, { data: students }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("students")
      .select("id, first_name, last_name, student_number")
      .eq("status", "active")
      .order("first_name"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate and export reports for attendance, academics, fees and more."
      />

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-0">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={`/reports?tab=${tab.id}`}
              scroll={false}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-card border border-border rounded-lg p-3 md:p-6">
        {activeTab === "attendance" && (
          <AttendanceReportGenerator
            classes={classes || []}
            students={students || []}
          />
        )}
        {activeTab === "academic" && (
          <AcademicReportGenerator
            students={students || []}
            classes={classes || []}
          />
        )}
        {activeTab === "fees" && (
          <FeeCollectionReport
            classes={classes || []}
            students={students || []}
          />
        )}
        {activeTab === "student" && (
          <StudentReportGenerator
            students={students || []}
            classes={classes || []}
          />
        )}
        {activeTab === "prayer" && (
          <PrayerComplianceReport
            classes={classes || []}
            students={students || []}
          />
        )}
        {activeTab === "lowattendance" && (
          <LowAttendanceReportGenerator
            classes={classes || []}
            students={students || []}
          />
        )}
        {activeTab === "engagement" && (
          <ParentEngagementReport classes={classes || []} />
        )}
        {activeTab === "applications" && <ApplicationStatsReport />}
        {activeTab === "yearend" && <YearEndSummaryReport />}
      </div>
    </div>
  );
}
