// app/(dashboard)/students/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";
import { formatDate, calculateAge } from "@/lib/utils/helpers";

import StudentFeeAssignment from "@/components/fees/StudentFeeAssignment";
import FeeIndicator from "@/components/fees/FeeIndicator";
import { useFees } from "@/hooks/useFees";
import StudentProfileClient from "@/components/students/StudentProfileClient";
import StudentFeeHistory from "@/components/students/StudentFeeHistory";

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get student with class info
  const { data: student, error } = await supabase
    .from("students")
    .select(
      `
      *,
      classes (
        id,
        name,
        level
      ),
       status_changed_by:profiles!students_status_changed_by_fkey (full_name)
    `
    )
    .eq("id", params.id)
    .single();

  if (error || !student) {
    notFound();
  }

  // Get attendance statistics
  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("status")
    .eq("student_id", params.id);

  const totalAttendance = attendanceRecords?.length || 0;
  const presentCount =
    attendanceRecords?.filter((a) => a.status === "present").length || 0;
  const absentCount =
    attendanceRecords?.filter((a) => a.status === "absent").length || 0;
  const lateCount =
    attendanceRecords?.filter((a) => a.status === "late").length || 0;
  const attendanceRate =
    totalAttendance > 0
      ? Math.round((presentCount / totalAttendance) * 100)
      : 0;

  // Get recent attendance (last 10)
  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select("date, status, notes")
    .eq("student_id", params.id)
    .order("date", { ascending: false })
    .limit(10);

  // Get Quran progress
  const { data: quranProgress } = await supabase
    .from("quran_progress")
    .select("*")
    .eq("student_id", params.id)
    .order("started_date", { ascending: false })
    .limit(5);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      late: "bg-orange-100 text-orange-800",
      excused: "bg-blue-100 text-blue-800",
      sick: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/students"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-muted-foreground">
              Student #{student.student_number}
            </p>
          </div>
        </div>
        <Link
          href={`/students/${student.id}/edit`}
          className="btn-primary flex items-center space-x-2"
        >
          <Edit className="h-4 w-4" />
          <span>Edit Student</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">
                  {student.first_name} {student.last_name}
                </p>
              </div>
              {student.arabic_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Arabic Name</p>
                  <p className="font-medium rtl">{student.arabic_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {student.date_of_birth
                    ? formatDate(student.date_of_birth, "long")
                    : "Not provided"}
                  {student.date_of_birth && (
                    <span className="text-muted-foreground ml-2">
                      ({calculateAge(student.date_of_birth)} years old)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{student.gender}</p>
              </div>
              {/* <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    student.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {student.status}
                </span>
              </div> */}
              {/* Status Information Section */}
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1">
                  <span
                    className={`
      px-3 py-1 text-sm font-medium rounded-full
      ${
        student.status === "active"
          ? "bg-green-100 text-green-800"
          : student.status === "withdrawn"
          ? "bg-red-100 text-red-800"
          : student.status === "graduated"
          ? "bg-blue-100 text-blue-800"
          : "bg-yellow-100 text-yellow-800"
      }
    `}
                  >
                    {student.status.charAt(0).toUpperCase() +
                      student.status.slice(1)}
                    {student.withdrawal_date &&
                      ` since ${formatDate(student.withdrawal_date)}`}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrollment Date</p>
                <p className="font-medium">
                  {student.enrollment_date
                    ? formatDate(student.enrollment_date, "short")
                    : "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Parent/Guardian Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{student.parent_name}</p>
                </div>
              </div>
              {student.parent_email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${student.parent_email}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {student.parent_email}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${student.parent_phone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {student.parent_phone}
                  </a>
                  {student.parent_phone_secondary && (
                    <span className="text-muted-foreground ml-2">
                      / {student.parent_phone_secondary}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          {(student.address || student.city) && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Address</h3>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  {student.address && <p>{student.address}</p>}
                  {student.city && (
                    <p className="text-muted-foreground">
                      {student.city} {student.postal_code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Attendance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
            {recentAttendance && recentAttendance.length > 0 ? (
              <div className="space-y-2">
                {recentAttendance.map((att, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(att.date, "short")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {att.notes && (
                        <span className="text-sm text-muted-foreground italic">
                          {att.notes}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          att.status
                        )}`}
                      >
                        {att.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No attendance records yet.
              </p>
            )}
            <div className="mt-4">
              <Link
                href={`/attendance/history?student=${student.id}`}
                className="text-sm text-primary hover:underline"
              >
                View full attendance history →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Progress */}
        <div className="space-y-6">
          {/* Class Info */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Class Information</h3>
            {student.classes ? (
              <div>
                <p className="font-medium">{student.classes.name}</p>
                <p className="text-sm text-muted-foreground">
                  {student.classes.level}
                </p>
                <Link
                  href={`/classes/${student.classes.id}`}
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  View class details →
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground">No class assigned</p>
            )}
          </div>

          {/* ADD THE FEE INFORMATION SECTION RIGHT HERE */}
          <StudentProfileClient studentId={student.id} />

          {/* Fee History & Status - ADD THIS */}
          <StudentFeeHistory studentId={student.id} />
          {/* Fee Information - ADD THIS NEW SECTION
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Fee Information</h3>
            <StudentFeeAssignment
              studentId={student.id}
              onUpdate={() => {
                // Could add refresh logic here if needed
              }}
            />
          </div> */}

          {/* Attendance Statistics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Attendance Statistics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Attendance Rate</span>
                  <span className="text-2xl font-bold text-primary">
                    {attendanceRate}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {presentCount}
                  </p>
                  <p className="text-xs text-green-600">Present</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-700">
                    {absentCount}
                  </p>
                  <p className="text-xs text-red-600">Absent</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-700">
                    {lateCount}
                  </p>
                  <p className="text-xs text-orange-600">Late</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{totalAttendance}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quran Progress */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quran Progress</h3>
            {quranProgress && quranProgress.length > 0 ? (
              <div className="space-y-3">
                {quranProgress.map((progress) => (
                  <div
                    key={progress.id}
                    className="border-l-4 border-primary pl-3 py-2"
                  >
                    <p className="font-medium text-sm">{progress.surah_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {progress.verses_memorized}/{progress.verses_total} verses
                    </p>
                    {progress.proficiency_level && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full inline-block mt-1">
                        {progress.proficiency_level}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No Quran progress recorded yet.
              </p>
            )}
            <div className="mt-4">
              <Link
                href={`/progress?student=${student.id}`}
                className="text-sm text-primary hover:underline"
              >
                View detailed progress →
              </Link>
            </div>
          </div>

          {/* Notes */}
          {(student.medical_notes || student.notes) && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Notes</h3>
              {student.medical_notes && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-destructive">
                    Medical Notes:
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {student.medical_notes}
                  </p>
                </div>
              )}
              {student.notes && (
                <div>
                  <p className="text-sm font-medium">General Notes:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {student.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
