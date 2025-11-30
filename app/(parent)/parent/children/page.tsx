"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  GraduationCap,
  Wallet,
  Award,
  ChevronRight,
  User,
  Heart,
  AlertCircle,
} from "lucide-react";

interface StudentLink {
  id: string;
  student_id: string;
  relationship: string;
  is_primary: boolean;
  can_view_attendance: boolean;
  can_view_grades: boolean;
  can_view_financial: boolean;
  can_receive_notifications: boolean;
  students: {
    id: string;
    student_number: string;
    first_name: string;
    last_name: string;
    arabic_name?: string;
    date_of_birth: string;
    gender: string;
    status: "active" | "inactive" | "graduated" | "withdrawn";
    class_id?: string;
    classes?: {
      name: string;
      level: string;
    };
  };
}

interface StudentStats {
  attendance: {
    total: number;
    present: number;
    rate: number;
  };
  grades: {
    average: number;
    assessmentCount: number;
  };
  financial: {
    totalFines: number;
    unpaidFines: number;
    unpaidFees: number;
  };
}

export default function MyChildrenPage() {
  const supabase = createClient();
  const router = useRouter();

  const [children, setChildren] = useState<StudentLink[]>([]);
  const [stats, setStats] = useState<Map<string, StudentStats>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch linked students
      const { data, error } = await supabase
        .from("parent_student_links")
        .select(
          `
          id,
          student_id,
          relationship,
          is_primary,
          can_view_attendance,
          can_view_grades,
          can_view_financial,
          can_receive_notifications,
          students (
            id,
            student_number,
            first_name,
            last_name,
            arabic_name,
            date_of_birth,
            gender,
            status,
            class_id,
            classes (
              name,
              level
            )
          )
        `
        )
        .eq("parent_user_id", user.id)
        .order("is_primary", { ascending: false });

      if (error) throw error;

      setChildren(data || []);

      // Fetch stats for each student
      if (data && data.length > 0) {
        const statsMap = new Map<string, StudentStats>();

        for (const link of data) {
          const studentStats = await fetchStudentStats(
            link.student_id,
            link.can_view_attendance,
            link.can_view_grades,
            link.can_view_financial
          );
          statsMap.set(link.student_id, studentStats);
        }

        setStats(statsMap);
      }
    } catch (err) {
      console.error("Error fetching children:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStats = async (
    studentId: string,
    canViewAttendance: boolean,
    canViewGrades: boolean,
    canViewFinancial: boolean
  ): Promise<StudentStats> => {
    const defaultStats: StudentStats = {
      attendance: { total: 0, present: 0, rate: 0 },
      grades: { average: 0, assessmentCount: 0 },
      financial: { totalFines: 0, unpaidFines: 0, unpaidFees: 0 },
    };

    // Attendance stats
    if (canViewAttendance) {
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", studentId);

      if (attendanceData) {
        const total = attendanceData.length;
        const present = attendanceData.filter(
          (a) => a.status === "present"
        ).length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        defaultStats.attendance = { total, present, rate };
      }
    }

    // Grades stats
    if (canViewGrades) {
      const { data: gradesData } = await supabase
        .from("academic_progress")
        .select("percentage")
        .eq("student_id", studentId);

      if (gradesData && gradesData.length > 0) {
        const average = Math.round(
          gradesData.reduce((sum, g) => sum + g.percentage, 0) /
            gradesData.length
        );
        defaultStats.grades = {
          average,
          assessmentCount: gradesData.length,
        };
      }
    }

    // Financial stats
    if (canViewFinancial) {
      const { data: finesData } = await supabase
        .from("fines")
        .select("amount, status")
        .eq("student_id", studentId);

      const { data: feesData } = await supabase
        .from("fee_invoices")
        .select("amount_due, amount_paid")
        .eq("student_id", studentId);

      if (finesData) {
        const totalFines = finesData.length;
        const unpaidFines = finesData.filter(
          (f) => f.status === "pending"
        ).length;
        defaultStats.financial.totalFines = totalFines;
        defaultStats.financial.unpaidFines = unpaidFines;
      }

      if (feesData) {
        const unpaidFees = feesData.filter(
          (f) => f.amount_due > f.amount_paid
        ).length;
        defaultStats.financial.unpaidFees = unpaidFees;
      }
    }

    return defaultStats;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800";
      case "inactive":
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600";
      case "graduated":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "withdrawn":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getRelationshipIcon = (relationship: string) => {
    const rel = relationship.toLowerCase();
    if (rel.includes("mother") || rel.includes("father")) return "👨‍👩‍👦";
    if (rel.includes("guardian")) return "🛡️";
    if (rel.includes("aunt") || rel.includes("uncle")) return "👥";
    return "👤";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              My Children
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {children.length} {children.length === 1 ? "child" : "children"}{" "}
              registered
            </p>
          </div>
        </div>

        {/* Empty State */}
        {children.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Users className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No Children Linked
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              You don't have any children linked to your account yet. Please
              contact the school administration to link your children.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">
                    Need Help?
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Contact the school administration to link your children to
                    your parent portal account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Children Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((link) => {
              const student = link.students;
              const studentStats = stats.get(link.student_id) || {
                attendance: { total: 0, present: 0, rate: 0 },
                grades: { average: 0, assessmentCount: 0 },
                financial: { totalFines: 0, unpaidFines: 0, unpaidFees: 0 },
              };

              return (
                <div
                  key={link.id}
                  onClick={() => router.push(`/parent/student/${student.id}`)}
                  className="bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                      {/* Student Avatar */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                          {getInitials(student.first_name, student.last_name)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {student.first_name} {student.last_name}
                          </h3>
                          {student.arabic_name && (
                            <p
                              className="text-sm text-slate-600 dark:text-slate-400"
                              dir="rtl"
                            >
                              {student.arabic_name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Primary Badge */}
                      {link.is_primary && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                          <Heart className="h-3 w-3 fill-current" />
                          Primary
                        </span>
                      )}
                    </div>

                    {/* Student Info */}
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {student.student_number}
                      </span>
                      <span>•</span>
                      <span>Age {calculateAge(student.date_of_birth)}</span>
                      <span>•</span>
                      <span className="capitalize">{student.gender}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Status & Class */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          student.status
                        )}`}
                      >
                        {student.status.toUpperCase()}
                      </span>
                      {student.classes && (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {student.classes.name}
                        </span>
                      )}
                    </div>

                    {/* Relationship */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                      <span className="text-xl">
                        {getRelationshipIcon(link.relationship)}
                      </span>
                      <span className="font-medium capitalize">
                        {link.relationship}
                      </span>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Attendance */}
                      {link.can_view_attendance && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                          <Calendar className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-green-700 dark:text-green-400">
                            {studentStats.attendance.rate}%
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-500">
                            Attendance
                          </p>
                        </div>
                      )}

                      {/* Grades */}
                      {link.can_view_grades && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                          <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                            {studentStats.grades.average}%
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-500">
                            Average
                          </p>
                        </div>
                      )}

                      {/* Financial */}
                      {link.can_view_financial && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center">
                          <Wallet className="h-4 w-4 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                            {studentStats.financial.unpaidFines +
                              studentStats.financial.unpaidFees}
                          </p>
                          <p className="text-xs text-orange-600 dark:text-orange-500">
                            Pending
                          </p>
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors group-hover:shadow-md">
                      <span>View Details</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Permissions Info */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        Access Permissions:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {link.can_view_attendance && (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                            Attendance
                          </span>
                        )}
                        {link.can_view_grades && (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                            Grades
                          </span>
                        )}
                        {link.can_view_financial && (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                            Financial
                          </span>
                        )}
                        {link.can_receive_notifications && (
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                            Notifications
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        {children.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">
                  About Access Permissions
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Your access permissions are set by the school administration.
                  If you need access to additional information, please contact
                  the school office. The "Primary" badge indicates your main
                  contact for that child.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
