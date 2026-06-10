"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Users,
  CreditCard,
  ChevronRight,
  MessageSquare,
  Calendar,
} from "lucide-react";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  status: string;
  class_id: string | null;
  classes?: { name: string };
}

export default function ParentDashboard() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState("");
  const [totalStudents, setTotalStudents] = useState(0);
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);
  const [pendingFines, setPendingFines] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();
      if (profile) setParentName(profile.full_name || profile.email || "");

      // Get linked students
      const { data: links } = await supabase
        .from("parent_student_links")
        .select(
          `student_id, students!inner(id, student_number, first_name, last_name, status, class_id)`,
        )
        .eq("parent_user_id", user.id)
        .order("is_primary", { ascending: false })
        .limit(4);

      if (links && links.length > 0) {
        const studentData = links.map((l: any) => l.students).filter(Boolean);
        const withClasses = await Promise.all(
          studentData.map(async (s: any) => {
            if (s.class_id) {
              const { data: cls } = await supabase
                .from("classes")
                .select("name")
                .eq("id", s.class_id)
                .single();
              return { ...s, classes: cls };
            }
            return s;
          }),
        );
        setStudents(withClasses);

        const { count } = await supabase
          .from("parent_student_links")
          .select("*", { count: "exact", head: true })
          .eq("parent_user_id", user.id);
        setTotalStudents(count || 0);

        // Count new feedback (sessions completed in last 7 days) for linked students
        const studentIds = studentData.map((s: any) => s.id);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: fbCount } = await supabase
          .from("class_feedback_sessions")
          .select("id, classes!inner(id)", { count: "exact", head: true })
          .eq("status", "completed")
          .gte("created_at", sevenDaysAgo.toISOString())
          .in(
            "class_id",
            withClasses
              .filter((s: any) => s.class_id)
              .map((s: any) => s.class_id),
          );

        // Count unread admin notices
        const { count: noticeCount } = await supabase
          .from("parent_notifications")
          .select("*", { count: "exact", head: true })
          .eq("parent_user_id", user.id)
          .eq("type", "announcement")
          .eq("is_read", false);

        setNewFeedbackCount((fbCount || 0) + (noticeCount || 0));

        // Count pending fines
        const { count: finesCount } = await supabase
          .from("fines")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .in("student_id", studentIds);
        setPendingFines(finesCount || 0);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const firstName = parentName.split(" ")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Compact greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Assalamu Alaikum{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Al Hikmah Institute Crawley
          </p>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/parent/children">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center hover:border-primary transition-colors">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalStudents}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Children
            </p>
          </div>
        </Link>
        <Link href="/parent/children">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center hover:border-primary transition-colors relative">
            {newFeedbackCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                {newFeedbackCount}
              </span>
            )}
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {newFeedbackCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              New Updates
            </p>
          </div>
        </Link>
        <Link href="/parent/finances">
          <div
            className={`rounded-xl border p-4 text-center hover:border-primary transition-colors ${
              pendingFines > 0
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}
          >
            <p
              className={`text-2xl font-bold ${pendingFines > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}
            >
              {pendingFines}
            </p>
            <p
              className={`text-xs mt-0.5 ${pendingFines > 0 ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
            >
              Pending Fines
            </p>
          </div>
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/parent/events"
          className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-primary transition-colors"
        >
          <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Events
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              School activities
            </p>
          </div>
        </Link>
        <Link
          href="/parent/finances"
          className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-primary transition-colors"
        >
          <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Finances
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Invoices & fines
            </p>
          </div>
        </Link>
      </div>

      {/* Children list */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            My Children
          </h2>
          {totalStudents > 2 && (
            <Link
              href="/parent/children"
              className="text-xs text-primary font-medium flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No students linked yet. Contact the school.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/parent/student/${student.id}`}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold text-sm">
                      {student.first_name[0]}
                      {student.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {student.student_number} ·{" "}
                      {student.classes?.name || "No class"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {student.status === "active" && (
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
