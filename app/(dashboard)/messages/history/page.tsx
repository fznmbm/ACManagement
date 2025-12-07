"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  message_type: "individual" | "class";
  student_id: string | null;
  class_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  subject: string | null;
  message: string;
  delivery_method: "email" | "whatsapp_individual" | "whatsapp_group";
  email_sent: boolean;
  email_sent_at: string | null;
  whatsapp_link_generated: boolean;
  whatsapp_message_copied: boolean;
  created_at: string;
  students?: {
    first_name: string;
    last_name: string;
    student_number: string;
  };
  classes?: {
    name: string;
  };
}

export default function MessageHistoryPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "individual" | "class">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          students (first_name, last_name, student_number),
          classes (name)
        `
        )
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      alert("Failed to load message history");
    } finally {
      setLoading(false);
    }
  }

  const filteredMessages = messages.filter((msg) => {
    if (filter === "all") return true;
    return msg.message_type === filter;
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

  function getDeliveryBadge(msg: Message) {
    if (msg.delivery_method === "email") {
      if (msg.email_sent) {
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
            📧 Email Sent
          </span>
        );
      } else {
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100">
            ❌ Email Failed
          </span>
        );
      }
    } else if (msg.delivery_method === "whatsapp_individual") {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
          💬 WhatsApp
        </span>
      );
    } else if (msg.delivery_method === "whatsapp_group") {
      if (msg.whatsapp_message_copied) {
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
            💬 Copied
          </span>
        );
      } else {
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
            💬 Ready
          </span>
        );
      }
    }
    return null;
  }

  function getRecipient(msg: Message) {
    if (msg.message_type === "individual" && msg.students) {
      return `${msg.students.first_name} ${msg.students.last_name} (${msg.students.student_number})`;
    } else if (msg.message_type === "class" && msg.classes) {
      return `Class: ${msg.classes.name}`;
    }
    return "Unknown";
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Message History
            </h1>
            <p className="text-muted-foreground mt-1">View all sent messages</p>
          </div>
          <button
            onClick={loadMessages}
            disabled={loading}
            className="px-4 py-2 border border-input rounded-lg hover:bg-accent transition-colors"
          >
            {loading ? "Loading..." : "🔄 Refresh"}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-foreground hover:bg-accent/80"
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter("individual")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "individual"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-foreground hover:bg-accent/80"
            }`}
          >
            Individual (
            {messages.filter((m) => m.message_type === "individual").length})
          </button>
          <button
            onClick={() => setFilter("class")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "class"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-foreground hover:bg-accent/80"
            }`}
          >
            Class ({messages.filter((m) => m.message_type === "class").length})
          </button>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No messages found
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
                      <div className="flex items-center gap-2 mb-1">
                        {getDeliveryBadge(msg)}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <div className="font-medium text-foreground mb-1">
                        {getRecipient(msg)}
                      </div>
                      {msg.subject && (
                        <div className="text-sm text-muted-foreground mb-1">
                          Subject: {msg.subject}
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
                    <div className="pt-4 space-y-3">
                      {msg.parent_name && (
                        <div>
                          <span className="text-sm font-medium">Parent: </span>
                          <span className="text-sm text-muted-foreground">
                            {msg.parent_name}
                          </span>
                        </div>
                      )}
                      {msg.parent_phone && (
                        <div>
                          <span className="text-sm font-medium">Phone: </span>
                          <span className="text-sm text-muted-foreground">
                            {msg.parent_phone}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium mb-2">
                          Full Message:
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm font-sans">
                            {msg.message}
                          </pre>
                        </div>
                      </div>
                      {msg.delivery_method === "email" && msg.email_sent_at && (
                        <div className="text-xs text-muted-foreground">
                          Sent: {formatDate(msg.email_sent_at)}
                        </div>
                      )}
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
