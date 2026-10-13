// components/reports/PrayerComplianceReport.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Download, FileText } from "lucide-react";
import { exportTablePDF } from "@/lib/utils/pdfExport";
import {
  cohortWindow,
  expectedWeeks,
  participationRate,
} from "@/lib/utils/prayerParticipation";

// Whole weeks from a start date (inclusive) up to today — the shared
// denominator so "submitted" is measured against weeks the programme has run,
// not just weeks a parent happened to open a sheet.
function weeksSince(startISO: string): number {
  const start = new Date(startISO);
  if (isNaN(start.getTime())) return 0;
  const ms = Date.now() - start.getTime();
  return Math.max(1, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)) + 1);
}

interface PrayerComplianceReportProps {
  classes: Array<{ id: string; name: string }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
}

interface StudentPrayerData {
  student_id: string;
  name: string;
  number: string;
  class_name: string;
  total_sheets: number;
  submitted: number;
  expected_weeks: number;
  submission_rate: number | null; // null = child enrolled after the tracking window
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  overall_rate: number;
}

export default function PrayerComplianceReport({
  classes,
  students,
}: PrayerComplianceReportProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [reportData, setReportData] = useState<StudentPrayerData[]>([]);
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [sortBy, setSortBy] = useState<
    "name" | "submission_rate" | "overall_rate"
  >("submission_rate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // Prayer sheets are per-class; only classes with prayer sheets enabled count,
  // so disabled classes never show a misleading 0%. null = not yet known /
  // column not present (pre-migration) → treat all as enabled.
  const [enabledClassIds, setEnabledClassIds] = useState<string[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("classes")
          .select("id")
          .eq("prayer_sheets_enabled", true);
        if (!error && data) setEnabledClassIds(data.map((c: any) => c.id));
      } catch {
        /* column not applied yet — leave null (no filtering) */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleClasses = enabledClassIds
    ? classes.filter((c) => enabledClassIds.includes(c.id))
    : classes;

  const generateReport = async () => {
    setLoading(true);
    try {
      // Get students filtered by class
      let studentsQuery = supabase
        .from("students")
        .select(
          "id, first_name, last_name, student_number, class_id, enrollment_date, classes(name)",
        )
        .eq("status", "active");

      if (selectedClass) {
        studentsQuery = studentsQuery.eq("class_id", selectedClass);
      } else if (enabledClassIds) {
        // "All classes" means all prayer-enabled classes only.
        studentsQuery = studentsQuery.in(
          "class_id",
          enabledClassIds.length ? enabledClassIds : [
            "00000000-0000-0000-0000-000000000000",
          ],
        );
      }

      const { data: studentsData } = await studentsQuery.order("first_name");
      if (!studentsData) {
        setLoading(false);
        return;
      }

      // Get all prayer sheets for these students
      const studentIds = studentsData.map((s) => s.id);
      const { data: sheets } = await supabase
        .from("prayer_sheets")
        .select("*")
        .in("student_id", studentIds);

      // Cohort tracking window (earliest → latest sheet week, end clamped to
      // this week) — the denominator baseline for "weeks submitted".
      const windowRange = cohortWindow(
        (sheets || []).map((s: any) => s.week_start_date),
      );

      // Calculate per-student stats
      const result: StudentPrayerData[] = studentsData.map((student: any) => {
        const studentSheets =
          sheets?.filter((s) => s.student_id === student.id) || [];
        const submitted = studentSheets.filter(
          (s) => s.status === "submitted" || s.status === "verified",
        ).length;
        const total = studentSheets.length;
        // Expected weeks from the later of (tracking start, enrolment week).
        const expected = expectedWeeks(windowRange, student.enrollment_date);

        const calcPrayer = (prayer: string) => {
          let prayed = 0;
          let totalDays = 0;
          const days = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ];
          studentSheets.forEach((sheet) => {
            days.forEach((day) => {
              const val = sheet[`${day}_${prayer}`];
              if (val !== null && val !== undefined) {
                totalDays++;
                if (val === true) prayed++;
              }
            });
          });
          return totalDays > 0 ? Math.round((prayed / totalDays) * 100) : 0;
        };

        const fajr = calcPrayer("fajr");
        const dhuhr = calcPrayer("dhuhr");
        const asr = calcPrayer("asr");
        const maghrib = calcPrayer("maghrib");
        const isha = calcPrayer("isha");
        const overall_rate =
          [fajr, dhuhr, asr, maghrib, isha].reduce((a, b) => a + b, 0) / 5;

        return {
          student_id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          number: student.student_number,
          class_name: (student.classes as any)?.name || "Unassigned",
          total_sheets: total,
          submitted,
          expected_weeks: expected,
          submission_rate: participationRate(submitted, expected),
          fajr,
          dhuhr,
          asr,
          maghrib,
          isha,
          overall_rate: Math.round(overall_rate),
        };
      });

      setReportData(result);
    } catch (err) {
      console.error("Error generating prayer report:", err);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const sorted = [...reportData].sort((a, b) => {
    if (sortBy === "name") {
      return sortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    // submission_rate may be null (child enrolled after window) — sort last.
    const aVal = (a[sortBy] ?? -1) as number;
    const bVal = (b[sortBy] ?? -1) as number;
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const getRateColor = (rate: number) =>
    rate >= 80
      ? "text-green-600 dark:text-green-400"
      : rate >= 50
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  const getRateBg = (rate: number) =>
    rate >= 80
      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
      : rate >= 50
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";

  const exportToCSV = () => {
    const headers = [
      "Student",
      "Student #",
      "Class",
      "Weeks Submitted",
      "Participation Rate",
      "Fajr",
      "Dhuhr",
      "Asr",
      "Maghrib",
      "Isha",
      "Overall Rate",
    ];
    const rows = sorted.map((s) => [
      s.name,
      s.number,
      s.class_name,
      s.submission_rate === null
        ? `${s.submitted}`
        : `${s.submitted}/${s.expected_weeks}`,
      s.submission_rate === null ? "n/a" : `${s.submission_rate}%`,
      `${s.fajr}%`,
      `${s.dhuhr}%`,
      `${s.asr}%`,
      `${s.maghrib}%`,
      `${s.isha}%`,
      `${s.overall_rate}%`,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prayer-compliance-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    if (reportData.length === 0) return;
    exportTablePDF({
      title: "Prayer Compliance Report",
      subtitle: selectedClass
        ? classes.find((c) => c.id === selectedClass)?.name || "Class"
        : "All classes",
      summary: [
        { label: "Students", value: reportData.length },
        { label: "Avg submission rate", value: `${avgSubmission}%` },
        { label: "Avg prayer rate", value: `${avgOverall}%` },
        { label: "Never submitted", value: neverSubmitted },
      ],
      columns: [
        "Student",
        "Student #",
        "Class",
        "Weeks",
        "Fajr",
        "Dhuhr",
        "Asr",
        "Maghrib",
        "Isha",
        "Overall",
      ],
      rows: sorted.map((s) => [
        s.name,
        s.number,
        s.class_name,
        s.submission_rate === null
          ? "—"
          : `${s.submitted}/${s.expected_weeks} (${s.submission_rate}%)`,
        `${s.fajr}%`,
        `${s.dhuhr}%`,
        `${s.asr}%`,
        `${s.maghrib}%`,
        `${s.isha}%`,
        `${s.overall_rate}%`,
      ]),
      filenameBase: "prayer-compliance",
    });
  };

  // Summary stats
  const ratedRows = reportData.filter((r) => r.submission_rate !== null);
  const avgSubmission =
    ratedRows.length > 0
      ? Math.round(
          ratedRows.reduce((s, r) => s + (r.submission_rate || 0), 0) /
            ratedRows.length,
        )
      : 0;
  const avgOverall =
    reportData.length > 0
      ? Math.round(
          reportData.reduce((s, r) => s + r.overall_rate, 0) /
            reportData.length,
        )
      : 0;
  const neverSubmitted = reportData.filter((r) => r.total_sheets === 0).length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="form-input"
          >
            <option value="">All Classes</option>
            {visibleClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={generateReport}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Generate Report
            </>
          )}
        </button>
        {reportData.length > 0 && (
          <>
            <button
              onClick={exportToCSV}
              className="btn-outline flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="btn-outline flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </>
        )}
      </div>

      {/* Summary Cards */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{reportData.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Students</p>
          </div>
          <div
            className={`rounded-lg border p-4 text-center ${avgSubmission >= 80 ? "bg-green-50 dark:bg-green-900/20 border-green-200" : avgSubmission >= 50 ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200" : "bg-red-50 dark:bg-red-900/20 border-red-200"}`}
          >
            <p className={`text-2xl font-bold ${getRateColor(avgSubmission)}`}>
              {avgSubmission}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg Participation
            </p>
          </div>
          <div
            className={`rounded-lg border p-4 text-center ${avgOverall >= 80 ? "bg-green-50 dark:bg-green-900/20 border-green-200" : avgOverall >= 50 ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200" : "bg-red-50 dark:bg-red-900/20 border-red-200"}`}
          >
            <p className={`text-2xl font-bold ${getRateColor(avgOverall)}`}>
              {avgOverall}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg Prayer Rate
            </p>
          </div>
          <div
            className={`rounded-lg border p-4 text-center ${neverSubmitted > 0 ? "bg-red-50 dark:bg-red-900/20 border-red-200" : "bg-card border-border"}`}
          >
            <p
              className={`text-2xl font-bold ${neverSubmitted > 0 ? "text-red-600" : "text-foreground"}`}
            >
              {neverSubmitted}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Never Submitted
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {reportData.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
            <h4 className="font-semibold text-sm">
              Prayer Compliance by Student
            </h4>
            <p className="text-xs text-muted-foreground">
              Click column headers to sort
            </p>
          </div>
          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-border">
            {sorted.map((student) => (
              <div key={student.student_id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.number} · {student.class_name}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${getRateBg(student.overall_rate)}`}
                  >
                    {student.overall_rate}% overall
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center text-xs">
                  {[
                    { name: "Fajr", val: student.fajr },
                    { name: "Dhuhr", val: student.dhuhr },
                    { name: "Asr", val: student.asr },
                    { name: "Maghrib", val: student.maghrib },
                    { name: "Isha", val: student.isha },
                  ].map((p) => (
                    <div key={p.name}>
                      <p className={`font-medium ${getRateColor(p.val)}`}>
                        {p.val}%
                      </p>
                      <p className="text-muted-foreground">{p.name}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {student.submission_rate === null
                    ? "Weeks: — (enrolled after tracking start)"
                    : `Weeks submitted: ${student.submitted}/${student.expected_weeks} (${student.submission_rate}%)`}
                </p>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th
                    className="px-4 py-2 text-left font-medium cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    Student{" "}
                    {sortBy === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-4 py-2 text-left font-medium">Class</th>
                  <th
                    className="px-4 py-2 text-center font-medium cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("submission_rate")}
                    title="Weeks submitted ÷ expected weeks (from enrolment / tracking start)"
                  >
                    Weeks{" "}
                    {sortBy === "submission_rate"
                      ? sortDir === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-green-600">
                    Fajr
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-blue-600">
                    Dhuhr
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-orange-600">
                    Asr
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-purple-600">
                    Maghrib
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-indigo-600">
                    Isha
                  </th>
                  <th
                    className="px-4 py-2 text-center font-medium cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("overall_rate")}
                  >
                    Overall{" "}
                    {sortBy === "overall_rate"
                      ? sortDir === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((student) => (
                  <tr key={student.student_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.number}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {student.class_name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {student.submission_rate === null ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getRateBg(student.submission_rate)}`}
                        >
                          {student.submitted}/{student.expected_weeks} (
                          {student.submission_rate}%)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-medium ${getRateColor(student.fajr)}`}
                      >
                        {student.fajr}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-medium ${getRateColor(student.dhuhr)}`}
                      >
                        {student.dhuhr}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-medium ${getRateColor(student.asr)}`}
                      >
                        {student.asr}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-medium ${getRateColor(student.maghrib)}`}
                      >
                        {student.maghrib}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-medium ${getRateColor(student.isha)}`}
                      >
                        {student.isha}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getRateBg(student.overall_rate)}`}
                      >
                        {student.overall_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportData.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground border border-border rounded-lg">
          <p className="text-sm">
            Select a class and click Generate Report to view prayer compliance
            data.
          </p>
        </div>
      )}
    </div>
  );
}
