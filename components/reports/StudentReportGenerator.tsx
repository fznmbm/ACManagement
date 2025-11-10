// components/reports/StudentReportGenerator.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, FileText, Loader2 } from "lucide-react";
import { formatDate, calculateAge } from "@/lib/utils/helpers";
import { exportStudentToPDF } from "@/lib/utils/pdfExport";

interface StudentReportGeneratorProps {
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
  classes: Array<{ id: string; name: string }>;
}

export default function StudentReportGenerator({
  students,
  classes,
}: StudentReportGeneratorProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    if (!selectedStudent) {
      alert("Please select a student");
      return;
    }

    setLoading(true);
    try {
      // Get student details
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(
          `
          *,
          classes (
            id,
            name,
            level
          )
        `
        )
        .eq("id", selectedStudent)
        .single();

      if (studentError) throw studentError;

      // Get attendance records
      const { data: attendanceRecords } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", selectedStudent)
        .order("date", { ascending: false });

      // Calculate attendance statistics
      const totalAttendance = attendanceRecords?.length || 0;
      const present =
        attendanceRecords?.filter((a) => a.status === "present").length || 0;
      const absent =
        attendanceRecords?.filter((a) => a.status === "absent").length || 0;
      const late =
        attendanceRecords?.filter((a) => a.status === "late").length || 0;
      const excused =
        attendanceRecords?.filter((a) => a.status === "excused").length || 0;
      const attendanceRate =
        totalAttendance > 0 ? Math.round((present / totalAttendance) * 100) : 0;

      // Get Quran progress
      const { data: quranProgress } = await supabase
        .from("quran_progress")
        .select("*")
        .eq("student_id", selectedStudent)
        .order("started_date", { ascending: false });

      // Get academic progress
      const { data: academicProgress } = await supabase
        .from("academic_progress")
        .select(
          `
          *,
          subjects (
            id,
            name
          )
        `
        )
        .eq("student_id", selectedStudent)
        .order("assessment_date", { ascending: false });

      // Get recent attendance (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentAttendance =
        attendanceRecords?.filter((a) => new Date(a.date) >= thirtyDaysAgo) ||
        [];

      setReportData({
        student,
        attendance: {
          total: totalAttendance,
          present,
          absent,
          late,
          excused,
          rate: attendanceRate,
          recent: recentAttendance,
        },
        quranProgress: quranProgress || [],
        academicProgress: academicProgress || [],
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    exportStudentToPDF({
      student: reportData.student,
      attendance: reportData.attendance,
      quranProgress: reportData.quranProgress,
      academicProgress: reportData.academicProgress,
    });
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const student = reportData.student;
    const lines = [
      "STUDENT REPORT",
      "",
      `Student Name: ${student.first_name} ${student.last_name}`,
      `Student Number: ${student.student_number}`,
      `Class: ${student.classes?.name || "N/A"}`,
      `Date of Birth: ${student.date_of_birth || "N/A"}`,
      `Age: ${
        student.date_of_birth ? calculateAge(student.date_of_birth) : "N/A"
      }`,
      `Status: ${student.status}`,
      "",
      "ATTENDANCE SUMMARY",
      `Total Records: ${reportData.attendance.total}`,
      `Present: ${reportData.attendance.present} (${reportData.attendance.rate}%)`,
      `Absent: ${reportData.attendance.absent}`,
      `Late: ${reportData.attendance.late}`,
      `Excused: ${reportData.attendance.excused}`,
      "",
      "RECENT ATTENDANCE (Last 30 Days)",
      "Date,Status,Notes",
      ...reportData.attendance.recent.map(
        (a: any) => `${a.date},${a.status},"${a.notes || ""}"`
      ),
    ];

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-report-${reportData.student.student_number}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Select Student *</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="form-input"
          >
            <option value="">Choose a student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} (#
                {student.student_number})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={generateReport}
            disabled={loading || !selectedStudent}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <span>Generate Student Report</span>
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

          {/* Student Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">
                  {reportData.student.first_name} {reportData.student.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Student Number</p>
                <p className="font-medium">
                  {reportData.student.student_number}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">
                  {reportData.student.classes?.name || "No class assigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">
                  {reportData.student.date_of_birth
                    ? `${calculateAge(reportData.student.date_of_birth)} years`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">
                  {reportData.student.gender}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    reportData.student.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {reportData.student.status}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">
                  {reportData.attendance.total}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-700">
                  {reportData.attendance.present}
                </p>
                <p className="text-sm text-green-600">Present</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-700">
                  {reportData.attendance.absent}
                </p>
                <p className="text-sm text-red-600">Absent</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-700">
                  {reportData.attendance.late}
                </p>
                <p className="text-sm text-orange-600">Late</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-700">
                  {reportData.attendance.rate}%
                </p>
                <p className="text-sm text-blue-600">Rate</p>
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Recent Attendance (Last 30 Days)
            </h3>
            {reportData.attendance.recent.length > 0 ? (
              <div className="space-y-2">
                {reportData.attendance.recent
                  .slice(0, 10)
                  .map((record: any) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent"
                    >
                      <span className="text-sm">
                        {formatDate(record.date, "long")}
                      </span>
                      <div className="flex items-center space-x-3">
                        {record.notes && (
                          <span className="text-sm text-muted-foreground italic">
                            {record.notes}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            record.status === "present"
                              ? "bg-green-100 text-green-800"
                              : record.status === "absent"
                              ? "bg-red-100 text-red-800"
                              : record.status === "late"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No attendance records in the last 30 days
              </p>
            )}
          </div>

          {/* Quran Progress */}
          {reportData.quranProgress.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quran Progress</h3>
              <div className="space-y-3">
                {reportData.quranProgress.map((progress: any) => (
                  <div
                    key={progress.id}
                    className="border-l-4 border-primary pl-4 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{progress.surah_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {progress.verses_memorized}/{progress.verses_total}{" "}
                          verses • {progress.progress_type}
                        </p>
                      </div>
                      {progress.proficiency_level && (
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          {progress.proficiency_level}
                        </span>
                      )}
                    </div>
                    {progress.teacher_notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        "{progress.teacher_notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic Progress */}
          {reportData.academicProgress.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Academic Progress</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Subject</th>
                      <th className="px-4 py-2 text-left">Assessment</th>
                      <th className="px-4 py-2 text-left">Score</th>
                      <th className="px-4 py-2 text-left">Grade</th>
                      <th className="px-4 py-2 text-left">Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reportData.academicProgress.map((progress: any) => (
                      <tr key={progress.id} className="hover:bg-muted/30">
                        <td className="px-4 py-2">
                          {progress.assessment_date
                            ? formatDate(progress.assessment_date, "short")
                            : "-"}
                        </td>
                        <td className="px-4 py-2">
                          {progress.subjects?.name || "N/A"}
                        </td>
                        <td className="px-4 py-2 capitalize">
                          {progress.assessment_type || "N/A"}
                        </td>
                        <td className="px-4 py-2">
                          {progress.score !== null && progress.max_score
                            ? `${progress.score}/${progress.max_score}`
                            : "-"}
                        </td>
                        <td className="px-4 py-2">
                          {progress.grade && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                              {progress.grade}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {progress.teacher_feedback || "-"}
                        </td>
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
