"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  History,
  Save,
  Send,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
}

interface PastSession {
  id: string;
  session_date: string;
  class_summary: string | null;
  homework: string | null;
  status: string;
  created_at: string;
}

export default function ClassFeedbackPage() {
  const params = useParams();
  const supabase = createClient();
  const classId = params.id as string;

  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  // Draft session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"draft" | "completed">(
    "draft",
  );
  const [sessionDate] = useState(new Date().toISOString().split("T")[0]);

  // Form fields
  const [classSummary, setClassSummary] = useState("");
  const [homework, setHomework] = useState("");
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set(),
  );

  // Auto-save state
  const [savingStudent, setSavingStudent] = useState<string | null>(null);
  const [savingMain, setSavingMain] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const mainSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // WhatsApp
  const [whatsAppMsg, setWhatsAppMsg] = useState("");
  const [individualMsgs, setIndividualMsgs] = useState<
    { name: string; msg: string }[]
  >([]);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // History
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Completing
  const [completing, setCompleting] = useState(false);

  const isAdmin = ["super_admin", "admin"].includes(userRole);
  const isTeacher = userRole === "teacher";
  const canSendFeedback = isAdmin || isTeacher;

  useEffect(() => {
    init();
  }, [classId]);

  const init = async () => {
    setLoading(true);

    // Get user role
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setUserRole(profile?.role || "");
    }

    // Get class name
    const { data: cls } = await supabase
      .from("classes")
      .select("name")
      .eq("id", classId)
      .single();
    setClassName(cls?.name || "");

    // Get active students
    const { data: studentData } = await supabase
      .from("students")
      .select("id, first_name, last_name, student_number")
      .eq("class_id", classId)
      .eq("status", "active")
      .order("last_name");
    setStudents(studentData || []);

    // Check for existing draft session for today
    const today = new Date().toISOString().split("T")[0];
    const { data: existingSession } = await supabase
      .from("class_feedback_sessions")
      .select("*")
      .eq("class_id", classId)
      .eq("session_date", today)
      .eq("status", "draft")
      .single();

    let sid: string;
    if (existingSession) {
      // Use existing draft
      sid = existingSession.id;
      setSessionId(sid);
      setSessionStatus("draft");
      setClassSummary(existingSession.class_summary || "");
      setHomework(existingSession.homework || "");

      // Load existing student notes for this session
      const { data: existingNotes } = await supabase
        .from("student_feedback")
        .select("student_id, feedback_text")
        .eq("session_id", sid);

      if (existingNotes) {
        const notesMap: Record<string, string> = {};
        existingNotes.forEach((n) => {
          notesMap[n.student_id] = n.feedback_text || "";
        });
        setStudentNotes(notesMap);
        // Auto-expand students that already have notes
        const withNotes = new Set(existingNotes.map((n) => n.student_id));
        setExpandedStudents(withNotes);
      }
    } else {
      // Create new draft session
      const { data: newSession, error } = await supabase
        .from("class_feedback_sessions")
        .insert({
          class_id: classId,
          session_date: today,
          status: "draft",
          created_by: user?.id,
        })
        .select("id")
        .single();

      if (!error && newSession) {
        sid = newSession.id;
        setSessionId(sid);
        setSessionStatus("draft");
      }
    }

    // Load past completed sessions
    const { data: sessions } = await supabase
      .from("class_feedback_sessions")
      .select("id, session_date, class_summary, homework, status, created_at")
      .eq("class_id", classId)
      .eq("status", "completed")
      .order("session_date", { ascending: false })
      .limit(5);
    setPastSessions(sessions || []);

    setLoading(false);
  };

  // Auto-save student note after 800ms of no typing
  const handleStudentNoteChange = (studentId: string, value: string) => {
    setStudentNotes((prev) => ({ ...prev, [studentId]: value }));

    // Clear existing timer for this student
    if (autoSaveTimers.current[studentId]) {
      clearTimeout(autoSaveTimers.current[studentId]);
    }

    // Set new timer
    autoSaveTimers.current[studentId] = setTimeout(() => {
      saveStudentNote(studentId, value);
    }, 800);
  };

  const saveStudentNote = async (studentId: string, note: string) => {
    if (!sessionId) return;
    setSavingStudent(studentId);

    try {
      // Check if note already exists
      const { data: existing } = await supabase
        .from("student_feedback")
        .select("id")
        .eq("session_id", sessionId)
        .eq("student_id", studentId)
        .single();

      if (existing) {
        if (note.trim()) {
          await supabase
            .from("student_feedback")
            .update({ feedback_text: note.trim() })
            .eq("id", existing.id);
        } else {
          // Delete if empty
          await supabase
            .from("student_feedback")
            .delete()
            .eq("id", existing.id);
        }
      } else if (note.trim()) {
        await supabase.from("student_feedback").insert({
          session_id: sessionId,
          student_id: studentId,
          feedback_text: note.trim(),
        });
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error("Auto-save error:", err);
    } finally {
      setSavingStudent(null);
    }
  };

  // Auto-save class summary and homework after 1s of no typing
  const handleMainFieldChange = (
    field: "summary" | "homework",
    value: string,
  ) => {
    if (field === "summary") setClassSummary(value);
    else setHomework(value);

    if (mainSaveTimer.current) clearTimeout(mainSaveTimer.current);
    mainSaveTimer.current = setTimeout(() => {
      saveMainFields(
        field === "summary" ? value : classSummary,
        field === "homework" ? value : homework,
      );
    }, 1000);
  };

  const saveMainFields = async (summary: string, hw: string) => {
    if (!sessionId) return;
    setSavingMain(true);
    try {
      await supabase
        .from("class_feedback_sessions")
        .update({
          class_summary: summary.trim() || null,
          homework: hw.trim() || null,
        })
        .eq("id", sessionId);
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSavingMain(false);
    }
  };

  const toggleStudentExpanded = (studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const generateMessages = () => {
    const dateStr = new Date(sessionDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Class-wide message
    let msg = `🕌 *Al Hikmah Institute Crawley*\n`;
    msg += `📚 *Class Update — ${className}*\n`;
    msg += `📅 ${dateStr}\n\n`;
    if (classSummary.trim()) {
      msg += `${classSummary.trim()}\n`;
    }
    if (homework.trim()) {
      msg += `\n📝 *Homework:* ${homework.trim()}\n`;
    }
    msg += `\nJazakAllah Khair,\nAl Hikmah Institute`;
    setWhatsAppMsg(msg);

    // Individual messages
    const individual: { name: string; msg: string }[] = [];
    students.forEach((student) => {
      const note = studentNotes[student.id]?.trim();
      if (note) {
        let iMsg = `🕌 *Al Hikmah Institute Crawley*\n`;
        iMsg += `📚 *Individual Update — ${student.first_name} ${student.last_name}*\n`;
        iMsg += `📅 ${dateStr}\n\n`;
        iMsg += `${note}\n`;
        if (homework.trim()) {
          iMsg += `\n📝 *Homework:* ${homework.trim()}\n`;
        }
        iMsg += `\nJazakAllah Khair,\nAl Hikmah Institute`;
        individual.push({
          name: `${student.first_name} ${student.last_name}`,
          msg: iMsg,
        });
      }
    });
    setIndividualMsgs(individual);
    setShowWhatsApp(true);
  };

  const handleComplete = async () => {
    if (!classSummary.trim()) {
      alert("Please add a class summary before completing.");
      return;
    }
    if (
      !confirm(
        "Mark this feedback as complete and sent? This cannot be undone.",
      )
    )
      return;

    setCompleting(true);
    try {
      await supabase
        .from("class_feedback_sessions")
        .update({
          status: "completed",
          class_summary: classSummary.trim(),
          homework: homework.trim() || null,
        })
        .eq("id", sessionId);

      setSessionStatus("completed");
      // Refresh history
      const { data: sessions } = await supabase
        .from("class_feedback_sessions")
        .select("id, session_date, class_summary, homework, status, created_at")
        .eq("class_id", classId)
        .eq("status", "completed")
        .order("session_date", { ascending: false })
        .limit(5);
      setPastSessions(sessions || []);
    } catch (err: any) {
      alert(err.message || "Failed to complete feedback");
    } finally {
      setCompleting(false);
    }
  };

  const copyToClipboard = async (text: string, type: "main" | number) => {
    await navigator.clipboard.writeText(text);
    if (type === "main") {
      setCopiedMain(true);
      setTimeout(() => setCopiedMain(false), 3000);
    } else {
      setCopiedIndex(type as number);
      setTimeout(() => setCopiedIndex(null), 3000);
    }
  };

  const notesCount = Object.values(studentNotes).filter((n) => n.trim()).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/classes/${classId}`}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold">
              {canSendFeedback ? "Review & Send Feedback" : "Add Student Notes"}
            </h2>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                sessionStatus === "completed"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
            >
              {sessionStatus === "completed" ? "✓ Completed" : "● Draft"}
            </span>
          </div>
          <p className="text-muted-foreground">
            {className} —{" "}
            {new Date(sessionDate).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        {/* Auto-save indicator */}
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {savingMain || savingStudent ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </>
          ) : lastSaved ? (
            <>
              <Clock className="h-3 w-3" />
              Saved{" "}
              {lastSaved.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </>
          ) : null}
        </div>
      </div>

      {sessionStatus === "completed" ? (
        /* Completed state — read only */
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-green-800 dark:text-green-400">
            Feedback sent for today
          </p>
          <p className="text-sm text-green-700 dark:text-green-500 mt-1">
            {classSummary &&
              `"${classSummary.substring(0, 80)}${classSummary.length > 80 ? "..." : ""}"`}
          </p>
        </div>
      ) : (
        <>
          {/* Role banner */}
          <div
            className={`px-4 py-3 rounded-lg border text-sm ${
              canSendFeedback
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400"
            }`}
          >
            {canSendFeedback
              ? "ℹ️ Assistant notes are pre-filled below. Add the class summary and generate the WhatsApp messages."
              : "ℹ️ Add student notes below. The admin/teacher will review and send the feedback after class."}
          </div>

          {/* Class Summary — only editable by admin/teacher */}
          {canSendFeedback && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Class Summary</h3>
              <div>
                <label className="form-label">What was covered today? *</label>
                <textarea
                  rows={4}
                  value={classSummary}
                  onChange={(e) =>
                    handleMainFieldChange("summary", e.target.value)
                  }
                  className="form-input"
                  placeholder="e.g. Today we revised Surah Al-Fatiha and started Surah Al-Ikhlas. Students practised tajweed rules for noon sakinah..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sent to all parents in the class WhatsApp group.
                </p>
              </div>
              <div>
                <label className="form-label">Homework (optional)</label>
                <input
                  type="text"
                  value={homework}
                  onChange={(e) =>
                    handleMainFieldChange("homework", e.target.value)
                  }
                  className="form-input"
                  placeholder="e.g. Practise Surah Al-Ikhlas daily, memorise by next week"
                />
              </div>
            </div>
          )}

          {/* Student Notes */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Individual Student Notes
                {notesCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {notesCount} note{notesCount > 1 ? "s" : ""}
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                Auto-saves as you type
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              {canSendFeedback
                ? "Review and edit student notes added by the assistant. Each note generates a separate WhatsApp message for that parent."
                : "Tap a student to add a note. Notes save automatically."}
            </p>

            <div className="space-y-2">
              {students.map((student) => {
                const note = studentNotes[student.id] || "";
                const hasNote = note.trim().length > 0;
                const isExpanded = expandedStudents.has(student.id);
                const isSavingThis = savingStudent === student.id;

                return (
                  <div
                    key={student.id}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      hasNote
                        ? "border-primary/30 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleStudentExpanded(student.id)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          {hasNote && !isExpanded && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {note.substring(0, 60)}
                              {note.length > 60 ? "..." : ""}
                            </p>
                          )}
                        </div>
                        {isSavingThis && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                        {hasNote && !isSavingThis && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="p-3 border-t border-border">
                        <textarea
                          rows={3}
                          value={note}
                          onChange={(e) =>
                            handleStudentNoteChange(student.id, e.target.value)
                          }
                          className="form-input text-sm"
                          placeholder={`Note for ${student.first_name}... e.g. Mashallah, great progress today. Please practise the pronunciation of ض at home.`}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons — admin/teacher only */}
          {canSendFeedback && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Send Feedback</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={generateMessages}
                  disabled={!classSummary.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Generate WhatsApp Messages
                </button>
                <button
                  onClick={handleComplete}
                  disabled={completing || !classSummary.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {completing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {completing ? "Completing..." : "Mark as Sent & Complete"}
                </button>
              </div>
              {!classSummary.trim() && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  ⚠️ Add a class summary before generating messages.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* WhatsApp Messages */}
      {showWhatsApp && (
        <div className="space-y-4">
          {/* Class-wide */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-1">📱 Class WhatsApp Message</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Send to the class WhatsApp group
            </p>
            <textarea
              value={whatsAppMsg}
              onChange={(e) => setWhatsAppMsg(e.target.value)}
              rows={10}
              className="w-full p-3 text-sm font-mono bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={() => copyToClipboard(whatsAppMsg, "main")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copiedMain
                    ? "bg-green-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {copiedMain ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                {copiedMain ? "Copied!" : "Copy to Clipboard"}
              </button>
            </div>
          </div>

          {/* Individual messages */}
          {individualMsgs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Individual Messages ({individualMsgs.length})
              </h3>
              {individualMsgs.map((item, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <p className="text-sm font-medium mb-2">📩 {item.name}</p>
                  <textarea
                    value={item.msg}
                    onChange={(e) => {
                      const updated = [...individualMsgs];
                      updated[i] = { ...updated[i], msg: e.target.value };
                      setIndividualMsgs(updated);
                    }}
                    rows={8}
                    className="w-full p-3 text-sm font-mono bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => copyToClipboard(item.msg, i)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        copiedIndex === i
                          ? "bg-green-600 text-white"
                          : "bg-slate-600 text-white hover:bg-slate-700"
                      }`}
                    >
                      {copiedIndex === i ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <MessageSquare className="h-3 w-3" />
                      )}
                      {copiedIndex === i ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Previous Feedback ({pastSessions.length})
            </h3>
            {showHistory ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showHistory && (
            <div className="mt-4 space-y-3">
              {pastSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border"
                >
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
                  {session.class_summary && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {session.class_summary}
                    </p>
                  )}
                  {session.homework && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📝 {session.homework}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
