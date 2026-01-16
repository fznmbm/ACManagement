// components/reports/YearEndSummaryReport.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Award, TrendingUp } from "lucide-react";

export default function YearEndSummaryReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  const supabase = createClient();

  const generateReport = async () => {
    setLoading(true);
    try {
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;

      // Student metrics
      const { count: totalStudents } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .gte("enrollment_date", yearStart)
        .lte("enrollment_date", yearEnd);

      const { count: activeStudents } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: graduatedStudents } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "graduated");

      // Attendance metrics
      const { count: totalAttendanceRecords } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .gte("date", yearStart)
        .lte("date", yearEnd);

      const { count: presentCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .gte("date", yearStart)
        .lte("date", yearEnd)
        .eq("status", "present");

      const attendanceRate =
        totalAttendanceRecords && totalAttendanceRecords > 0
          ? Math.round((presentCount! / totalAttendanceRecords) * 100)
          : 0;

      // Financial metrics
      const { data: invoices } = await supabase
        .from("fee_invoices")
        .select("amount_due, amount_paid")
        .gte("generated_date", yearStart)
        .lte("generated_date", yearEnd);

      const { data: fines } = await supabase
        .from("fines")
        .select("amount, status")
        .gte("issued_date", yearStart)
        .lte("issued_date", yearEnd);

      const feeRevenue =
        invoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;
      const fineRevenue =
        fines
          ?.filter((f) => f.status === "paid")
          .reduce((sum, f) => sum + f.amount, 0) || 0;
      const totalRevenue = feeRevenue + fineRevenue;

      // Certificates issued
      const { count: certificatesIssued } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .gte("issued_date", yearStart)
        .lte("issued_date", yearEnd);

      // Events hosted
      const { count: eventsHosted } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("event_date", yearStart)
        .lte("event_date", yearEnd);

      // Academic performance
      const { data: grades } = await supabase
        .from("academic_progress")
        .select("percentage")
        .gte("assessment_date", yearStart)
        .lte("assessment_date", yearEnd);

      const avgGrade =
        grades && grades.length > 0
          ? Math.round(
              grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length
            )
          : 0;

      // Memorization progress
      const { count: totalMemorizationItems } = await supabase
        .from("student_memorization")
        .select("*", { count: "exact", head: true })
        .in("progress_stage", ["memorized", "mastered"]);

      // Top performing students (by average grade)
      const { data: allGrades } = await supabase
        .from("academic_progress")
        .select(
          `
          percentage,
          students (
            id,
            first_name,
            last_name,
            student_number
          )
        `
        )
        .gte("assessment_date", yearStart)
        .lte("assessment_date", yearEnd);

      // Calculate average per student
      const studentGrades: {
        [key: string]: { name: string; number: string; grades: number[] };
      } = {};
      allGrades?.forEach((grade: any) => {
        const studentId = grade.students?.id;
        if (studentId) {
          if (!studentGrades[studentId]) {
            studentGrades[studentId] = {
              name: `${grade.students.first_name} ${grade.students.last_name}`,
              number: grade.students.student_number,
              grades: [],
            };
          }
          studentGrades[studentId].grades.push(grade.percentage);
        }
      });

      const topStudents = Object.entries(studentGrades)
        .map(([id, data]) => ({
          id,
          name: data.name,
          number: data.number,
          avgGrade: Math.round(
            data.grades.reduce((sum, g) => sum + g, 0) / data.grades.length
          ),
        }))
        .sort((a, b) => b.avgGrade - a.avgGrade)
        .slice(0, 10);

      // Monthly breakdown
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const monthlyStats = months.map((month, index) => {
        const monthNum = String(index + 1).padStart(2, "0");
        const monthStart = `${selectedYear}-${monthNum}-01`;
        const nextMonth =
          index === 11
            ? `${parseInt(selectedYear) + 1}-01-01`
            : `${selectedYear}-${String(index + 2).padStart(2, "0")}-01`;

        // Count enrollments for this month
        const enrollments =
          allGrades?.filter((g: any) => {
            const date = g.students?.enrollment_date;
            return date >= monthStart && date < nextMonth;
          }).length || 0;

        return {
          month,
          enrollments,
        };
      });

      setReportData({
        year: selectedYear,
        students: {
          enrolled: totalStudents || 0,
          active: activeStudents || 0,
          graduated: graduatedStudents || 0,
        },
        attendance: {
          totalRecords: totalAttendanceRecords || 0,
          rate: attendanceRate,
        },
        financial: {
          feeRevenue,
          fineRevenue,
          totalRevenue,
        },
        academic: {
          avgGrade,
          certificatesIssued: certificatesIssued || 0,
          topStudents,
        },
        activities: {
          eventsHosted: eventsHosted || 0,
          memorizationItems: totalMemorizationItems || 0,
        },
        monthlyStats,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    alert("PDF export feature coming soon!");
    // This would require a PDF generation library like jsPDF or pdfmake
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const years = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
  ];

  return (
    <div className="space-y-6">
      {/* Year Selection */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
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
              onClick={exportToPDF}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 rounded-lg p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Year-End Summary Report</h2>
            </div>
            <p className="text-xl text-muted-foreground">{reportData.year}</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Students Enrolled
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {reportData.students.enrolled}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Attendance Rate
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {reportData.attendance.rate}%
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                £{reportData.financial.totalRevenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Certificates Issued
              </p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {reportData.academic.certificatesIssued}
              </p>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Stats */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold mb-4">Student Statistics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Enrolled This Year
                  </span>
                  <span className="font-semibold">
                    {reportData.students.enrolled}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Currently Active
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {reportData.students.active}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Graduated</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {reportData.students.graduated}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold mb-4">Financial Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee Revenue</span>
                  <span className="font-semibold">
                    £{reportData.financial.feeRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fine Revenue</span>
                  <span className="font-semibold">
                    £{reportData.financial.fineRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-medium">Total Revenue</span>
                  <span className="font-bold text-primary">
                    £{reportData.financial.totalRevenue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Academic Performance */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold mb-4">Academic Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Grade</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {reportData.academic.avgGrade}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Certificates Issued
                  </span>
                  <span className="font-semibold">
                    {reportData.academic.certificatesIssued}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items Memorized</span>
                  <span className="font-semibold">
                    {reportData.activities.memorizationItems}
                  </span>
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold mb-4">Activities & Events</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Events Hosted</span>
                  <span className="font-semibold">
                    {reportData.activities.eventsHosted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Attendance Records
                  </span>
                  <span className="font-semibold">
                    {reportData.attendance.totalRecords}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attendance Rate</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {reportData.attendance.rate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Students */}
          {reportData.academic.topStudents.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Top 10 Performing Students</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Rank</th>
                      <th className="text-left p-3">Student</th>
                      <th className="text-center p-3">Student #</th>
                      <th className="text-center p-3">Average Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reportData.academic.topStudents.map(
                      (student: any, index: number) => (
                        <tr key={student.id} className="hover:bg-accent">
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                index === 0
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                  : index === 1
                                  ? "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
                                  : index === 2
                                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{student.name}</td>
                          <td className="p-3 text-center text-muted-foreground">
                            {student.number}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-semibold">
                              {student.avgGrade}%
                            </span>
                          </td>
                        </tr>
                      )
                    )}
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
