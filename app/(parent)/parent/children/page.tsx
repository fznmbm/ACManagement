"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Users, AlertCircle, ChevronRight } from "lucide-react";

interface StudentLink {
  id: string;
  student_id: string;
  relationship: string;
  is_primary: boolean;
  can_view_attendance: boolean;
  can_view_grades: boolean;
  can_view_financial: boolean;
  students: {
    id: string;
    student_number: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    status: string;
    class_id?: string;
    classes?: { name: string; level: string } | null;
  };
}

interface StudentStats {
  attendanceRate: number;
  gradesAverage: number;
  pendingFines: number;
  unpaidFees: number;
}

export default function MyChildrenPage() {
  const supabase = createClient();
  const router = useRouter();
  const [children, setChildren] = useState<StudentLink[]>([]);
  const [stats, setStats] = useState<Map<string, StudentStats>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(
    new Map(),
  );
  const [previews, setPreviews] = useState<
    Map<string, { title: string; type: string }>
  >(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("parent_student_links")
        .select(
          `id, student_id, relationship, is_primary, can_view_attendance, can_view_grades, can_view_financial,
          students(id, student_number, first_name, last_name, date_of_birth, gender, status, class_id, classes(name, level))`,
        )
        .eq("parent_user_id", user.id)
        .order("is_primary", { ascending: false });

      if (error) throw error;
      setChildren((data || []) as unknown as StudentLink[]);

      if (data && data.length > 0) {
        const statsMap = new Map<string, StudentStats>();
        const unreadMap = new Map<string, number>();
        const previewMap = new Map<string, { title: string; type: string }>();

        for (const link of data) {
          const s = await fetchStats(
            link.student_id,
            link.can_view_attendance,
            link.can_view_grades,
            link.can_view_financial,
          );
          statsMap.set(link.student_id, s);

          // Count unread notifications for this student
          const { count } = await supabase
            .from("parent_notifications")
            .select("*", { count: "exact", head: true })
            .eq("parent_user_id", user.id)
            .eq("student_id", link.student_id)
            .eq("is_read", false);

          // Count unseen class feedback sessions for this student's class
          let unseenFeedbackCount = 0;
          let latestUnseenSession: {
            id: string;
            class_summary: string;
            created_at: string;
          } | null = null;
          const classId = link.students.class_id;
          if (classId) {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const { data: sessions } = await supabase
              .from("class_feedback_sessions")
              .select("id, class_summary, created_at")
              .eq("class_id", classId)
              .eq("status", "completed")
              .gte("session_date", ninetyDaysAgo.toISOString().split("T")[0])
              .order("created_at", { ascending: false });

            if (sessions && sessions.length > 0) {
              const sessionIds = sessions.map((s) => s.id);
              const { data: views } = await supabase
                .from("parent_feedback_session_views")
                .select("session_id")
                .eq("parent_user_id", user.id)
                .in("session_id", sessionIds);
              const viewedIds = new Set((views || []).map((v) => v.session_id));
              const unseen = sessions.filter((s) => !viewedIds.has(s.id));
              unseenFeedbackCount = unseen.length;
              if (unseen.length > 0) latestUnseenSession = unseen[0];
            }
          }

          unreadMap.set(link.student_id, (count || 0) + unseenFeedbackCount);

          // Preview: whichever is more recent between a notification and a session
          const { data: latestUnread } =
            (count || 0) > 0
              ? await supabase
                  .from("parent_notifications")
                  .select("title, type, created_at")
                  .eq("parent_user_id", user.id)
                  .eq("student_id", link.student_id)
                  .eq("is_read", false)
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .maybeSingle()
              : { data: null };

          if (latestUnread && latestUnseenSession) {
            const useNotification =
              new Date(latestUnread.created_at) >=
              new Date(latestUnseenSession.created_at);
            previewMap.set(
              link.student_id,
              useNotification
                ? { title: latestUnread.title, type: latestUnread.type }
                : {
                    title:
                      latestUnseenSession.class_summary?.slice(0, 50) ||
                      "New class feedback",
                    type: "feedback",
                  },
            );
          } else if (latestUnread) {
            previewMap.set(link.student_id, {
              title: latestUnread.title,
              type: latestUnread.type,
            });
          } else if (latestUnseenSession) {
            previewMap.set(link.student_id, {
              title:
                latestUnseenSession.class_summary?.slice(0, 50) ||
                "New class feedback",
              type: "feedback",
            });
          }
        }
        setStats(statsMap);
        setUnreadCounts(unreadMap);
        setPreviews(previewMap);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (
    studentId: string,
    attendance: boolean,
    grades: boolean,
    financial: boolean,
  ): Promise<StudentStats> => {
    const result: StudentStats = {
      attendanceRate: 0,
      gradesAverage: 0,
      pendingFines: 0,
      unpaidFees: 0,
    };

    if (attendance) {
      const { data } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", studentId);
      if (data && data.length > 0) {
        result.attendanceRate = Math.round(
          (data.filter((a) => a.status === "present").length / data.length) *
            100,
        );
      }
    }
    if (grades) {
      const { data } = await supabase
        .from("academic_progress")
        .select("percentage")
        .eq("student_id", studentId);
      if (data && data.length > 0) {
        result.gradesAverage = Math.round(
          data.reduce((s, g) => s + g.percentage, 0) / data.length,
        );
      }
    }
    if (financial) {
      const { count: fines } = await supabase
        .from("fines")
        .select("*", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("status", "pending");
      result.pendingFines = fines || 0;
    }
    return result;
  };

  const getStatusDot = (status: string) => {
    if (status === "active") return "bg-green-500";
    if (status === "graduated") return "bg-blue-500";
    return "bg-slate-400";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          My Children
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {children.length} {children.length === 1 ? "child" : "children"}{" "}
          registered
        </p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
            No Children Linked
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Contact the school to link your children.
          </p>
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-left max-w-sm mx-auto">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Contact school administration to link your children to your
              account.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map((link) => {
            const student = link.students;
            const s = stats.get(link.student_id) || {
              attendanceRate: 0,
              gradesAverage: 0,
              pendingFines: 0,
              unpaidFees: 0,
            };
            const hasPending = s.pendingFines > 0;

            return (
              <div
                key={link.id}
                onClick={() => router.push(`/parent/student/${student.id}`)}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative">
                    <span className="text-primary font-bold text-sm">
                      {student.first_name[0]}
                      {student.last_name[0]}
                    </span>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${getStatusDot(student.status)}`}
                    ></span>
                    {(unreadCounts.get(link.student_id) || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                        {unreadCounts.get(link.student_id)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {student.first_name} {student.last_name}
                      </p>
                      {link.is_primary && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 rounded font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {student.student_number} ·{" "}
                      {student.classes?.name || "No class"} · {student.gender}
                    </p>
                    {previews.get(link.student_id) && (
                      <p className="text-xs text-primary truncate mt-0.5 flex items-center gap-1">
                        <span>
                          {previews.get(link.student_id)?.type ===
                          "academic_note"
                            ? "📝"
                            : previews.get(link.student_id)?.type === "feedback"
                              ? "📚"
                              : "💬"}
                        </span>
                        {previews.get(link.student_id)?.title}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </div>

                {/* Stats bar */}
                <div className="flex border-t border-slate-100 dark:border-slate-700 divide-x divide-slate-100 dark:divide-slate-700">
                  {link.can_view_attendance && (
                    <div className="flex-1 px-3 py-2 text-center">
                      <p
                        className={`text-sm font-bold ${s.attendanceRate >= 75 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {s.attendanceRate}%
                      </p>
                      <p className="text-xs text-slate-400">Attendance</p>
                    </div>
                  )}
                  {link.can_view_grades && (
                    <div className="flex-1 px-3 py-2 text-center">
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {s.gradesAverage}%
                      </p>
                      <p className="text-xs text-slate-400">Grades</p>
                    </div>
                  )}
                  {link.can_view_financial && (
                    <div className="flex-1 px-3 py-2 text-center">
                      <p
                        className={`text-sm font-bold ${hasPending ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
                      >
                        {s.pendingFines}
                      </p>
                      <p className="text-xs text-slate-400">Fines</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
