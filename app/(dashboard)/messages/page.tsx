"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquare,
  Users,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Copy,
} from "lucide-react";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  parent_name: string;
  parent_phone: string;
  class_id: string;
}

interface Class {
  id: string;
  name: string;
}

export default function MessagesPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<"choose" | "student" | "class">("choose");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [whatsAppMsg, setWhatsAppMsg] = useState("");
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  // Form state
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchStudents(selectedClass);
  }, [selectedClass]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    setClasses(data || []);
  };

  const fetchStudents = async (classId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select(
        "id, first_name, last_name, student_number, parent_name, parent_phone, class_id",
      )
      .eq("class_id", classId)
      .eq("status", "active")
      .order("last_name");
    setStudents(data || []);
    setLoading(false);
  };

  const generateWhatsAppMessage = (recipientName?: string) => {
    const urgentPrefix = priority === "urgent" ? "⚠️ *URGENT*\n\n" : "";
    let msg = `🕌 *Al Hikmah Institute Crawley*\n\n`;
    msg += urgentPrefix;
    msg += `📢 *${title}*\n\n`;
    msg += `${message}\n\n`;
    msg += `JazakAllah Khair,\nAHIC`;
    return msg;
  };

  const handleSendToStudent = async () => {
    if (!selectedStudent || !title.trim() || !message.trim()) {
      alert("Please select a student and fill in the title and message.");
      return;
    }

    setSending(true);
    try {
      // Get student's parent user id
      const { data: link, error: linkError } = await supabase
        .from("parent_student_links")
        .select("parent_user_id")
        .eq("student_id", selectedStudent)
        .eq("is_primary", true)
        .single();

      console.log("Link data:", link, "Link error:", linkError);

      if (link?.parent_user_id) {
        const { error: insertError } = await supabase
          .from("parent_notifications")
          .insert({
            parent_user_id: link.parent_user_id,
            student_id: selectedStudent,
            type: "admin_message",
            priority,
            title: title.trim(),
            message: message.trim(),
            is_read: false,
          });
        if (insertError) {
          console.error("Insert error:", insertError);
          alert("Failed to send: " + insertError.message);
          setSending(false);
          return;
        }
      }

      // Generate WhatsApp message
      const student = students.find((s) => s.id === selectedStudent);
      setWhatsAppMsg(generateWhatsAppMessage(student?.parent_name));
      setShowWhatsApp(true);
      setSent(true);
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendToClass = async () => {
    if (!selectedClass || !title.trim() || !message.trim()) {
      alert("Please select a class and fill in the title and message.");
      return;
    }

    setSending(true);
    try {
      // Get all students in class
      const { data: classStudents } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", selectedClass)
        .eq("status", "active");

      if (classStudents && classStudents.length > 0) {
        // Get all parent links
        const studentIds = classStudents.map((s) => s.id);
        const { data: links } = await supabase
          .from("parent_student_links")
          .select("parent_user_id, student_id")
          .in("student_id", studentIds)
          .eq("is_primary", true);

        if (links && links.length > 0) {
          // Insert notification for each parent
          await supabase.from("parent_notifications").insert(
            links.map((link) => ({
              parent_user_id: link.parent_user_id,
              student_id: link.student_id,
              type: "admin_message",
              priority,
              title: title.trim(),
              message: message.trim(),
              is_read: false,
            })),
          );
        }
      }

      // Generate WhatsApp message
      const cls = classes.find((c) => c.id === selectedClass);
      setWhatsAppMsg(generateWhatsAppMessage());
      setShowWhatsApp(true);
      setSent(true);
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(whatsAppMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setMode("choose");
    setSelectedClass("");
    setSelectedStudent("");
    setTitle("");
    setMessage("");
    setPriority("normal");
    setSent(false);
    setShowWhatsApp(false);
    setWhatsAppMsg("");
    setStudents([]);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        {mode !== "choose" && (
          <button
            onClick={handleReset}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-muted-foreground text-sm">
            Send notices to parents — appears in their portal and generates a
            WhatsApp message
          </p>
        </div>
      </div>

      {/* Choose mode */}
      {mode === "choose" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode("student")}
            className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-accent transition-all text-left group"
          >
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
              Individual Student
            </h3>
            <p className="text-sm text-muted-foreground">
              Send a notice to a specific student's parent
            </p>
          </button>

          <button
            onClick={() => setMode("class")}
            className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-accent transition-all text-left group"
          >
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
              Whole Class
            </h3>
            <p className="text-sm text-muted-foreground">
              Send a notice to all parents in a class
            </p>
          </button>
        </div>
      )}

      {/* Message Form */}
      {(mode === "student" || mode === "class") && !sent && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h3 className="font-semibold">
            {mode === "student"
              ? "Message Individual Student"
              : "Message Whole Class"}
          </h3>

          {/* Class selector — always shown */}
          <div>
            <label className="form-label">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStudent("");
              }}
              className="form-input"
            >
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student selector — only in student mode */}
          {mode === "student" && selectedClass && (
            <div>
              <label className="form-label">Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="form-input"
                disabled={loading}
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.student_number})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="form-label">Priority</label>
            <div className="flex gap-3">
              <button
                onClick={() => setPriority("normal")}
                className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  priority === "normal"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setPriority("urgent")}
                className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  priority === "urgent"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                    : "border-border hover:border-orange-300"
                }`}
              >
                ⚠️ Urgent
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="form-label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="e.g. Reminder: Fees due this week"
            />
          </div>

          {/* Message */}
          <div>
            <label className="form-label">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="form-input"
              placeholder="Type your message here..."
            />
          </div>

          {/* Send button */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={
                mode === "student" ? handleSendToStudent : handleSendToClass
              }
              disabled={
                sending ||
                !title.trim() ||
                !message.trim() ||
                !selectedClass ||
                (mode === "student" && !selectedStudent)
              }
              className="btn-primary flex items-center gap-2 disabled:opacity-50 w-full justify-center"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {sending ? "Sending..." : "Send Notice"}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Parent will see this in their portal notification area
            </p>
          </div>
        </div>
      )}

      {/* Success + WhatsApp */}
      {sent && showWhatsApp && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-400 text-sm">
                Notice sent to parent portal ✓
              </p>
              <p className="text-xs text-green-700 dark:text-green-500">
                {mode === "class"
                  ? "All parents in this class have been notified"
                  : "Parent has been notified"}
              </p>
            </div>
          </div>

          {/* WhatsApp message */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="font-medium text-sm mb-1">📱 WhatsApp Message</p>
            <p className="text-xs text-muted-foreground mb-3">
              Copy and paste into{" "}
              {mode === "class"
                ? "the class WhatsApp group"
                : "a WhatsApp message to the parent"}
            </p>
            <textarea
              value={whatsAppMsg}
              onChange={(e) => setWhatsAppMsg(e.target.value)}
              rows={8}
              className="w-full p-3 text-sm font-mono bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleCopy}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 btn-outline py-2 text-sm"
              >
                Send Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
