"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Mail } from "lucide-react";

interface Message {
  id: string;
  type: "admin_message" | "teacher_feedback";
  subject: string | null;
  message: string;
  delivery_method?: "email" | "whatsapp_individual" | "whatsapp_group";
  created_at: string;
  is_read?: boolean;
  sender: {
    full_name: string;
  } | null;
  student: {
    first_name: string;
    last_name: string;
  } | null;
  class_name?: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
}

export default function ParentMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadStudentsAndMessages();
  }, []);

  async function loadStudentsAndMessages() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get parent's students through parent_student_links
      const { data: linkData, error: linkError } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_user_id", user.id);

      if (linkError) throw linkError;

      const studentIds = linkData?.map((link) => link.student_id) || [];

      if (studentIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, first_name, last_name, class_id")
        .in("id", studentIds)
        .eq("status", "active");

      if (studentError) throw studentError;
      setStudents(studentData || []);

      // 1. Get FEEDBACK notifications from parent_notifications table
      const { data: feedbackNotifications } = await supabase
        .from("parent_notifications")
        .select(
          `
          id,
          title,
          message,
          created_at,
          is_read,
          students (first_name, last_name)
        `
        )
        .eq("parent_user_id", user.id)
        .eq("type", "feedback")
        .order("created_at", { ascending: false });

      // 2. Get admin messages from messages table (individual)
      const { data: individualMessages } = await supabase
        .from("messages")
        .select(
          `
          id,
          subject,
          message,
          delivery_method,
          created_at,
          student_id,
          sender:profiles!messages_sender_id_fkey (full_name),
          students (first_name, last_name)
        `
        )
        .in("student_id", studentIds)
        .eq("message_type", "individual")
        .order("created_at", { ascending: false });

      // 3. Get class-wide messages
      const classIds =
        studentData?.map((s) => s.class_id).filter(Boolean) || [];
      let classMessages: any[] = [];
      if (classIds.length > 0) {
        const { data: classMsgs } = await supabase
          .from("messages")
          .select(
            `
            id,
            subject,
            message,
            delivery_method,
            created_at,
            class_id,
            sender:profiles!messages_sender_id_fkey (full_name),
            classes (name)
          `
          )
          .in("class_id", classIds)
          .eq("message_type", "class")
          .order("created_at", { ascending: false });

        classMessages = classMsgs || [];
      }

      // Transform feedback notifications to message format
      const feedbackMessages: Message[] =
        feedbackNotifications?.map((notif) => ({
          id: notif.id,
          type: "teacher_feedback" as const,
          subject: notif.title,
          message: notif.message,
          created_at: notif.created_at,
          is_read: notif.is_read,
          sender: null,
          student: notif.students,
          class_name: undefined,
        })) || [];

      // Transform admin messages
      const adminMessages: Message[] = [
        ...(individualMessages?.map((msg) => ({
          id: msg.id,
          type: "admin_message" as const,
          subject: msg.subject,
          message: msg.message,
          delivery_method: msg.delivery_method,
          created_at: msg.created_at,
          sender: msg.sender,
          student: msg.students,
          class_name: undefined,
        })) || []),
        ...(classMessages?.map((msg) => ({
          id: msg.id,
          type: "admin_message" as const,
          subject: msg.subject,
          message: msg.message,
          delivery_method: msg.delivery_method,
          created_at: msg.created_at,
          sender: msg.sender,
          student: null,
          class_name: msg.classes?.name,
        })) || []),
      ];

      // Combine and sort all messages
      const allMessages = [...feedbackMessages, ...adminMessages].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMessages(allMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(messageId: string, type: string) {
    if (type !== "teacher_feedback") return;

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("parent_notifications")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  const filteredMessages = messages
    .filter((msg) => {
      if (selectedStudent !== "all") {
        if (msg.student && msg.student.first_name) {
          // For messages with student info, check if it matches
          const matchesStudent =
            students.find((s) => s.id === selectedStudent)?.first_name ===
            msg.student.first_name;
          return matchesStudent;
        }
        return false;
      }
      return true;
    })
    .filter((msg) => {
      if (filter === "unread") {
        return msg.is_read === false;
      }
      return true;
    });

  const unreadCount = messages.filter((m) => m.is_read === false).length;

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getMessageBadge(msg: Message) {
    if (msg.type === "teacher_feedback") {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
          📝 Teacher Feedback
        </span>
      );
    } else if (msg.delivery_method === "email") {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">
          📧 Email
        </span>
      );
    } else if (msg.delivery_method === "whatsapp_individual") {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
          💬 WhatsApp
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
          💬 Class Message
        </span>
      );
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Communications from teachers and school
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Student Filter */}
          {students.length > 1 && (
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Filter by student:
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="all">All Students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Read/Unread Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              Show messages:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "unread"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-muted-foreground">
              {filter === "unread" ? "No unread messages" : "No messages yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setExpandedId(expandedId === msg.id ? null : msg.id);
                  if (msg.is_read === false) {
                    markAsRead(msg.id, msg.type);
                  }
                }}
                className={`border rounded-lg cursor-pointer transition-all ${
                  msg.is_read === false
                    ? "border-primary bg-primary/5 hover:bg-primary/10"
                    : "border-input bg-card hover:bg-accent/50"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getMessageBadge(msg)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(msg.created_at)}
                        </span>
                        {msg.is_read === false && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {msg.sender && (
                          <span className="text-sm font-medium text-primary">
                            From: {msg.sender.full_name}
                          </span>
                        )}
                        {msg.type === "teacher_feedback" && (
                          <span className="text-sm font-medium text-primary">
                            From: Teacher
                          </span>
                        )}
                        {msg.student && (
                          <span className="text-xs text-muted-foreground">
                            • Re: {msg.student.first_name}{" "}
                            {msg.student.last_name}
                          </span>
                        )}
                        {msg.class_name && (
                          <span className="text-xs text-muted-foreground">
                            • {msg.class_name}
                          </span>
                        )}
                      </div>

                      {msg.subject && (
                        <div className="font-medium text-foreground mb-1">
                          {msg.subject}
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {msg.message}
                      </div>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground">
                      {expandedId === msg.id ? "▼" : "▶"}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === msg.id && (
                  <div className="px-4 pb-4 border-t border-input">
                    <div className="pt-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm font-sans">
                          {msg.message}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
