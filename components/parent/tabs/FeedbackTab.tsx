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
}

export default function FeedbackTab({ studentId }: { studentId: string }) {
  const supabase = createClient();
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, [studentId]);

  const fetchFeedback = async () => {
    try {
      // Get student's class_id
      const { data: student } = await supabase
        .from("students")
        .select("class_id")
        .eq("id", studentId)
        .single();

      if (!student?.class_id) {
        setLoading(false);
        return;
      }

      // Get completed feedback sessions for this class
      const { data: feedbackData } = await supabase
        .from("class_feedback_sessions")
        .select("id, session_date, class_summary, homework, created_at")
        .eq("class_id", student.class_id)
        .eq("status", "completed")
        .order("session_date", { ascending: false })
        .limit(20);

      if (!feedbackData || feedbackData.length === 0) {
        setLoading(false);
        return;
      }

      // Get individual notes for this student
      const sessionIds = feedbackData.map((s) => s.id);
      const { data: studentNotes } = await supabase
        .from("student_feedback")
        .select("session_id, feedback_text")
        .eq("student_id", studentId)
        .in("session_id", sessionIds);

      const notesMap: Record<string, string> = {};
      studentNotes?.forEach((n) => {
        notesMap[n.session_id] = n.feedback_text;
      });

      setSessions(
        feedbackData.map((s) => ({
          ...s,
          studentNote: notesMap[s.id] || null,
        })),
      );

      // Auto-expand most recent
      if (feedbackData.length > 0) setExpandedId(feedbackData[0].id);
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

  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
        <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
          No class feedback yet
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Class updates will appear here after each session
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => {
        const isExpanded = expandedId === session.id;
        const isNew = index === 0;
        const dateStr = new Date(session.session_date).toLocaleDateString(
          "en-GB",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        );

        return (
          <div
            key={session.id}
            className={`bg-white dark:bg-slate-800 rounded-xl border overflow-hidden transition-all ${
              isNew
                ? "border-primary/40"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : session.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {dateStr}
                    </p>
                    {isNew && (
                      <span className="px-1.5 py-0.5 bg-primary text-white text-xs font-medium rounded">
                        New
                      </span>
                    )}
                    {session.studentNote && (
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-xs font-medium rounded">
                        Personal note
                      </span>
                    )}
                  </div>
                  {!isExpanded && session.class_summary && (
                    <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                      {session.class_summary.substring(0, 60)}
                      {session.class_summary.length > 60 ? "..." : ""}
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
                {/* Class summary */}
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Class Summary
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {session.class_summary}
                  </p>
                </div>

                {/* Homework */}
                {session.homework && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      📝 Homework
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300 mt-0.5">
                      {session.homework}
                    </p>
                  </div>
                )}

                {/* Individual student note */}
                {session.studentNote && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                      💬 Personal Note
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-300 mt-0.5">
                      {session.studentNote}
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
