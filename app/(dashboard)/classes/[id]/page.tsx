// app/(dashboard)/classes/[id]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Users,
  Calendar,
  Clock,
  MapPin,
  User,
} from "lucide-react";

export default async function ClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get class with teacher info
  const { data: classData, error } = await supabase
    .from("classes")
    .select(
      `
      *,
      profiles:teacher_id (
        id,
        full_name,
        email,
        phone
      )
    `
    )
    .eq("id", params.id)
    .single();

  if (error || !classData) {
    notFound();
  }

  // Get students in this class
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_number, status")
    .eq("class_id", params.id)
    .order("last_name");

  const activeStudents = students?.filter((s) => s.status === "active") || [];
  const inactiveStudents = students?.filter((s) => s.status !== "active") || [];

  // Get attendance statistics for this class
  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("status")
    .eq("class_id", params.id);

  const totalRecords = attendanceRecords?.length || 0;
  const presentCount =
    attendanceRecords?.filter((a) => a.status === "present").length || 0;
  const attendanceRate =
    totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  const canEdit = ["super_admin", "admin"].includes(profile?.role || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/classes"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold">{classData.name}</h2>
            <p className="text-muted-foreground">
              {classData.level && `${classData.level} • `}
              {classData.academic_year || "No academic year set"}
            </p>
          </div>
        </div>
        {canEdit && (
          <Link
            href={`/classes/${classData.id}/edit`}
            className="btn-primary flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Class</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Class Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Class Information</h3>
            <div className="space-y-4">
              {classData.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{classData.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="font-medium">
                    {classData.level || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">
                    {activeStudents.length} /{" "}
                    {classData.capacity || "Unlimited"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Academic Year</p>
                  <p className="font-medium">
                    {classData.academic_year || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      classData.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {classData.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          {classData.schedule && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Schedule</h3>
              <div className="space-y-3">
                {classData.schedule.days &&
                  classData.schedule.days.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Days</p>
                        <p className="font-medium">
                          {classData.schedule.days.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                {classData.schedule.time && (
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{classData.schedule.time}</p>
                    </div>
                  </div>
                )}

                {classData.schedule.room && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{classData.schedule.room}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teacher Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Teacher</h3>
            {classData.profiles ? (
              <div className="flex items-start space-x-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{classData.profiles.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {classData.profiles.email}
                  </p>
                  {classData.profiles.phone && (
                    <p className="text-sm text-muted-foreground">
                      {classData.profiles.phone}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No teacher assigned</p>
            )}
          </div>

          {/* Students List */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Students ({activeStudents.length})
              </h3>
              <Link
                href={`/students?class=${classData.id}`}
                className="text-sm text-primary hover:underline"
              >
                View all →
              </Link>
            </div>

            {activeStudents.length > 0 ? (
              <div className="space-y-2">
                {activeStudents.slice(0, 10).map((student) => (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-sm font-semibold">
                          {student.first_name.charAt(0)}
                          {student.last_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          #{student.student_number}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      View →
                    </span>
                  </Link>
                ))}
                {activeStudents.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{activeStudents.length - 10} more students
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No students enrolled in this class yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Statistics */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold">{activeStudents.length}</p>
                <p className="text-sm text-muted-foreground">Active Students</p>
              </div>

              {inactiveStudents.length > 0 && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">
                    {inactiveStudents.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Inactive Students
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Attendance Rate</h3>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${attendanceRate * 3.51}, 351`}
                    className="text-primary"
                  />
                </svg>
                <span className="absolute text-2xl font-bold">
                  {attendanceRate}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Based on {totalRecords} attendance records
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/attendance?class=${classData.id}`}
                className="btn-primary w-full"
              >
                Mark Attendance
              </Link>

              {/* ADD THIS NEW BUTTON 👇 */}
              <Link
                href={`/classes/${classData.id}/feedback`}
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
              >
                📝 Send End of Class Feedback
              </Link>

              {/* View Attendance History Button */}
              <Link
                href={`/attendance/history?class=${classData.id}`}
                className="btn-outline w-full"
              >
                View Attendance History
              </Link>

              {/* Manage Students Button */}
              <Link
                href={`/students?class=${classData.id}`}
                className="btn-outline w-full"
              >
                Manage Students
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
