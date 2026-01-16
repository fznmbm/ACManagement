// components/reports/ApplicationStatsReport.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Filter, TrendingUp } from "lucide-react";

export default function ApplicationStatsReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [academicYear, setAcademicYear] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const supabase = createClient();

  const generateReport = async () => {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (academicYear) {
        query = query.eq("academic_year", academicYear);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: applications, error } = await query;

      if (error) throw error;

      // Calculate metrics
      const totalApplications = applications?.length || 0;
      const pendingCount =
        applications?.filter((a) => a.status === "pending").length || 0;
      const underReviewCount =
        applications?.filter((a) => a.status === "under_review").length || 0;
      const acceptedCount =
        applications?.filter((a) => a.status === "accepted").length || 0;
      const rejectedCount =
        applications?.filter((a) => a.status === "rejected").length || 0;

      const acceptanceRate =
        totalApplications > 0
          ? Math.round((acceptedCount / totalApplications) * 100)
          : 0;

      // Calculate average processing time (for processed applications)
      const processedApps = applications?.filter(
        (a) => a.status === "accepted" || a.status === "rejected"
      );
      let avgProcessingDays = 0;
      if (processedApps && processedApps.length > 0) {
        const totalDays = processedApps.reduce((sum, app) => {
          const created = new Date(app.created_at);
          const updated = new Date(app.updated_at);
          const days = Math.floor(
            (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0);
        avgProcessingDays = Math.round(totalDays / processedApps.length);
      }

      // Group by month
      const byMonth: { [key: string]: any } = {};
      applications?.forEach((app) => {
        const month = app.created_at.slice(0, 7); // YYYY-MM
        if (!byMonth[month]) {
          byMonth[month] = {
            total: 0,
            pending: 0,
            accepted: 0,
            rejected: 0,
          };
        }
        byMonth[month].total++;
        if (app.status === "pending") byMonth[month].pending++;
        if (app.status === "accepted") byMonth[month].accepted++;
        if (app.status === "rejected") byMonth[month].rejected++;
      });

      // Group by academic year
      const byYear: { [key: string]: any } = {};
      applications?.forEach((app) => {
        const year = app.academic_year;
        if (!byYear[year]) {
          byYear[year] = {
            total: 0,
            pending: 0,
            accepted: 0,
            rejected: 0,
          };
        }
        byYear[year].total++;
        if (app.status === "pending") byYear[year].pending++;
        if (app.status === "accepted") byYear[year].accepted++;
        if (app.status === "rejected") byYear[year].rejected++;
      });

      // Age distribution
      const ageGroups: { [key: string]: number } = {
        "5-7": 0,
        "8-10": 0,
        "11-13": 0,
        "14-16": 0,
      };
      applications?.forEach((app) => {
        const age = app.student_age;
        if (age >= 5 && age <= 7) ageGroups["5-7"]++;
        else if (age >= 8 && age <= 10) ageGroups["8-10"]++;
        else if (age >= 11 && age <= 13) ageGroups["11-13"]++;
        else if (age >= 14 && age <= 16) ageGroups["14-16"]++;
      });

      setReportData({
        applications: applications || [],
        summary: {
          totalApplications,
          pendingCount,
          underReviewCount,
          acceptedCount,
          rejectedCount,
          acceptanceRate,
          avgProcessingDays,
        },
        byMonth,
        byYear,
        ageGroups,
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
      "Application ID",
      "Student Name",
      "Age",
      "Parent Name",
      "Parent Email",
      "Parent Phone",
      "Academic Year",
      "Status",
      "Submitted Date",
      "Processing Days",
    ];

    const rows = reportData.applications.map((app: any) => {
      const created = new Date(app.created_at);
      const updated = new Date(app.updated_at);
      const processingDays = Math.floor(
        (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      );

      return [
        app.id.slice(0, 8),
        app.student_name,
        app.student_age,
        app.parent_name,
        app.parent_email,
        app.parent_phone,
        app.academic_year,
        app.status,
        new Date(app.created_at).toLocaleDateString(),
        processingDays,
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
    a.download = `application-stats-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  // Generate academic year options
  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 2}/${currentYear - 1}`,
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4" />
          <h4 className="font-semibold">Filters</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Academic Year
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="">All Years</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Total Applications
              </p>
              <p className="text-2xl font-bold">
                {reportData.summary.totalApplications}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Acceptance Rate
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reportData.summary.acceptanceRate}%
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Avg Processing Time
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {reportData.summary.avgProcessingDays} days
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {reportData.summary.pendingCount}
              </p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {reportData.summary.pendingCount}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                Under Review
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {reportData.summary.underReviewCount}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                Accepted
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {reportData.summary.acceptedCount}
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300 mb-1">
                Rejected
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {reportData.summary.rejectedCount}
              </p>
            </div>
          </div>

          {/* Age Distribution */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Age Distribution</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(reportData.ageGroups).map(([age, count]) => (
                <div
                  key={age}
                  className="text-center p-4 bg-muted/30 rounded-lg"
                >
                  <p className="text-sm text-muted-foreground mb-1">
                    Age {age}
                  </p>
                  <p className="text-2xl font-bold">{count as number}</p>
                </div>
              ))}
            </div>
          </div>

          {/* By Academic Year */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">By Academic Year</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Academic Year</th>
                    <th className="text-center p-3">Total</th>
                    <th className="text-center p-3">Pending</th>
                    <th className="text-center p-3">Accepted</th>
                    <th className="text-center p-3">Rejected</th>
                    <th className="text-center p-3">Acceptance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(reportData.byYear)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([year, data]: [string, any]) => {
                      const rate =
                        data.total > 0
                          ? Math.round((data.accepted / data.total) * 100)
                          : 0;
                      return (
                        <tr key={year} className="hover:bg-accent">
                          <td className="p-3 font-medium">{year}</td>
                          <td className="p-3 text-center">{data.total}</td>
                          <td className="p-3 text-center text-yellow-600 dark:text-yellow-400">
                            {data.pending}
                          </td>
                          <td className="p-3 text-center text-green-600 dark:text-green-400">
                            {data.accepted}
                          </td>
                          <td className="p-3 text-center text-red-600 dark:text-red-400">
                            {data.rejected}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                rate >= 80
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : rate >= 60
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                              }`}
                            >
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Monthly Application Trend</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Month</th>
                    <th className="text-center p-3">Total</th>
                    <th className="text-center p-3">Pending</th>
                    <th className="text-center p-3">Accepted</th>
                    <th className="text-center p-3">Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(reportData.byMonth)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([month, data]: [string, any]) => (
                      <tr key={month} className="hover:bg-accent">
                        <td className="p-3 font-medium">
                          {new Date(month + "-01").toLocaleDateString("en-GB", {
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3 text-center">{data.total}</td>
                        <td className="p-3 text-center text-yellow-600 dark:text-yellow-400">
                          {data.pending}
                        </td>
                        <td className="p-3 text-center text-green-600 dark:text-green-400">
                          {data.accepted}
                        </td>
                        <td className="p-3 text-center text-red-600 dark:text-red-400">
                          {data.rejected}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
