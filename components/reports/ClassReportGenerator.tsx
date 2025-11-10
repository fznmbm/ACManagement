// components/reports/ClassReportGenerator.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, FileText, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";
import { exportClassToPDF } from "@/lib/utils/pdfExport";

interface ClassReportGeneratorProps {
  classes: Array<{ id: string; name: string }>;
}

export default function ClassReportGenerator({
  classes,
}: ClassReportGeneratorProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    if (!selectedClass) {
      alert("Please select a class");
      return;
    }

    setLoading(true);
    try {
      // Get class details with teacher
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select(
          `
          *,
          profiles:teacher_id (
            id,
            full_name,
            email
          )
        `
        )
        .eq("id", selectedClass)
        .single();

      if (classError) throw classError;

      // Get students in this class
      const { data: students } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .order("last_name");

      // Get attendance records for this class
      let attendanceQuery = supabase
        .from("attendance")
        .select("*")
        .eq("class_id", selectedClass);

      if (dateRange.from) {
        attendanceQuery = attendanceQuery.gte("date", dateRange.from);
      }
      if (dateRange.to) {
        attendanceQuery = attendanceQuery.lte("date", dateRange.to);
      }

      const { data: attendanceRecords } = await attendanceQuery;

      // Calculate statistics per student
      const studentStats =
        students?.map((student) => {
          const studentAttendance =
            attendanceRecords?.filter((a) => a.student_id === student.id) || [];
          const total = studentAttendance.length;
          const present = studentAttendance.filter(
            (a) => a.status === "present"
          ).length;
          const absent = studentAttendance.filter(
            (a) => a.status === "absent"
          ).length;
          const late = studentAttendance.filter(
            (a) => a.status === "late"
          ).length;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;

          return {
            ...student,
            attendance: {
              total,
              present,
              absent,
              late,
              rate,
            },
          };
        }) || [];

      // Calculate overall class statistics
      const totalRecords = attendanceRecords?.length || 0;
      const totalPresent =
        attendanceRecords?.filter((a) => a.status === "present").length || 0;
      const totalAbsent =
        attendanceRecords?.filter((a) => a.status === "absent").length || 0;
      const totalLate =
        attendanceRecords?.filter((a) => a.status === "late").length || 0;
      const classRate =
        totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

      setReportData({
        classInfo: classData,
        students: studentStats,
        statistics: {
          totalStudents: students?.length || 0,
          activeStudents:
            students?.filter((s) => s.status === "active").length || 0,
          totalRecords,
          totalPresent,
          totalAbsent,
          totalLate,
          classRate,
        },
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
      "Student Number",
      "Name",
      "Total Records",
      "Present",
      "Absent",
      "Late",
      "Attendance Rate",
    ];
    const rows = reportData.students.map((student: any) => [
      student.student_number,
      `${student.first_name} ${student.last_name}`,
      student.attendance.total,
      student.attendance.present,
      student.attendance.absent,
      student.attendance.late,
      `${student.attendance.rate}%`,
    ]);

    const csv = [
      `CLASS REPORT - ${reportData.classInfo.name}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `class-report-${reportData.classInfo.name.replace(
      /\s+/g,
      "-"
    )}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    if (!reportData) return;

    exportClassToPDF({
      classInfo: reportData.classInfo,
      students: reportData.students,
      statistics: reportData.statistics,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="form-label">Select Class *</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="form-input"
          >
            <option value="">Choose a class...</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">From Date (Optional)</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) =>
              setDateRange({ ...dateRange, from: e.target.value })
            }
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">To Date (Optional)</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={generateReport}
            disabled={loading || !selectedClass}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <span>Generate Report</span>
            )}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Export Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              className="btn-outline flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export to CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              className="btn-outline flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Export to PDF</span>
            </button>
          </div>

          {/* Class Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Class Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Class Name</p>
                <p className="font-medium">{reportData.classInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="font-medium">
                  {reportData.classInfo.level || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teacher</p>
                <p className="font-medium">
                  {reportData.classInfo.profiles?.full_name ||
                    "No teacher assigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Academic Year</p>
                <p className="font-medium">
                  {reportData.classInfo.academic_year || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Overall Statistics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Overall Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">
                  {reportData.statistics.totalStudents}
                </p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-700">
                  {reportData.statistics.totalRecords}
                </p>
                <p className="text-sm text-blue-600">Records</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-700">
                  {reportData.statistics.totalPresent}
                </p>
                <p className="text-sm text-green-600">Present</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-700">
                  {reportData.statistics.totalAbsent}
                </p>
                <p className="text-sm text-red-600">Absent</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-3xl font-bold text-primary">
                  {reportData.statistics.classRate}%
                </p>
                <p className="text-sm text-primary">Class Rate</p>
              </div>
            </div>
          </div>

          {/* Student Details */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <h3 className="font-semibold">Student Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Student #</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Gender</th>
                    <th className="px-4 py-2 text-center">Total</th>
                    <th className="px-4 py-2 text-center">Present</th>
                    <th className="px-4 py-2 text-center">Absent</th>
                    <th className="px-4 py-2 text-center">Late</th>
                    <th className="px-4 py-2 text-center">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.students.map((student: any) => (
                    <tr key={student.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">
                        {student.student_number}
                      </td>
                      <td className="px-4 py-2 font-medium">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-4 py-2 capitalize">{student.gender}</td>
                      <td className="px-4 py-2 text-center">
                        {student.attendance.total}
                      </td>
                      <td className="px-4 py-2 text-center text-green-700 font-medium">
                        {student.attendance.present}
                      </td>
                      <td className="px-4 py-2 text-center text-red-700 font-medium">
                        {student.attendance.absent}
                      </td>
                      <td className="px-4 py-2 text-center text-orange-700 font-medium">
                        {student.attendance.late}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.attendance.rate >= 80
                              ? "bg-green-100 text-green-800"
                              : student.attendance.rate >= 60
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {student.attendance.rate}%
                        </span>
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
