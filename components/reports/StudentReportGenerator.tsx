// components/reports/StudentReportGenerator.tsx
"use client";

import { useState } from "react";
import { Download, Loader2, User, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
      // 1. Get Student Details
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(
          `
          *,
          classes (name)
        `
        )
        .eq("id", selectedStudent)
        .single();

      if (studentError) throw studentError;

      // 2. Get Attendance Summary
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("status, date")
        .eq("student_id", selectedStudent)
        .order("date", { ascending: false });

      if (attendanceError) throw attendanceError;

      // Calculate attendance stats
      const attendanceStats: any = {
        total: attendance?.length || 0,
        present: attendance?.filter((a) => a.status === "present").length || 0,
        absent: attendance?.filter((a) => a.status === "absent").length || 0,
        late: attendance?.filter((a) => a.status === "late").length || 0,
        excused: attendance?.filter((a) => a.status === "excused").length || 0,
        percentage: "0",
      };

      attendanceStats.percentage =
        attendanceStats.total > 0
          ? ((attendanceStats.present / attendanceStats.total) * 100).toFixed(1)
          : "0";

      // 3. Get Academic Progress
      const { data: academicProgress, error: academicError } = await supabase
        .from("academic_progress")
        .select(
          `
          *,
          subjects (name)
        `
        )
        .eq("student_id", selectedStudent)
        .order("assessment_date", { ascending: false });

      if (academicError) throw academicError;

      // Calculate subject averages
      const subjectAverages: Record<string, any> = {};
      academicProgress?.forEach((record) => {
        const subjectName = record.subjects?.name || "Unknown";
        if (!subjectAverages[subjectName]) {
          subjectAverages[subjectName] = {
            total: 0,
            count: 0,
            scores: [],
          };
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

      // 4. Get Memorization Progress
      const { data: memorization, error: memorizationError } = await supabase
        .from("student_memorization")
        .select("*")
        .eq("student_id", selectedStudent);

      // Then get memorization items separately
      let memorizationWithItems: any[] = [];
      if (memorization && memorization.length > 0) {
        const itemIds = memorization.map((m: any) => m.memorization_item_id);
        const { data: items } = await supabase
          .from("memorization_items")
          .select("*")
          .in("id", itemIds);

        memorizationWithItems = memorization.map((m: any) => ({
          ...m,
          memorization_items: items?.find(
            (i: any) => i.id === m.memorization_item_id
          ),
        }));
      }

      if (memorizationError) throw memorizationError;

      // Calculate memorization stats
      const memorizationStats = {
        duas: {
          total:
            memorizationWithItems?.filter(
              (m) => m.memorization_items?.item_type === "dua"
            ).length || 0,
          mastered:
            memorizationWithItems?.filter(
              (m) =>
                m.memorization_items?.item_type === "dua" &&
                m.status === "mastered"
            ).length || 0,
        },
        surahs: {
          total:
            memorizationWithItems?.filter(
              (m) => m.memorization_items?.item_type === "surah"
            ).length || 0,
          mastered:
            memorizationWithItems?.filter(
              (m) =>
                m.memorization_items?.item_type === "surah" &&
                m.status === "mastered"
            ).length || 0,
        },
        hadiths: {
          total:
            memorizationWithItems?.filter(
              (m) => m.memorization_items?.item_type === "hadith"
            ).length || 0,
          mastered:
            memorizationWithItems?.filter(
              (m) =>
                m.memorization_items?.item_type === "hadith" &&
                m.status === "mastered"
            ).length || 0,
        },
      };

      // 5. Get Certificates
      const { data: certificates, error: certificatesError } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", selectedStudent)
        .order("issue_date", { ascending: false });

      if (certificatesError) throw certificatesError;

      // Combine all data
      setReportData({
        student,
        attendanceStats,
        attendanceRecords: attendance?.slice(0, 10) || [], // Last 10 records
        academicProgress: academicProgress?.slice(0, 10) || [], // Last 10 assessments
        subjectAverages,
        memorization: memorizationWithItems,
        memorizationStats,
        certificates,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  const getMemorizationStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      not_started:
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      learning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      memorized:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      mastered:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return badges[status] || badges.not_started;
  };

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

        <div className="flex items-end space-x-2">
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
            <button onClick={handlePrint} className="btn-outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg border border-border print:border-0">
          {/* Header */}
          <div className="border-b pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {reportData.student.first_name} {reportData.student.last_name}
                </h2>
                {reportData.student.arabic_name && (
                  <p className="text-lg text-muted-foreground rtl">
                    {reportData.student.arabic_name}
                  </p>
                )}
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
                  {new Date().toLocaleDateString()}
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
                        reportData.student.date_of_birth
                      ).toLocaleDateString()
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
                <p className="text-muted-foreground">Enrollment Date</p>
                <p className="font-medium">
                  {new Date(
                    reportData.student.enrollment_date
                  ).toLocaleDateString()}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
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
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Academic Progress */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Academic Progress</h3>

            {/* Subject Averages */}
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
                    )
                  )}
                </div>

                {/* Recent Assessments */}
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
                                record.assessment_date
                              ).toLocaleDateString()}
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
                        )
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

          {/* 4. Memorization Progress */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Memorization Progress
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="border border-border rounded-lg p-3 text-center">
                <p className="text-xl font-bold">
                  {reportData.memorizationStats.duas.mastered}/
                  {reportData.memorizationStats.duas.total}
                </p>
                <p className="text-sm text-muted-foreground">Duas</p>
              </div>
              <div className="border border-border rounded-lg p-3 text-center">
                <p className="text-xl font-bold">
                  {reportData.memorizationStats.surahs.mastered}/
                  {reportData.memorizationStats.surahs.total}
                </p>
                <p className="text-sm text-muted-foreground">Surahs</p>
              </div>
              <div className="border border-border rounded-lg p-3 text-center">
                <p className="text-xl font-bold">
                  {reportData.memorizationStats.hadiths.mastered}/
                  {reportData.memorizationStats.hadiths.total}
                </p>
                <p className="text-sm text-muted-foreground">Hadiths</p>
              </div>
            </div>

            {/* Memorization Details */}
            {reportData.memorization && reportData.memorization.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Item
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Proficiency
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.memorization.map((item: any, index: number) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-3 py-2">
                          {item.memorization_items?.title}
                          {item.memorization_items?.title_arabic && (
                            <div className="text-xs text-muted-foreground rtl">
                              {item.memorization_items.title_arabic}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 capitalize">
                          {item.memorization_items?.item_type}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getMemorizationStatusBadge(
                              item.status
                            )}`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {item.proficiency_rating
                            ? `${item.proficiency_rating}/5`
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No memorization items tracked yet
              </p>
            )}
          </div>

          {/* 5. Certificates */}
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
                      <p className="font-medium text-sm">
                        {cert.certificate_type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cert.issue_date).toLocaleDateString()} •{" "}
                        {cert.certificate_number}
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
