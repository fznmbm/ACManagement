"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  subject: string | null;
  message: string;
  delivery_method: "email" | "whatsapp_individual" | "whatsapp_group";
  created_at: string;
  student_id: string | null;
  sender: {
    full_name: string;
  } | null;
  students?: {
    first_name: string;
    last_name: string;
  };
  classes?: {
    name: string;
  };
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

      // Get messages for these students (individual messages to these students)
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

      // Get class-wide messages for classes these students are in
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

      // Combine and sort all messages
      const allMessages = [
        ...(individualMessages || []),
        ...classMessages,
      ].sort(
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

  const filteredMessages = messages.filter((msg) => {
    if (selectedStudent === "all") return true;
    if (msg.students && msg.student_id === selectedStudent) return true;
    // Include class messages if any of parent's students are in that class
    return false;
  });

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

  function getDeliveryBadge(method: Message["delivery_method"]) {
    if (method === "email") {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
          📧 Email
        </span>
      );
    } else if (method === "whatsapp_individual") {
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

        {/* Student Filter */}
        {students.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Filter by student:
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
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

        {/* Messages List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className="border border-input rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div
                  onClick={() =>
                    setExpandedId(expandedId === msg.id ? null : msg.id)
                  }
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getDeliveryBadge(msg.delivery_method)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        {msg.sender && (
                          <span className="text-sm font-medium text-primary">
                            From: {msg.sender.full_name}
                          </span>
                        )}
                        {msg.students && (
                          <span className="text-xs text-muted-foreground">
                            • Re: {msg.students.first_name}{" "}
                            {msg.students.last_name}
                          </span>
                        )}
                        {msg.classes && (
                          <span className="text-xs text-muted-foreground">
                            • {msg.classes.name}
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
