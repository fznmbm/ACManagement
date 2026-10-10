"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  Send,
  Users,
  User,
  Loader2,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  MessageSquare,
} from "lucide-react";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  parent_name: string;
  parent_phone: string;
}

interface Class {
  id: string;
  name: string;
}

interface Template {
  id: string;
  title: string;
  body: string;
  audience: "any" | "class" | "individual";
}

export default function SendUpdatePage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const { toast, confirm } = useToast();
  const prefilledClassId = searchParams.get("class") || "";
  // Opened from a class's "Send feedback" → start in the class weekly-log
  // mode (class summary + per-student notes) rather than a quick note.
  const prefilledFeedbackMode = searchParams.get("mode") === "feedback";

  // Core state
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [greeting, setGreeting] = useState("");
  const [signOff, setSignOff] = useState("");

  // Form state
  const [selectedClass, setSelectedClass] = useState(prefilledClassId);
  const [audience, setAudience] = useState<"class" | "student">("class");
  const [updateType, setUpdateType] = useState<"note" | "log">(
    prefilledFeedbackMode ? "log" : "note",
  );
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Quick note fields
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [isAcademicNote, setIsAcademicNote] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);

  // Weekly class update fields
  const [classSummary, setClassSummary] = useState("");
  const [homework, setHomework] = useState("");
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set(),
  );

  // UI state
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [whatsAppMsg, setWhatsAppMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [existingSessionId, setExistingSessionId] = useState<string | null>(
    null,
  );
  const [existingSessionStatus, setExistingSessionStatus] = useState<
    string | null
  >(null);

  // Class-day collaboration: who wrote each note. Notes in feedback mode
  // auto-save as they're typed and are stamped with the current author, so a
  // teacher and a helper can both contribute and you see who wrote what.
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [noteAuthors, setNoteAuthors] = useState<
    Record<string, { name: string | null; at: string | null }>
  >({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const autoSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const sessionPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    fetchInitialData();
    return () => {
      Object.values(autoSaveTimers.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
      if (audience === "class" && updateType === "log") {
        checkExistingSession(selectedClass);
      }
    } else {
      setStudents([]);
      setExistingSessionId(null);
      setExistingSessionStatus(null);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && audience === "class" && updateType === "log") {
      checkExistingSession(selectedClass);
    }
  }, [audience, updateType]);

  const fetchInitialData = async () => {
    try {
      const [classRes, templateRes, settingsRes] = await Promise.all([
        supabase
          .from("classes")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("message_templates")
          .select("id, title, body, audience")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "communication_settings")
          .single(),
      ]);

      setClasses(classRes.data || []);
      setTemplates(templateRes.data || []);

      if (settingsRes.data?.setting_value) {
        const val =
          typeof settingsRes.data.setting_value === "string"
            ? JSON.parse(settingsRes.data.setting_value)
            : settingsRes.data.setting_value;
        setGreeting(val.greeting || "");
        setSignOff(val.sign_off || "");
      }

      // Who's writing — used to stamp notes with their author.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setCurrentUser({ id: user.id, name: prof?.full_name || "You" });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: string) => {
    const { data } = await supabase
      .from("students")
      .select(
        "id, first_name, last_name, student_number, parent_name, parent_phone",
      )
      .eq("class_id", classId)
      .eq("status", "active")
      .order("first_name");
    setStudents(data || []);
  };

  const checkExistingSession = async (classId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("class_feedback_sessions")
      .select("id, status, class_summary, homework")
      .eq("class_id", classId)
      .eq("session_date", today)
      .maybeSingle();

    if (data) {
      setExistingSessionId(data.id);
      setExistingSessionStatus(data.status);
      if (data.status === "draft") {
        setClassSummary(data.class_summary || "");
        setHomework(data.homework || "");
        // Load existing student notes, with who wrote each one.
        const { data: notes } = await supabase
          .from("student_feedback")
          .select("student_id, feedback_text, author_id, updated_at")
          .eq("session_id", data.id);
        if (notes) {
          const authorIds = [
            ...new Set(
              notes.map((n: any) => n.author_id).filter(Boolean) as string[],
            ),
          ];
          const names: Record<string, string> = {};
          if (authorIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", authorIds);
            (profs || []).forEach((p: any) => {
              names[p.id] = p.full_name;
            });
          }
          const notesMap: Record<string, string> = {};
          const authorMap: Record<
            string,
            { name: string | null; at: string | null }
          > = {};
          notes.forEach((n: any) => {
            notesMap[n.student_id] = n.feedback_text || "";
            authorMap[n.student_id] = {
              name: n.author_id ? names[n.author_id] || "Staff" : null,
              at: n.updated_at || null,
            };
          });
          setStudentNotes(notesMap);
          setNoteAuthors(authorMap);
          setExpandedStudents(new Set(notes.map((n) => n.student_id)));
        }
      }
    } else {
      setExistingSessionId(null);
      setExistingSessionStatus(null);
      setClassSummary("");
      setHomework("");
      setStudentNotes({});
      setNoteAuthors({});
      setExpandedStudents(new Set());
    }
  };

  // --- Feedback-mode note autosave (stamps the author) --------------------
  // Create today's draft session lazily, on first note — de-duped via a ref so
  // two quick saves don't race two rows.
  const ensureDraftSession = async (): Promise<string | null> => {
    if (existingSessionId) return existingSessionId;
    if (!selectedClass || !currentUser) return null; // need both to create the row
    if (sessionPromiseRef.current) return sessionPromiseRef.current;
    const promise = (async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("class_feedback_sessions")
        .insert({
          class_id: selectedClass,
          session_date: today,
          status: "draft",
          created_by: currentUser?.id,
        })
        .select("id")
        .single();
      if (error || !data) {
        sessionPromiseRef.current = null;
        return null;
      }
      setExistingSessionId(data.id);
      setExistingSessionStatus("draft");
      return data.id as string;
    })();
    sessionPromiseRef.current = promise;
    return promise;
  };

  const saveNote = async (studentId: string, note: string) => {
    // Only autosave real feedback drafts; never touch a sent (completed) one.
    if (existingSessionStatus === "completed") return;
    if (!note.trim() && !existingSessionId) return; // don't create an empty draft

    const sid = await ensureDraftSession();
    if (!sid) return;
    setSavingNote(studentId);
    try {
      const { data: existing } = await supabase
        .from("student_feedback")
        .select("id")
        .eq("session_id", sid)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existing) {
        if (note.trim()) {
          await supabase
            .from("student_feedback")
            .update({
              feedback_text: note.trim(),
              author_id: currentUser?.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("student_feedback").delete().eq("id", existing.id);
        }
      } else if (note.trim()) {
        await supabase.from("student_feedback").insert({
          session_id: sid,
          student_id: studentId,
          feedback_text: note.trim(),
          author_id: currentUser?.id,
        });
      }

      setNoteAuthors((prev) => ({
        ...prev,
        [studentId]: note.trim()
          ? { name: currentUser?.name || "You", at: new Date().toISOString() }
          : { name: null, at: null },
      }));
    } catch {
      // best-effort; the note stays in the box and will also save on Send
    } finally {
      setSavingNote(null);
    }
  };

  const handleNoteChange = (studentId: string, value: string) => {
    setStudentNotes((prev) => ({ ...prev, [studentId]: value }));
    if (autoSaveTimers.current[studentId]) {
      clearTimeout(autoSaveTimers.current[studentId]);
    }
    autoSaveTimers.current[studentId] = setTimeout(() => {
      saveNote(studentId, value);
    }, 800);
  };

  const formatStamp = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const body = template.body
      .replace(/\{greeting\}/g, greeting)
      .replace(/\{sign_off\}/g, signOff);

    setTitle(template.title);
    setMessage(body);
  };

  const filteredTemplates = templates.filter((t) => {
    if (audience === "student") return t.audience !== "class";
    if (audience === "class" && updateType === "note")
      return t.audience !== "individual";
    return false;
  });

  const generateWhatsAppMessage = () => {
    const cls = classes.find((c) => c.id === selectedClass);
    const urgentPrefix = priority === "urgent" ? "⚠️ *URGENT*\n\n" : "";
    let msg = `🕌 *Al Hikmah Institute Crawley*\n\n`;
    msg += urgentPrefix;
    msg += `📢 *${title}*\n\n`;
    msg += `${message}\n\n`;
    msg += `JazakAllah Khair,\nAHIC`;
    return msg;
  };

  const generateClassUpdateWhatsApp = () => {
    const cls = classes.find((c) => c.id === selectedClass);
    const dateStr = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    let msg = `🕌 *Al Hikmah Institute Crawley*\n`;
    msg += `📚 *Class Update — ${cls?.name || ""}*\n`;
    msg += `📅 ${dateStr}\n\n`;
    if (classSummary.trim()) msg += `${classSummary.trim()}\n\n`;
    if (homework.trim()) msg += `📝 *Homework:* ${homework.trim()}\n\n`;
    msg += `JazakAllah Khair,\nAHIC`;
    return msg;
  };

  // ===== SEND HANDLERS =====

  const handleSendIndividual = async () => {
    if (!selectedStudent || !title.trim() || !message.trim()) {
      toast.error("Pick a student and fill in the title and message.");
      return;
    }
    setSending(true);
    try {
      const { data: links, error: linkError } = await supabase
        .from("parent_student_links")
        .select("parent_user_id")
        .eq("student_id", selectedStudent)
        .neq("can_receive_notifications", false);
      if (linkError) throw linkError;

      if (!links || links.length === 0) {
        toast.info(
          "No parent portal account is linked to this student — nothing posted to the portal. You can still copy the WhatsApp message.",
        );
        setRecipientCount(0);
      } else {
        const { error } = await supabase.from("parent_notifications").insert(
          links.map((link) => ({
            parent_user_id: link.parent_user_id,
            student_id: selectedStudent,
            type: isAcademicNote ? "academic_note" : "announcement",
            priority,
            title: title.trim(),
            message: message.trim(),
            is_read: false,
          })),
        );
        if (error) throw error;
        setRecipientCount(links.length);
      }

      setWhatsAppMsg(generateWhatsAppMessage());
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Couldn't send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSendClassNote = async () => {
    if (!selectedClass || !title.trim() || !message.trim()) {
      toast.error("Pick a class and fill in the title and message.");
      return;
    }
    setSending(true);
    try {
      let recipients = 0;
      const { data: classStudents } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", selectedClass)
        .eq("status", "active");

      if (classStudents && classStudents.length > 0) {
        const studentIds = classStudents.map((s) => s.id);
        const { data: links, error: linkError } = await supabase
          .from("parent_student_links")
          .select("parent_user_id, student_id")
          .in("student_id", studentIds)
          .neq("can_receive_notifications", false);
        if (linkError) throw linkError;

        if (links && links.length > 0) {
          const { error: insertError } = await supabase
            .from("parent_notifications")
            .insert(
            links.map((link) => ({
              parent_user_id: link.parent_user_id,
              student_id: link.student_id,
              type: "announcement",
              priority,
              title: title.trim(),
              message: message.trim(),
              is_read: false,
            })),
          );
          if (insertError) throw insertError;
          recipients = links.length;
        }
      }

      setRecipientCount(recipients);
      setWhatsAppMsg(generateWhatsAppMessage());
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Couldn't send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSendClassUpdate = async () => {
    if (!selectedClass) {
      alert("Please select a class.");
      return;
    }
    if (!classSummary.trim() && !homework.trim()) {
      const count = Object.values(studentNotes).filter((n) => n.trim()).length;
      if (count === 0) {
        toast.error(
          "Add a class summary, homework, or at least one student note.",
        );
        return;
      }
    }

    const ok = await confirm({
      title: "Send class update?",
      message: "It will be visible to parents immediately.",
      confirmText: "Send update",
    });
    if (!ok) return;

    setSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let sessionId = existingSessionId;
      const today = new Date().toISOString().split("T")[0];

      if (sessionId && existingSessionStatus === "draft") {
        // Update existing draft and mark completed
        await supabase
          .from("class_feedback_sessions")
          .update({
            class_summary: classSummary.trim() || null,
            homework: homework.trim() || null,
            status: "completed",
          })
          .eq("id", sessionId);
      } else if (!sessionId) {
        // Create new completed session
        const { data: newSession, error } = await supabase
          .from("class_feedback_sessions")
          .insert({
            class_id: selectedClass,
            session_date: today,
            class_summary: classSummary.trim() || null,
            homework: homework.trim() || null,
            status: "completed",
            created_by: user?.id,
          })
          .select("id")
          .single();

        if (error) throw error;
        sessionId = newSession.id;
      } else {
        toast.error(
          "A class update has already been sent for today. Only one per class per day.",
        );
        setSending(false);
        return;
      }

      // Save student notes
      const notesEntries = Object.entries(studentNotes).filter(([_, note]) =>
        note.trim(),
      );
      if (notesEntries.length > 0 && sessionId) {
        for (const [studentId, note] of notesEntries) {
          const { data: existing } = await supabase
            .from("student_feedback")
            .select("id")
            .eq("session_id", sessionId)
            .eq("student_id", studentId)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("student_feedback")
              .update({ feedback_text: note.trim() })
              .eq("id", existing.id);
          } else {
            await supabase.from("student_feedback").insert({
              session_id: sessionId,
              student_id: studentId,
              feedback_text: note.trim(),
              author_id: user?.id,
            });
          }
        }
      }

      setWhatsAppMsg(generateClassUpdateWhatsApp());
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Couldn't send the class update.");
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (audience === "student") return handleSendIndividual();
    if (updateType === "note") return handleSendClassNote();
    return handleSendClassUpdate();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(whatsAppMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setSelectedClass(prefilledClassId);
    setAudience("class");
    setUpdateType("note");
    setSelectedStudent("");
    setSelectedTemplate("");
    setTitle("");
    setMessage("");
    setPriority("normal");
    setIsAcademicNote(false);
    setRecipientCount(0);
    setClassSummary("");
    setHomework("");
    setStudentNotes({});
    setNoteAuthors({});
    sessionPromiseRef.current = null;
    setExpandedStudents(new Set());
    setSent(false);
    setWhatsAppMsg("");
    setCopied(false);
    setExistingSessionId(null);
    setExistingSessionStatus(null);
  };

  const toggleStudentExpanded = (studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const notesCount = Object.values(studentNotes).filter((n) => n.trim()).length;

  const canSend = () => {
    if (!selectedClass) return false;
    if (audience === "student")
      return !!selectedStudent && !!title.trim() && !!message.trim();
    if (updateType === "note") return !!title.trim() && !!message.trim();
    // Weekly class update: at least one field filled
    return !!classSummary.trim() || !!homework.trim() || notesCount > 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ===== SUCCESS STATE =====
  if (sent) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-1">
            Update sent
          </h2>
          <p className="text-sm text-green-700 dark:text-green-400">
            {audience === "student"
              ? recipientCount > 0
                ? "Notification posted to the parent portal"
                : "WhatsApp message ready — no linked portal account"
              : updateType === "log"
                ? "Class update is now visible in the parent portal"
                : `Notification sent to ${recipientCount} parent${recipientCount === 1 ? "" : "s"}`}
          </p>
        </div>

        {whatsAppMsg && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">
                WhatsApp message (copy to send manually)
              </p>
              <button
                onClick={handleCopy}
                className="btn-outline flex items-center gap-2 text-sm"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3 text-foreground">
              {whatsAppMsg}
            </pre>
          </div>
        )}

        <button onClick={handleReset} className="btn-primary w-full">
          Send another update
        </button>
      </div>
    );
  }

  // ===== COMPOSE FORM =====
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Send update</h2>
        <p className="text-muted-foreground">
          Send a message or class update to parents
        </p>
      </div>

      {/* Class selector */}
      <div>
        <label className="block text-sm font-medium mb-1">Class</label>
        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setSelectedStudent("");
            setStudentNotes({});
            setNoteAuthors({});
            sessionPromiseRef.current = null;
            setExpandedStudents(new Set());
          }}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select a class</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <>
          {/* Audience toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Who is this for?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAudience("class")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                  audience === "class"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-input hover:border-primary/50"
                }`}
              >
                <Users className="h-4 w-4" />
                Whole class
              </button>
              <button
                onClick={() => setAudience("student")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                  audience === "student"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-input hover:border-primary/50"
                }`}
              >
                <User className="h-4 w-4" />
                One student
              </button>
            </div>
          </div>

          {/* Type toggle — only for whole class */}
          {audience === "class" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                What kind of update?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUpdateType("note")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    updateType === "note"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:border-primary/50"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Quick note
                </button>
                <button
                  onClick={() => setUpdateType("log")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    updateType === "log"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:border-primary/50"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Weekly class update
                </button>
              </div>
            </div>
          )}

          {/* Existing session warning */}
          {audience === "class" &&
            updateType === "log" &&
            existingSessionStatus === "completed" && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  A class update has already been sent for today. Only one
                  update per class per day is allowed.
                </p>
              </div>
            )}

          {/* Student selector — individual mode */}
          {audience === "student" && (
            <div>
              <label className="block text-sm font-medium mb-1">Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} — {s.student_number}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Template selector — quick note modes only */}
          {(audience === "student" ||
            (audience === "class" && updateType === "note")) &&
            filteredTemplates.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Template{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => applyTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose a template...</option>
                  {filteredTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {/* ===== QUICK NOTE FIELDS ===== */}
          {(audience === "student" ||
            (audience === "class" && updateType === "note")) && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Holiday notice, Fee reminder"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Academic note — individual student only */}
              {audience === "student" && (
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors ${
                    isAcademicNote
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isAcademicNote}
                    onChange={() => setIsAcademicNote(!isAcademicNote)}
                    className="mt-0.5 h-4 w-4 rounded border-input text-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Mark as academic note
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Shows in the parent&apos;s Feedback tab and the student&apos;s
                      meeting report
                    </span>
                  </span>
                </label>
              )}
            </div>
          )}

          {/* ===== WEEKLY CLASS UPDATE FIELDS ===== */}
          {audience === "class" &&
            updateType === "log" &&
            existingSessionStatus !== "completed" && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <label className="block text-sm font-medium">
                      Class summary
                    </label>
                    <span className="text-xs text-muted-foreground">
                      optional
                    </span>
                  </div>
                  <textarea
                    value={classSummary}
                    onChange={(e) => setClassSummary(e.target.value)}
                    rows={3}
                    placeholder="What did the class cover today..."
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <label className="block text-sm font-medium">
                      Homework
                    </label>
                    <span className="text-xs text-muted-foreground">
                      optional
                    </span>
                  </div>
                  <textarea
                    value={homework}
                    onChange={(e) => setHomework(e.target.value)}
                    rows={2}
                    placeholder="Anything to revise at home..."
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Per-student notes */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Student notes{" "}
                      {notesCount > 0 && (
                        <span className="text-primary ml-1">
                          ({notesCount})
                        </span>
                      )}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      optional — click a student to add a personal note
                    </span>
                  </div>
                  <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                    {students.map((student) => {
                      const isExpanded = expandedStudents.has(student.id);
                      const hasNote = !!studentNotes[student.id]?.trim();
                      return (
                        <div key={student.id}>
                          <button
                            onClick={() => toggleStudentExpanded(student.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-accent/50 transition-colors ${
                              hasNote ? "bg-primary/5" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                                {student.first_name[0]}
                                {student.last_name[0]}
                              </div>
                              <span className="text-sm font-medium">
                                {student.first_name} {student.last_name}
                              </span>
                              {hasNote && (
                                <FileText className="h-3.5 w-3.5 text-primary" />
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-3 pt-1">
                              <textarea
                                value={studentNotes[student.id] || ""}
                                onChange={(e) =>
                                  handleNoteChange(student.id, e.target.value)
                                }
                                rows={2}
                                placeholder={`Note for ${student.first_name}...`}
                                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {savingNote === student.id
                                    ? "Saving…"
                                    : noteAuthors[student.id]?.name
                                      ? `— added by ${noteAuthors[student.id]!.name}${
                                          noteAuthors[student.id]?.at
                                            ? `, ${formatStamp(noteAuthors[student.id]!.at)}`
                                            : ""
                                        }`
                                      : "Saves as you type"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          {/* Send button */}
          {!(
            audience === "class" &&
            updateType === "log" &&
            existingSessionStatus === "completed"
          ) && (
            <button
              onClick={handleSend}
              disabled={sending || !canSend()}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending
                ? "Sending..."
                : audience === "class" && updateType === "log"
                  ? "Send class update"
                  : "Send update"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
