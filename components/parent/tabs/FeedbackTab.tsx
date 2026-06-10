"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface FeedbackSession {
  id: string;
  session_date: string;
  class_summary: string;
  homework: string | null;
  created_at: string;
  studentNote?: string | null;
  type: "feedback";
}

interface AdminNotice {
  id: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
  is_read: boolean;
  type: "notice";
}

type FeedbackItem = FeedbackSession | AdminNotice;

export default function FeedbackTab({ studentId }: { studentId: string }) {
  const supabase = createClient();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, [studentId]);

  const fetchFeedback = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: student } = await supabase
        .from("students")
        .select("class_id")
        .eq("id", studentId)
        .single();

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const cutoff = ninetyDaysAgo.toISOString().split("T")[0];

      const [feedbackResult, noticesResult] = await Promise.all([
        student?.class_id
          ? supabase
              .from("class_feedback_sessions")
              .select("id, session_date, class_summary, homework, created_at")
              .eq("class_id", student.class_id)
              .eq("status", "completed")
              .gte("session_date", cutoff)
              .order("session_date", { ascending: false })
          : Promise.resolve({ data: [] }),

        supabase
          .from("parent_notifications")
          .select("id, title, message, priority, created_at, is_read")
          .eq("parent_user_id", user.id)
          .eq("type", "admin_message")
          .gte("created_at", ninetyDaysAgo.toISOString())
          .order("created_at", { ascending: false }),
      ]);

      const feedbackData = feedbackResult.data || [];
      const noticesData = noticesResult.data || [];

      let notesMap: Record<string, string> = {};
      if (feedbackData.length > 0) {
        const sessionIds = feedbackData.map((s: any) => s.id);
        const { data: studentNotes } = await supabase
          .from("student_feedback")
          .select("session_id, feedback_text")
          .eq("student_id", studentId)
          .in("session_id", sessionIds);
        studentNotes?.forEach((n: any) => {
          notesMap[n.session_id] = n.feedback_text;
        });
      }

      // Mark notices as read
      const unreadIds = noticesData
        .filter((n: any) => !n.is_read)
        .map((n: any) => n.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("parent_notifications")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in("id", unreadIds);
      }

      const feedbackItems: FeedbackSession[] = feedbackData.map((s: any) => ({
        ...s,
        studentNote: notesMap[s.id] || null,
        type: "feedback" as const,
      }));

      const noticeItems: AdminNotice[] = noticesData.map((n: any) => ({
        ...n,
        type: "notice" as const,
      }));

      const combined: FeedbackItem[] = [...feedbackItems, ...noticeItems].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setItems(combined);
      if (combined.length > 0) setExpandedId(combined[0].id);
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
        <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
          No updates yet
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Class feedback and school notices will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isExpanded = expandedId === item.id;
        const isNew = index === 0;

        if (item.type === "notice") {
          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border overflow-hidden ${
                item.priority === "urgent"
                  ? "border-orange-300 dark:border-orange-700"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base shrink-0">📢</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      {item.priority === "urgent" && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-xs font-medium rounded">
                          ⚠️ Urgent
                        </span>
                      )}
                      {!item.is_read && (
                        <span className="px-1.5 py-0.5 bg-primary text-white text-xs font-medium rounded">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(item.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {item.message}
                  </p>
                </div>
              )}
            </div>
          );
        }

        const dateStr = new Date(item.session_date).toLocaleDateString(
          "en-GB",
          { weekday: "long", day: "numeric", month: "long", year: "numeric" },
        );

        return (
          <div
            key={item.id}
            className={`bg-white dark:bg-slate-800 rounded-xl border overflow-hidden transition-all ${
              isNew
                ? "border-primary/40"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {dateStr}
                    </p>
                    {isNew && (
                      <span className="px-1.5 py-0.5 bg-primary text-white text-xs font-medium rounded">
                        New
                      </span>
                    )}
                    {item.studentNote && (
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-xs font-medium rounded">
                        Personal note
                      </span>
                    )}
                  </div>
                  {!isExpanded && item.class_summary && (
                    <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                      {item.class_summary.substring(0, 60)}
                      {item.class_summary.length > 60 ? "..." : ""}
                    </p>
                  )}
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              )}
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Class Summary
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {item.class_summary}
                  </p>
                </div>
                {item.homework && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      📝 Homework
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300 mt-0.5">
                      {item.homework}
                    </p>
                  </div>
                )}
                {item.studentNote && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                      💬 Personal Note
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-300 mt-0.5">
                      {item.studentNote}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
