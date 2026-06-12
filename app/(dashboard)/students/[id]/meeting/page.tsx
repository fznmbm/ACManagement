"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Printer,
  User,
  Calendar,
  BookOpen,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Star,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/helpers";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  enrollment_date: string;
  status: string;
  classes?: { name: string } | null;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

interface FeedbackSession {
  id: string;
  session_date: string;
  class_summary: string;
  homework: string | null;
  studentNote: string | null;
}

interface AcademicNote {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

interface PrayerSummary {
  total_sheets: number;
  submitted: number;
  fajr_rate: number;
  dhuhr_rate: number;
  asr_rate: number;
  maghrib_rate: number;
  isha_rate: number;
}

interface Fine {
  id: string;
  fine_type: string;
  amount: number;
  status: string;
  issued_date: string;
  reason: string | null;
}

export default function ParentMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [feedbackSessions, setFeedbackSessions] = useState<FeedbackSession[]>(
    [],
  );
  const [academicNotes, setAcademicNotes] = useState<AcademicNote[]>([]);
  const [prayerSummary, setPrayerSummary] = useState<PrayerSummary | null>(
    null,
  );
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingDate] = useState(
    new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );

  useEffect(() => {
    fetchAllData();
  }, [params.id]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const studentId = params.id as string;

      // Fetch student details
      const { data: studentData } = await supabase
        .from("students")
        .select("*, classes(name)")
        .eq("id", studentId)
        .single();

      if (!studentData) {
        router.push("/students");
        return;
      }
      setStudent(studentData);

      // Fetch attendance summary
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", studentId);

      if (attendanceData) {
        const summary = {
          total: attendanceData.length,
          present: attendanceData.filter((a) => a.status === "present").length,
          absent: attendanceData.filter((a) => a.status === "absent").length,
          late: attendanceData.filter((a) => a.status === "late").length,
          excused: attendanceData.filter((a) => a.status === "excused").length,
        };
        setAttendance(summary);
      }

      // Fetch class feedback sessions with student notes
      const { data: classData } = await supabase
        .from("class_feedback_sessions")
        .select("id, session_date, class_summary, homework")
        .eq("class_id", studentData.class_id)
        .eq("status", "completed")
        .order("session_date", { ascending: false })
        .limit(20);

      if (classData && classData.length > 0) {
        const sessionIds = classData.map((s) => s.id);
        const { data: notesData } = await supabase
          .from("student_feedback")
          .select("session_id, feedback_text")
          .eq("student_id", studentId)
          .in("session_id", sessionIds);

        const notesMap: Record<string, string> = {};
        notesData?.forEach((n) => {
          notesMap[n.session_id] = n.feedback_text;
        });

        setFeedbackSessions(
          classData.map((s) => ({
            ...s,
            studentNote: notesMap[s.id] || null,
          })),
        );
      }

      // Fetch academic notes from parent_notifications
      const { data: linksData } = await supabase
        .from("parent_student_links")
        .select("parent_user_id")
        .eq("student_id", studentId)
        .eq("is_primary", true)
        .single();

      if (linksData?.parent_user_id) {
        const { data: notesData } = await supabase
          .from("parent_notifications")
          .select("id, title, message, created_at")
          .eq("parent_user_id", linksData.parent_user_id)
          .eq("student_id", studentId)
          .eq("type", "academic_note")
          .order("created_at", { ascending: false });

        setAcademicNotes(notesData || []);
      }

      // Fetch prayer summary
      const { data: prayerData } = await supabase
        .from("prayer_sheets")
        .select("*")
        .eq("student_id", studentId);

      if (prayerData && prayerData.length > 0) {
        const submitted = prayerData.filter((p) => p.submitted).length;
        const calcRate = (prayer: string) => {
          const total = prayerData.reduce((sum, sheet) => {
            const days = sheet.prayers || {};
            return (
              sum +
              Object.values(days).filter((d: any) => d[prayer] !== undefined)
                .length
            );
          }, 0);
          const prayed = prayerData.reduce((sum, sheet) => {
            const days = sheet.prayers || {};
            return (
              sum +
              Object.values(days).filter((d: any) => d[prayer] === true).length
            );
          }, 0);
          return total > 0 ? Math.round((prayed / total) * 100) : 0;
        };

        setPrayerSummary({
          total_sheets: prayerData.length,
          submitted,
          fajr_rate: calcRate("fajr"),
          dhuhr_rate: calcRate("dhuhr"),
          asr_rate: calcRate("asr"),
          maghrib_rate: calcRate("maghrib"),
          isha_rate: calcRate("isha"),
        });
      }

      // Fetch fines
      const { data: finesData } = await supabase
        .from("fines")
        .select("id, fine_type, amount, status, issued_date, reason")
        .eq("student_id", studentId)
        .order("issued_date", { ascending: false });

      setFines(finesData || []);
    } catch (err) {
      console.error("Error fetching meeting data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const attendanceRate =
    attendance && attendance.total > 0
      ? Math.round((attendance.present / attendance.total) * 100)
      : 0;

  const pendingFines = fines.filter((f) => f.status === "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { background: white !important; }
          .print-area { padding: 0 !important; }
        }
      `}</style>

      <div className="space-y-6 print-area">
        {/* Header — hidden on print */}
        <div className="no-print flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/students/${student.id}`}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                Parent Meeting View
              </h1>
              <p className="text-sm text-muted-foreground">
                {student.first_name} {student.last_name} · {meetingDate}
              </p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>

        {/* Print header — only shown on print */}
        <div className="hidden print:block border-b-2 border-primary pb-4 mb-6">
          <h1 className="text-2xl font-bold text-primary">
            Al Hikmah Institute Crawley
          </h1>
          <p className="text-lg font-semibold mt-1">Parent Meeting Report</p>
          <p className="text-sm text-gray-600 mt-1">{meetingDate}</p>
        </div>

        {/* Student Info Card */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-lg">
                {student.first_name[0]}
                {student.last_name[0]}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {student.first_name} {student.last_name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Student #</p>
                  <p className="font-medium">{student.student_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Class</p>
                  <p className="font-medium">
                    {student.classes?.name || "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Parent</p>
                  <p className="font-medium">{student.parent_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Enrolled</p>
                  <p className="font-medium">
                    {formatDate(student.enrollment_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Attendance Rate */}
          <div
            className={`rounded-xl border p-4 text-center ${
              attendanceRate >= 80
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : attendanceRate >= 60
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <p
              className={`text-3xl font-bold ${
                attendanceRate >= 80
                  ? "text-green-700 dark:text-green-400"
                  : attendanceRate >= 60
                    ? "text-yellow-700 dark:text-yellow-400"
                    : "text-red-700 dark:text-red-400"
              }`}
            >
              {attendanceRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Attendance Rate
            </p>
            <p className="text-xs text-muted-foreground">
              {attendance?.present}/{attendance?.total} sessions
            </p>
          </div>

          {/* Absences */}
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {attendance?.absent || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Absences</p>
            <p className="text-xs text-muted-foreground">
              {attendance?.late || 0} late · {attendance?.excused || 0} excused
            </p>
          </div>

          {/* Prayer Submission */}
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {prayerSummary
                ? Math.round(
                    (prayerSummary.submitted / prayerSummary.total_sheets) *
                      100,
                  )
                : 0}
              %
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Prayer Submission
            </p>
            <p className="text-xs text-muted-foreground">
              {prayerSummary?.submitted || 0}/{prayerSummary?.total_sheets || 0}{" "}
              sheets
            </p>
          </div>

          {/* Pending Fines */}
          <div
            className={`rounded-xl border p-4 text-center ${
              pendingFines.length > 0
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-card border-border"
            }`}
          >
            <p
              className={`text-3xl font-bold ${
                pendingFines.length > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-foreground"
              }`}
            >
              £{pendingFines.reduce((sum, f) => sum + f.amount, 0).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding Fines
            </p>
            <p className="text-xs text-muted-foreground">
              {pendingFines.length} pending
            </p>
          </div>
        </div>

        {/* Prayer Breakdown */}
        {prayerSummary && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              🙏 Prayer Compliance
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {[
                { name: "Fajr", rate: prayerSummary.fajr_rate },
                { name: "Dhuhr", rate: prayerSummary.dhuhr_rate },
                { name: "Asr", rate: prayerSummary.asr_rate },
                { name: "Maghrib", rate: prayerSummary.maghrib_rate },
                { name: "Isha", rate: prayerSummary.isha_rate },
              ].map((prayer) => (
                <div key={prayer.name} className="text-center">
                  <div
                    className={`text-lg font-bold ${
                      prayer.rate >= 80
                        ? "text-green-600 dark:text-green-400"
                        : prayer.rate >= 50
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {prayer.rate}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {prayer.name}
                  </div>
                  <div
                    className={`h-1.5 rounded-full mt-1 ${
                      prayer.rate >= 80
                        ? "bg-green-500"
                        : prayer.rate >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${prayer.rate}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Academic Notes */}
        {academicNotes.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              📝 Academic Notes
              <span className="text-xs font-normal text-muted-foreground">
                ({academicNotes.length})
              </span>
            </h3>
            <div className="space-y-3">
              {academicNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-primary/5 border border-primary/20 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{note.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {note.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Class Feedback Sessions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Class Feedback History
            <span className="text-xs font-normal text-muted-foreground">
              (last {feedbackSessions.length} sessions)
            </span>
          </h3>
          {feedbackSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No feedback sessions recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {feedbackSessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {new Date(session.session_date).toLocaleDateString(
                        "en-GB",
                        {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
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
                  {session.homework && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded px-3 py-1.5">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                        📝 Homework:{" "}
                        <span className="font-normal">{session.homework}</span>
                      </p>
                    </div>
                  )}
                  {session.studentNote && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded px-3 py-1.5">
                      <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                        💬 Personal Note:{" "}
                        <span className="font-normal">
                          {session.studentNote}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fines History */}
        {fines.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Fines Record
            </h3>
            <div className="space-y-2">
              {fines.map((fine) => (
                <div
                  key={fine.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg text-sm"
                >
                  <div>
                    <p className="font-medium capitalize">
                      {fine.fine_type.replace("_", " ")}
                    </p>
                    {fine.reason && (
                      <p className="text-xs text-muted-foreground">
                        {fine.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(fine.issued_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">£{fine.amount.toFixed(2)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        fine.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {fine.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print footer */}
        <div className="hidden print:block border-t border-gray-200 pt-4 mt-8 text-xs text-gray-500 text-center">
          <p>
            Al Hikmah Institute Crawley · Confidential Parent Meeting Report ·{" "}
            {meetingDate}
          </p>
          <p className="mt-1">
            +44 7411 061242 | +44 7738 314404 |
            alhikmahinstitutecrawley@gmail.com
          </p>
        </div>
      </div>
    </>
  );
}
