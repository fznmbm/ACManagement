// components/reports/LowAttendanceReportGenerator.tsx
"use client";

import { useState } from "react";
import { Download, Loader2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface LowAttendanceReportGeneratorProps {
  classes: Array<{ id: string; name: string }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
}

export default function LowAttendanceReportGenerator({
  classes,
  students,
}: LowAttendanceReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState("75");
  const [selectedClass, setSelectedClass] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Get all attendance records
      let attendanceQuery = supabase
        .from("attendance")
        .select("student_id, status, date, class_id");

      if (selectedClass) {
        attendanceQuery = attendanceQuery.eq("class_id", selectedClass);
      }
      if (dateFrom) {
        attendanceQuery = attendanceQuery.gte("date", dateFrom);
      }
      if (dateTo) {
        attendanceQuery = attendanceQuery.lte("date", dateTo);
      }

      const { data: attendance, error: attendanceError } =
        await attendanceQuery;

      if (attendanceError) throw attendanceError;

      // Calculate attendance percentage for each student
      const studentStats: Record<string, any> = {};

      attendance?.forEach((record) => {
        if (!studentStats[record.student_id]) {
          studentStats[record.student_id] = {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
          };
        }

        studentStats[record.student_id].total++;
        if (record.status === "present") {
          studentStats[record.student_id].present++;
        } else if (record.status === "absent") {
          studentStats[record.student_id].absent++;
        } else if (record.status === "late") {
          studentStats[record.student_id].late++;
        }
      });

      // Filter students below threshold
      const lowAttendanceStudents = Object.entries(studentStats)
        .map(([studentId, stats]: [string, any]) => {
          const percentage = (stats.present / stats.total) * 100;
          return {
            studentId,
            ...stats,
            percentage: percentage.toFixed(1),
          };
        })
        .filter(
          (student) => parseFloat(student.percentage) < parseFloat(threshold)
        );

      // Get student details
      const studentIds = lowAttendanceStudents.map((s) => s.studentId);
      const { data: studentDetails } = await supabase
        .from("students")
        .select(
          "id, first_name, last_name, student_number, parent_name, parent_phone, parent_email, class_id"
        )
        .in("id", studentIds);

      // Get class details
      const { data: classDetails } = await supabase
        .from("classes")
        .select("id, name");

      // Combine data
      const combinedData = lowAttendanceStudents.map((student) => {
        const details = studentDetails?.find((s) => s.id === student.studentId);
        const classInfo = classDetails?.find((c) => c.id === details?.class_id);
        return {
          ...student,
          ...details,
          className: classInfo?.name,
        };
      });

      setReportData(
        combinedData.sort(
          (a, b) => parseFloat(a.percentage) - parseFloat(b.percentage)
        )
      );
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="form-label">Attendance Threshold (%)</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="form-input"
            min="0"
            max="100"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Show students below this percentage
          </p>
        </div>

        <div>
          <label className="form-label">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="form-input"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateReport}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Generating...
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Generate Report
          </>
        )}
      </button>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-4">
          {/* Alert Banner */}
          {reportData.length > 0 ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-200">
                    {reportData.length} Student
                    {reportData.length !== 1 ? "s" : ""} Below {threshold}%
                    Attendance
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    These students require immediate attention and follow-up
                    with parents.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <p className="text-green-900 dark:text-green-200">
                ✓ No students below {threshold}% attendance threshold
              </p>
            </div>
          )}

          {/* Data Table */}
          {reportData.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Attendance %
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Present/Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Absent
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Parent Contact
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((student: any, index: number) => (
                    <tr
                      key={index}
                      className="border-t border-border hover:bg-accent"
                    >
                      <td className="px-4 py-3 text-sm">
                        {student.first_name} {student.last_name}
                        <div className="text-xs text-muted-foreground">
                          {student.student_number}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {student.className || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`font-bold ${
                            parseFloat(student.percentage) < 50
                              ? "text-red-600"
                              : parseFloat(student.percentage) < 75
                              ? "text-orange-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {student.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {student.present}/{student.total}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {student.absent}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-xs">
                          <p className="font-medium">{student.parent_name}</p>
                          <p className="text-muted-foreground">
                            {student.parent_phone}
                          </p>
                          {student.parent_email && (
                            <p className="text-muted-foreground">
                              {student.parent_email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/students/${student.studentId}`}
                          className="text-primary hover:underline text-xs"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
