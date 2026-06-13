import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AttendanceReportGenerator from "@/components/reports/AttendanceReportGenerator";
import AcademicReportGenerator from "@/components/reports/AcademicReportGenerator";
import FeeCollectionReport from "@/components/reports/FeeCollectionReport";
import StudentReportGenerator from "@/components/reports/StudentReportGenerator";
import YearEndSummaryReport from "@/components/reports/YearEndSummaryReport";
import PrayerComplianceReport from "@/components/reports/PrayerComplianceReport";

const TABS = [
  { id: "attendance", label: "Attendance" },
  { id: "academic", label: "Academic Progress" },
  { id: "fees", label: "Fee Collection" },
  { id: "student", label: "Student Report" },
  { id: "prayer", label: "Prayer Compliance" },
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
      .order("last_name"),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-muted-foreground">
          Generate and export reports for attendance, academics, fees and more
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-0">
          {TABS.map((tab) => (
            <a
              key={tab.id}
              href={`/reports?tab=${tab.id}`}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.label}
            </a>
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
        {activeTab === "yearend" && <YearEndSummaryReport />}
      </div>
    </div>
  );
}
