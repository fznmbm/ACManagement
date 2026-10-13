// components/reports/StudentReportGenerator.tsx
"use client";

import { useState } from "react";
import { Download, Loader2, User, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { exportStudentToPDF } from "@/lib/utils/pdfExport";
import {
  cohortWindow,
  expectedWeeks,
  participationRate,
} from "@/lib/utils/prayerParticipation";

interface StudentReportGeneratorProps {
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
  classes: Array<{ id: string; name: string }>;
}

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function feeStructureName(fee: any): string {
  const fs = fee.fee_structures;
  const name = Array.isArray(fs) ? fs[0]?.name : fs?.name;
  return name || fee.period_name || fee.invoice_number || "Fee";
}

export default function StudentReportGenerator({
  students,
  classes,
}: StudentReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    if (!selectedStudent) {
      alert("Please select a student");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Student details
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(`*, classes (name)`)
        .eq("id", selectedStudent)
        .single();

      if (studentError) throw studentError;

      // 2. Attendance
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("status, date")
        .eq("student_id", selectedStudent)
        .order("date", { ascending: false });

      if (attendanceError) throw attendanceError;

      const attendanceStats: any = {
        total: attendance?.length || 0,
        present: attendance?.filter((a) => a.status === "present").length || 0,
        absent: attendance?.filter((a) => a.status === "absent").length || 0,
        late: attendance?.filter((a) => a.status === "late").length || 0,
        excused: attendance?.filter((a) => a.status === "excused").length || 0,
        sick: attendance?.filter((a) => a.status === "sick").length || 0,
        percentage: "0",
      };
      attendanceStats.percentage =
        attendanceStats.total > 0
          ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(1)
          : "0";

      // 3. Academic progress
      const { data: academicProgress, error: academicError } = await supabase
        .from("academic_progress")
        .select(`*, subjects (name)`)
        .eq("student_id", selectedStudent)
        .order("assessment_date", { ascending: false });

      if (academicError) throw academicError;

      const subjectAverages: Record<string, any> = {};
      academicProgress?.forEach((record) => {
        const subjectName = record.subjects?.name || "Unknown";
        if (!subjectAverages[subjectName]) {
          subjectAverages[subjectName] = { total: 0, count: 0, scores: [] };
        }
        subjectAverages[subjectName].total += record.percentage || 0;
        subjectAverages[subjectName].count += 1;
        subjectAverages[subjectName].scores.push({
          type: record.assessment_type,
          score: record.percentage,
          date: record.assessment_date,
        });
      });
      Object.keys(subjectAverages).forEach((subject) => {
        subjectAverages[subject].average = (
          subjectAverages[subject].total / subjectAverages[subject].count
        ).toFixed(1);
      });

      // 4. Prayer compliance — real columns (status + 35 day booleans),
      // with weeks-submitted measured against the enrolment-aware window.
      const { data: allSheetWeeks } = await supabase
        .from("prayer_sheets")
        .select("week_start_date");
      const windowRange = cohortWindow(
        (allSheetWeeks || []).map((s: any) => s.week_start_date),
      );
      const { data: prayerSheets } = await supabase
        .from("prayer_sheets")
        .select("*")
        .eq("student_id", selectedStudent);

      let prayer: any = null;
      if (prayerSheets && prayerSheets.length > 0) {
        const calcRate = (prayer: string) => {
          let prayed = 0;
          let totalDays = 0;
          prayerSheets.forEach((sheet: any) => {
            WEEK_DAYS.forEach((day) => {
              const v = sheet[`${day}_${prayer}`];
              if (v !== null && v !== undefined) {
                totalDays++;
                if (v === true) prayed++;
              }
            });
          });
          return totalDays > 0 ? Math.round((prayed / totalDays) * 100) : 0;
        };
        const rates = PRAYERS.map((p) => ({
          name: p.charAt(0).toUpperCase() + p.slice(1),
          rate: calcRate(p),
        }));
        const compliance = Math.round(
          rates.reduce((s, r) => s + r.rate, 0) / rates.length,
        );
        const submitted = prayerSheets.filter(
          (s: any) => s.status === "submitted" || s.status === "verified",
        ).length;
        const expected = expectedWeeks(windowRange, student.enrollment_date);
        prayer = {
          compliance,
          submitted,
          expected,
          rate: participationRate(submitted, expected),
          rates,
        };
      }

      // 5. Fees
      const { data: fees } = await supabase
        .from("fee_invoices")
        .select(
          "invoice_number, amount_due, amount_paid, status, due_date, period_name, fee_structures(name)",
        )
        .eq("student_id", selectedStudent)
        .neq("status", "cancelled")
        .order("due_date", { ascending: false });

      // 6. Fines
      const { data: fines } = await supabase
        .from("fines")
        .select("fine_type, amount, status, issued_date, notes")
        .eq("student_id", selectedStudent)
        .order("issued_date", { ascending: false });

      // 7. Certificates
      const { data: certificates, error: certificatesError } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", selectedStudent)
        .order("issue_date", { ascending: false });

      if (certificatesError) throw certificatesError;

      // 8. Feedback (last 5 completed class sessions + this student's notes)
      const { data: feedbackSessions } = await supabase
        .from("class_feedback_sessions")
        .select("id, session_date, class_summary")
        .eq("class_id", student.class_id)
        .eq("status", "completed")
        .order("session_date", { ascending: false })
        .limit(5);

      let feedbackWithNotes: any[] = [];
      if (feedbackSessions && feedbackSessions.length > 0) {
        const sessionIds = feedbackSessions.map((s) => s.id);
        const { data: notes } = await supabase
          .from("student_feedback")
          .select("session_id, feedback_text")
          .eq("student_id", selectedStudent)
          .in("session_id", sessionIds);

        const notesMap: Record<string, string> = {};
        notes?.forEach((n) => {
          notesMap[n.session_id] = n.feedback_text;
        });

        feedbackWithNotes = feedbackSessions.map((s) => ({
          ...s,
          studentNote: notesMap[s.id] || null,
        }));
      }

      setReportData({
        student,
        attendanceStats,
        attendanceRecords: attendance?.slice(0, 10) || [],
        academicProgress: academicProgress?.slice(0, 10) || [],
        subjectAverages,
        prayer,
        fees: fees || [],
        fines: fines || [],
        certificates: certificates || [],
        feedback: feedbackWithNotes,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const openMeetingView = () => {
    if (!selectedStudent) return;
    window.open(`/students/${selectedStudent}/meeting`, "_blank");
  };

  const exportToPDF = () => {
    if (!reportData) return;
    const d = reportData;
    exportStudentToPDF({
      student: d.student,
      attendance: {
        total: d.attendanceStats.total,
        present: d.attendanceStats.present,
        absent: d.attendanceStats.absent,
        late: d.attendanceStats.late,
        rate: d.attendanceStats.percentage,
        recent: d.attendanceRecords,
      },
      quranProgress: [],
      academicProgress: d.academicProgress,
      prayer: d.prayer
        ? {
            compliance: d.prayer.compliance,
            submitted: d.prayer.submitted,
            expected: d.prayer.expected || null,
            rates: d.prayer.rates,
          }
        : null,
      fees: (d.fees || []).map((f: any) => ({
        label: feeStructureName(f),
        due: `£${Number(f.amount_due).toFixed(2)}`,
        paid: `£${Number(f.amount_paid).toFixed(2)}`,
        status: f.status,
      })),
      fines: (d.fines || []).map((f: any) => ({
        label: String(f.fine_type).replace(/_/g, " "),
        amount: `£${Number(f.amount).toFixed(2)}`,
        status: f.status,
        date: new Date(f.issued_date).toLocaleDateString("en-GB"),
      })),
      certificates: (d.certificates || []).map((c: any) => ({
        label: String(c.certificate_type).replace(/_/g, " "),
        number: c.certificate_number,
        date: new Date(c.issue_date).toLocaleDateString("en-GB"),
      })),
      feedback: (d.feedback || []).map((s: any) => ({
        date: new Date(s.session_date).toLocaleDateString("en-GB"),
        summary: s.class_summary || "",
        note: s.studentNote || "",
      })),
    });
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const s = reportData.student;
    const a = reportData.attendanceStats;
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const lines: string[] = [];
    lines.push("Student Report");
    lines.push(
      [esc("Student"), esc(`${s.first_name} ${s.last_name}`)].join(","),
    );
    lines.push([esc("Student number"), esc(s.student_number)].join(","));
    lines.push([esc("Class"), esc(s.classes?.name || "No class")].join(","));
    lines.push([esc("Attendance rate"), esc(`${a.percentage}%`)].join(","));
    lines.push(
      [
        esc("Attendance"),
        esc(
          `Present ${a.present} / Absent ${a.absent} / Late ${a.late} / Excused ${a.excused} / Sick ${a.sick} of ${a.total}`,
        ),
      ].join(","),
    );

    if (reportData.prayer) {
      const p = reportData.prayer;
      lines.push("");
      lines.push("Prayer compliance");
      lines.push([esc("Overall compliance"), esc(`${p.compliance}%`)].join(","));
      lines.push(
        [
          esc("Weeks submitted"),
          esc(p.expected ? `${p.submitted}/${p.expected}` : `${p.submitted}`),
        ].join(","),
      );
      p.rates.forEach((r: any) =>
        lines.push([esc(r.name), esc(`${r.rate}%`)].join(",")),
      );
    }

    lines.push("");
    lines.push("Results");
    lines.push(
      ["Date", "Subject", "Assessment", "Score", "Max", "Percentage", "Grade"]
        .map(esc)
        .join(","),
    );
    (reportData.academicProgress || []).forEach((r: any) => {
      lines.push(
        [
          r.assessment_date || "",
          r.subjects?.name || "",
          r.assessment_type || "",
          r.score ?? "",
          r.max_score ?? "",
          r.percentage != null ? `${r.percentage}%` : "",
          r.grade || "",
        ]
          .map(esc)
          .join(","),
      );
    });

    if ((reportData.fees || []).length > 0) {
      lines.push("");
      lines.push("Fees");
      lines.push(["Fee", "Due", "Paid", "Status"].map(esc).join(","));
      reportData.fees.forEach((f: any) => {
        lines.push(
          [
            feeStructureName(f),
            `£${Number(f.amount_due).toFixed(2)}`,
            `£${Number(f.amount_paid).toFixed(2)}`,
            f.status,
          ]
            .map(esc)
            .join(","),
        );
      });
    }

    if ((reportData.fines || []).length > 0) {
      lines.push("");
      lines.push("Fines");
      lines.push(["Type", "Amount", "Status", "Date"].map(esc).join(","));
      reportData.fines.forEach((f: any) => {
        lines.push(
          [
            String(f.fine_type).replace(/_/g, " "),
            `£${Number(f.amount).toFixed(2)}`,
            f.status,
            new Date(f.issued_date).toLocaleDateString("en-GB"),
          ]
            .map(esc)
            .join(","),
        );
      });
    }

    if ((reportData.certificates || []).length > 0) {
      lines.push("");
      lines.push("Certificates");
      lines.push(["Certificate", "Number", "Issued"].map(esc).join(","));
      reportData.certificates.forEach((c: any) => {
        lines.push(
          [
            String(c.certificate_type).replace(/_/g, " "),
            c.certificate_number,
            new Date(c.issue_date).toLocaleDateString("en-GB"),
          ]
            .map(esc)
            .join(","),
        );
      });
    }

    if ((reportData.feedback || []).length > 0) {
      lines.push("");
      lines.push("Recent feedback");
      lines.push(["Date", "Class summary", "Personal note"].map(esc).join(","));
      reportData.feedback.forEach((f: any) => {
        lines.push(
          [
            new Date(f.session_date).toLocaleDateString("en-GB"),
            f.class_summary || "",
            f.studentNote || "",
          ]
            .map(esc)
            .join(","),
        );
      });
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `student-report-${s.student_number}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      present: "badge-present",
      absent: "badge-absent",
      late: "badge-late",
      excused: "badge-excused",
    };
    return badges[status] || "";
  };

  const rateColor = (rate: number) =>
    rate >= 80
      ? "text-green-600 dark:text-green-400"
      : rate >= 50
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  // Fee / fine outstanding totals
  const outstandingFees = (reportData?.fees || [])
    .filter((f: any) => ["pending", "partial", "overdue"].includes(f.status))
    .reduce((s: number, f: any) => s + (f.amount_due - f.amount_paid), 0);
  const pendingFines = (reportData?.fines || [])
    .filter((f: any) => f.status === "pending")
    .reduce((s: number, f: any) => s + Number(f.amount), 0);

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Select Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="form-input"
          >
            <option value="">Choose a student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} (
                {student.student_number})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          <button
            onClick={generateReport}
            disabled={loading || !selectedStudent}
            className="btn-primary flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </button>

          {reportData && (
            <>
              <button
                onClick={exportToPDF}
                className="btn-outline flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </button>
              <button
                onClick={exportToCSV}
                className="btn-outline flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={openMeetingView}
                className="btn-outline flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Meeting View
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-6 bg-card p-6 rounded-lg border border-border print:border-0">
          {/* Header */}
          <div className="border-b pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {reportData.student.first_name} {reportData.student.last_name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Student #: {reportData.student.student_number}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>
                  <span className="text-muted-foreground">Class:</span>{" "}
                  {reportData.student.classes?.name || "Not Assigned"}
                </p>
                <p>
                  <span className="text-muted-foreground">Report Date:</span>{" "}
                  {new Date().toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
          </div>

          {/* 1. Student Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {reportData.student.date_of_birth
                    ? new Date(
                        reportData.student.date_of_birth,
                      ).toLocaleDateString("en-GB")
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">
                  {reportData.student.gender}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Enrolment Date</p>
                <p className="font-medium">
                  {new Date(
                    reportData.student.enrollment_date,
                  ).toLocaleDateString("en-GB")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">
                  {reportData.student.status}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Parent/Guardian</p>
                <p className="font-medium">{reportData.student.parent_name}</p>
                <p className="text-xs text-muted-foreground">
                  {reportData.student.parent_phone}
                  {reportData.student.parent_email &&
                    ` • ${reportData.student.parent_email}`}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Attendance Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Attendance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">
                  {reportData.attendanceStats.percentage}%
                </p>
                <p className="text-xs text-muted-foreground">Overall</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {reportData.attendanceStats.present}
                </p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {reportData.attendanceStats.absent}
                </p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {reportData.attendanceStats.late}
                </p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {reportData.attendanceStats.excused}
                </p>
                <p className="text-xs text-muted-foreground">Excused</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {reportData.attendanceStats.sick}
                </p>
                <p className="text-xs text-muted-foreground">Sick</p>
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Date</th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.attendanceRecords.map(
                    (record: any, index: number) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-3 py-2">
                          {new Date(record.date).toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              record.status,
                            )}`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Academic Progress */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Academic Progress</h3>
            {Object.keys(reportData.subjectAverages).length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {Object.entries(reportData.subjectAverages).map(
                    ([subject, data]: [string, any]) => (
                      <div
                        key={subject}
                        className="border border-border rounded-lg p-3"
                      >
                        <p className="font-medium">{subject}</p>
                        <p className="text-2xl font-bold text-primary">
                          {data.average}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.count} assessment{data.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    ),
                  )}
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Subject
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.academicProgress.map(
                        (record: any, index: number) => (
                          <tr key={index} className="border-t border-border">
                            <td className="px-3 py-2">
                              {new Date(
                                record.assessment_date,
                              ).toLocaleDateString("en-GB")}
                            </td>
                            <td className="px-3 py-2">
                              {record.subjects?.name}
                            </td>
                            <td className="px-3 py-2 capitalize">
                              {record.assessment_type}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`font-semibold ${
                                  record.percentage >= 60
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {record.percentage}%
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No academic assessments recorded yet
              </p>
            )}
          </div>

          {/* 4. Prayer Compliance */}
          {reportData.prayer && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Prayer Compliance</h3>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {reportData.prayer.compliance}%
                  </p>
                  <p className="text-xs text-muted-foreground">Compliance</p>
                </div>
                <div className="border border-border rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">
                    {reportData.prayer.rate === null
                      ? "—"
                      : `${reportData.prayer.submitted}/${reportData.prayer.expected}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Weeks submitted
                  </p>
                </div>
                {reportData.prayer.rates.map((r: any) => (
                  <div
                    key={r.name}
                    className="border border-border rounded-lg p-3 text-center"
                  >
                    <p className={`text-xl font-bold ${rateColor(r.rate)}`}>
                      {r.rate}%
                    </p>
                    <p className="text-xs text-muted-foreground">{r.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Fees */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Fees</h3>
              {outstandingFees > 0 && (
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  £{outstandingFees.toFixed(2)} outstanding
                </span>
              )}
            </div>
            {reportData.fees.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No fee invoices
              </p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Fee</th>
                      <th className="px-3 py-2 text-left font-semibold">Due</th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Paid
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.fees.map((f: any, i: number) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2">{feeStructureName(f)}</td>
                        <td className="px-3 py-2">
                          £{Number(f.amount_due).toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          £{Number(f.amount_paid).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 capitalize">{f.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 6. Fines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Fines</h3>
              {pendingFines > 0 && (
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  £{pendingFines.toFixed(2)} pending
                </span>
              )}
            </div>
            {reportData.fines.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No fines recorded
              </p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.fines.map((f: any, i: number) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 capitalize">
                          {String(f.fine_type).replace(/_/g, " ")}
                        </td>
                        <td className="px-3 py-2">
                          £{Number(f.amount).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 capitalize">{f.status}</td>
                        <td className="px-3 py-2">
                          {new Date(f.issued_date).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 7. Feedback */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Feedback</h3>
            {reportData.feedback && reportData.feedback.length > 0 ? (
              <div className="space-y-2">
                {reportData.feedback.map((session: any) => (
                  <div
                    key={session.id}
                    className="border border-border rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">
                        {new Date(session.session_date).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                      {session.studentNote && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-full">
                          Personal note
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.class_summary}
                    </p>
                    {session.studentNote && (
                      <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                        💬 {session.studentNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No feedback recorded yet
              </p>
            )}
          </div>

          {/* 8. Certificates */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Certificates Earned</h3>
            {reportData.certificates && reportData.certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportData.certificates.map((cert: any, index: number) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-3 flex items-center space-x-3"
                  >
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                      <Download className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm capitalize">
                        {String(cert.certificate_type).replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cert.issue_date).toLocaleDateString("en-GB")}{" "}
                        • {cert.certificate_number}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No certificates earned yet
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
