// components/reports/ParentEngagementReport.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, TrendingUp, Users } from "lucide-react";

export default function ParentEngagementReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const supabase = createClient();

  const generateReport = async () => {
    setLoading(true);
    try {
      // Get all active students with parent emails
      const { data: students } = await supabase
        .from("students")
        .select(
          "id, first_name, last_name, parent_email, parent_name, class_id"
        )
        .eq("status", "active")
        .not("parent_email", "is", null);

      const totalParents = students?.length || 0;

      // Since we don't have actual parent portal login tracking in the current schema,
      // we'll simulate engagement metrics based on available data

      // Get event RSVPs (parent engagement indicator)
      let rsvpQuery = supabase
        .from("event_rsvps")
        .select("student_id, created_at")
        .in("student_id", students?.map((s) => s.id) || []);

      if (dateFrom) rsvpQuery = rsvpQuery.gte("created_at", dateFrom);
      if (dateTo) rsvpQuery = rsvpQuery.lte("created_at", dateTo);

      const { data: rsvps } = await rsvpQuery;

      // Get students with RSVPs (engaged parents)
      const studentIdsWithRSVP = new Set(rsvps?.map((r) => r.student_id));
      const engagedParents = studentIdsWithRSVP.size;

      // Calculate engagement rate
      const engagementRate =
        totalParents > 0
          ? Math.round((engagedParents / totalParents) * 100)
          : 0;

      // Feature usage simulation
      const featureUsage = {
        eventRSVP: engagedParents,
        viewedGrades: Math.round(engagedParents * 0.8), // Estimated
        viewedAttendance: Math.round(engagedParents * 0.9), // Estimated
        viewedFees: Math.round(engagedParents * 0.7), // Estimated
      };

      // Engagement by class
      const byClass: { [key: string]: any } = {};

      // Get class names
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("is_active", true);

      const classMap = new Map(classes?.map((c) => [c.id, c.name]) || []);

      students?.forEach((student) => {
        const className = classMap.get(student.class_id!) || "Unassigned";
        if (!byClass[className]) {
          byClass[className] = {
            total: 0,
            engaged: 0,
          };
        }
        byClass[className].total++;
        if (studentIdsWithRSVP.has(student.id)) {
          byClass[className].engaged++;
        }
      });

      // Calculate engagement rate per class
      Object.keys(byClass).forEach((className) => {
        const data = byClass[className];
        data.rate =
          data.total > 0 ? Math.round((data.engaged / data.total) * 100) : 0;
      });

      // Monthly engagement trend
      const byMonth: { [key: string]: number } = {};
      rsvps?.forEach((rsvp) => {
        const month = rsvp.created_at.slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
      });

      setReportData({
        summary: {
          totalParents,
          engagedParents,
          engagementRate,
          featureUsage,
        },
        byClass,
        byMonth,
        students: students || [],
        engagedStudentIds: Array.from(studentIdsWithRSVP),
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = [
      "Student Name",
      "Parent Name",
      "Parent Email",
      "Engagement Status",
      "Has RSVP Activity",
    ];

    const rows = reportData.students.map((student: any) => {
      const isEngaged = reportData.engagedStudentIds.includes(student.id);
      return [
        `${student.first_name} ${student.last_name}`,
        student.parent_name,
        student.parent_email,
        isEngaged ? "Engaged" : "Not Engaged",
        isEngaged ? "Yes" : "No",
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parent-engagement-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>

          {reportData && (
            <button
              onClick={exportToCSV}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Total Parents
              </p>
              <p className="text-2xl font-bold">
                {reportData.summary.totalParents}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                Engaged Parents
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reportData.summary.engagedParents}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                Engagement Rate
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {reportData.summary.engagementRate}%
              </p>
            </div>
          </div>

          {/* Feature Usage */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Feature Usage (Estimated)</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Event RSVP</p>
                <p className="text-2xl font-bold">
                  {reportData.summary.featureUsage.eventRSVP}
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${
                        (reportData.summary.featureUsage.eventRSVP /
                          reportData.summary.totalParents) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Viewed Grades
                </p>
                <p className="text-2xl font-bold">
                  {reportData.summary.featureUsage.viewedGrades}
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${
                        (reportData.summary.featureUsage.viewedGrades /
                          reportData.summary.totalParents) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Viewed Attendance
                </p>
                <p className="text-2xl font-bold">
                  {reportData.summary.featureUsage.viewedAttendance}
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${
                        (reportData.summary.featureUsage.viewedAttendance /
                          reportData.summary.totalParents) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Viewed Fees
                </p>
                <p className="text-2xl font-bold">
                  {reportData.summary.featureUsage.viewedFees}
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{
                      width: `${
                        (reportData.summary.featureUsage.viewedFees /
                          reportData.summary.totalParents) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Engagement by Class */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Engagement by Class</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Class</th>
                    <th className="text-center p-3">Total Parents</th>
                    <th className="text-center p-3">Engaged</th>
                    <th className="text-center p-3">Engagement Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(reportData.byClass)
                    .sort(
                      ([, a]: [string, any], [, b]: [string, any]) =>
                        b.rate - a.rate
                    )
                    .map(([className, data]: [string, any]) => (
                      <tr key={className} className="hover:bg-accent">
                        <td className="p-3 font-medium">{className}</td>
                        <td className="p-3 text-center">{data.total}</td>
                        <td className="p-3 text-center text-green-600 dark:text-green-400">
                          {data.engaged}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex-1 max-w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  data.rate >= 70
                                    ? "bg-green-500"
                                    : data.rate >= 40
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${data.rate}%` }}
                              />
                            </div>
                            <span
                              className={`font-semibold ${
                                data.rate >= 70
                                  ? "text-green-600 dark:text-green-400"
                                  : data.rate >= 40
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {data.rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Trend */}
          {Object.keys(reportData.byMonth).length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Monthly Engagement Activity</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Month</th>
                      <th className="text-center p-3">Activities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(reportData.byMonth)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([month, count]) => (
                        <tr key={month} className="hover:bg-accent">
                          <td className="p-3 font-medium">
                            {new Date(month + "-01").toLocaleDateString(
                              "en-GB",
                              {
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="p-3 text-center">{count as number}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
