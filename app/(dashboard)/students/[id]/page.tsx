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
  TrendingUp,
  Brain,
  Award,
  AlertCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { formatDate, calculateAge } from "@/lib/utils/helpers";

import StudentFeeAssignment from "@/components/fees/StudentFeeAssignment";
import FeeIndicator from "@/components/fees/FeeIndicator";
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

  // Get Academic Progress (FIXED - proper relationship)
  const { data: academicProgress } = await supabase
    .from("academic_progress")
    .select(
      `
      id,
      percentage,
      score,
      total_marks,
      assessment_name,
      assessment_date,
      curriculum_topic:curriculum_topics!inner (
        topic_name,
        subject_name
      )
    `
    )
    .eq("student_id", params.id)
    .order("assessment_date", { ascending: false })
    .limit(5);

  // Type definition
  type AcademicRecord = {
    id: string;
    percentage: number;
    score: number;
    total_marks: number;
    assessment_name: string;
    assessment_date: string;
    curriculum_topic: {
      topic_name: string;
      subject_name: string;
    };
  };

  // Calculate overall academic average with proper typing
  const typedAcademic = academicProgress as AcademicRecord[] | null;

  const overallAverage =
    typedAcademic && typedAcademic.length > 0
      ? Math.round(
          typedAcademic.reduce((sum, a) => sum + a.percentage, 0) /
            typedAcademic.length
        )
      : 0;

  // Get Memorization Progress (FIXED - was querying non-existent quran_progress table)
  // Get Memorization Progress (ALTERNATIVE - with type assertion)
  const { data: memorizationData } = await supabase
    .from("student_memorization")
    .select(
      `
      id,
      progress_stage,
      proficiency_rating,
      memorization_items!inner (
        id,
        title,
        category,
        arabic_text
      )
    `
    )
    .eq("student_id", params.id);

  // Type definition
  type MemorizationRecord = {
    id: string;
    progress_stage: string;
    proficiency_rating: number | null;
    memorization_items: {
      id: string;
      title: string;
      category: string;
      arabic_text: string;
    };
  };

  // Calculate memorization stats with proper typing
  const typedData = memorizationData as MemorizationRecord[] | null;

  const memorizationStats = typedData
    ? {
        duas: {
          total: typedData.filter(
            (m) => m.memorization_items.category === "dua"
          ).length,
          memorized: typedData.filter(
            (m) =>
              m.memorization_items.category === "dua" &&
              (m.progress_stage === "memorized" ||
                m.progress_stage === "mastered")
          ).length,
          mastered: typedData.filter(
            (m) =>
              m.memorization_items.category === "dua" &&
              m.progress_stage === "mastered"
          ).length,
        },
        surahs: {
          total: typedData.filter(
            (m) => m.memorization_items.category === "surah"
          ).length,
          memorized: typedData.filter(
            (m) =>
              m.memorization_items.category === "surah" &&
              (m.progress_stage === "memorized" ||
                m.progress_stage === "mastered")
          ).length,
          mastered: typedData.filter(
            (m) =>
              m.memorization_items.category === "surah" &&
              m.progress_stage === "mastered"
          ).length,
        },
        hadiths: {
          total: typedData.filter(
            (m) => m.memorization_items.category === "hadith"
          ).length,
          memorized: typedData.filter(
            (m) =>
              m.memorization_items.category === "hadith" &&
              (m.progress_stage === "memorized" ||
                m.progress_stage === "mastered")
          ).length,
          mastered: typedData.filter(
            (m) =>
              m.memorization_items.category === "hadith" &&
              m.progress_stage === "mastered"
          ).length,
        },
      }
    : null;

  // Calculate overall memorization percentage
  const overallMemorization = memorizationStats
    ? Math.round(
        ((memorizationStats.duas.memorized +
          memorizationStats.surahs.memorized +
          memorizationStats.hadiths.memorized) /
          45) *
          100
      )
    : 0;

  // Get Certificates (NEW)
  const { data: certificates } = await supabase
    .from("certificates")
    .select("id, certificate_type, certificate_number, issued_date")
    .eq("student_id", params.id)
    .order("issued_date", { ascending: false })
    .limit(5);

  // Get Active Fines (NEW)
  const { data: activeFines } = await supabase
    .from("fines")
    .select("id, fine_type, amount, issued_date, notes")
    .eq("student_id", params.id)
    .eq("status", "pending")
    .order("issued_date", { ascending: false });

  const totalFines = activeFines?.reduce((sum, f) => sum + f.amount, 0) || 0;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present:
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      absent: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      late: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
      excused:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      sick: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
    };
    return (
      colors[status] ||
      "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300"
    );
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
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    student.status === "active"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : student.status === "withdrawn"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                      : student.status === "graduated"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                  }`}
                >
                  {student.status.charAt(0).toUpperCase() +
                    student.status.slice(1)}
                  {student.withdrawal_date &&
                    ` since ${formatDate(student.withdrawal_date)}`}
                </span>
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

          {/* Academic Progress (NEW) */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Academic Progress</h3>
              </div>
              <Link
                href={`/curriculum-assessment/assessments?student=${student.id}`}
                className="text-sm text-primary hover:underline"
              >
                View All →
              </Link>
            </div>

            {typedAcademic && typedAcademic.length > 0 ? (
              <div className="space-y-4">
                {/* Overall Average */}
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Overall Average
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {overallAverage}%
                  </p>
                </div>

                {/* Recent Assessments */}
                <div className="space-y-2">
                  {typedAcademic.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {assessment.curriculum_topic?.subject_name ||
                            "General"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assessment.assessment_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(assessment.assessment_date, "short")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-lg font-bold ${
                            assessment.percentage >= 80
                              ? "text-green-600 dark:text-green-400"
                              : assessment.percentage >= 60
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-orange-600 dark:text-orange-400"
                          }`}
                        >
                          {assessment.percentage}%
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {assessment.score}/{assessment.total_marks}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No academic assessments recorded yet.
              </p>
            )}
          </div>

          {/* Memorization Progress (FIXED - renamed from "Quran Progress") */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Memorization Progress</h3>
              </div>
              <Link
                href={`/curriculum-assessment/memorization?student=${student.id}`}
                className="text-sm text-primary hover:underline"
              >
                View Details →
              </Link>
            </div>

            {memorizationStats ? (
              <div className="space-y-4">
                {/* Progress Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                      Duas
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {memorizationStats.duas.memorized}/15
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                      Surahs
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {memorizationStats.surahs.memorized}/15
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">
                      Hadiths
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {memorizationStats.hadiths.memorized}/15
                    </p>
                  </div>
                </div>

                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Completion</span>
                    <span className="font-semibold">
                      {overallMemorization}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${overallMemorization}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No memorization progress recorded yet.
              </p>
            )}
          </div>

          {/* Notes & Medical Information (IMPROVED) */}
          {(student.medical_notes || student.notes) && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Notes & Medical Information
              </h3>
              <div className="space-y-4">
                {student.medical_notes && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-100 mb-1">
                          Medical Notes
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          {student.medical_notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {student.notes && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          General Notes
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {student.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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

          {/* Fee Information */}
          <StudentProfileClient studentId={student.id} />

          {/* Fee History */}
          <StudentFeeHistory studentId={student.id} />

          {/* Active Fines (NEW) */}
          {activeFines && activeFines.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold">Active Fines</h3>
              </div>

              <div className="space-y-3">
                {activeFines.map((fine) => (
                  <div
                    key={fine.id}
                    className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {fine.fine_type.replace("_", " ")}
                      </span>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        £{fine.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Issued: {formatDate(fine.issued_date, "short")}
                    </p>
                    {fine.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {fine.notes}
                      </p>
                    )}
                  </div>
                ))}
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Total Outstanding
                    </span>
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      £{totalFines.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/fines?student=${student.id}`}
                  className="text-sm text-primary hover:underline block text-center mt-2"
                >
                  View all fines →
                </Link>
              </div>
            </div>
          )}

          {/* Certificates (NEW) */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Certificates</h3>
            </div>

            {certificates && certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3 border border-border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm capitalize">
                          {cert.certificate_type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cert.certificate_number}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Issued: {formatDate(cert.issued_date, "short")}
                        </p>
                      </div>
                      <Award className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    </div>
                  </div>
                ))}
                <Link
                  href={`/curriculum-assessment/certificates?student=${student.id}`}
                  className="text-sm text-primary hover:underline block text-center"
                >
                  View All Certificates →
                </Link>
              </div>
            ) : (
              <p className="text-center py-6 text-sm text-muted-foreground">
                No certificates issued yet.
              </p>
            )}
          </div>

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
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {presentCount}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Present
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {absentCount}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Absent
                  </p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {lateCount}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Late
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 border border-border rounded-lg">
                  <p className="text-2xl font-bold">{totalAttendance}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
