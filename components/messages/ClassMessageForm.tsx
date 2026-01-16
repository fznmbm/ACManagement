"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Class {
  id: string;
  name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  students?: Array<{ count: number }>;
}

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
}

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ClassMessageForm({ onSuccess, onCancel }: Props) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Form state
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "whatsapp_group" | "email"
  >("whatsapp_group");

  // Result state
  const [messageText, setMessageText] = useState("");
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Load classes and templates
  useEffect(() => {
    loadClasses();
    loadTemplates();
  }, []);

  async function loadClasses() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        // .from("classes")
        // .select("*")
        // .order("name");
        .from("classes")
        .select(
          `
    *,
    students:students(count)
  `
        )
        .eq("is_active", true);

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error loading classes:", error);
      alert("Failed to load classes");
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    try {
      const response = await fetch("/api/messages/templates");
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  }

  // Handle template selection
  function handleTemplateChange(templateId: string) {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setSubject(template.subject);
        setMessage(template.body);
      }
    } else {
      setSubject("");
      setMessage("");
    }
  }

  // Copy message to clipboard
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(message);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy message. Please copy manually.");
    }
  }

  // Send message
  async function handleSend() {
    if (!selectedClass || !message) {
      alert("Please select a class and write a message");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageType: "class",
          classId: selectedClass,
          subject,
          message,
          deliveryMethod,
          templateUsed: selectedTemplate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      if (data.method === "whatsapp_group") {
        // Show message ready to copy
        setMessageText(data.messageText);
        alert(
          `Message ready! Copy and paste into your "${data.className}" WhatsApp group`
        );
      } else if (data.method === "email") {
        alert(
          `Emails sent: ${data.successCount} succeeded, ${data.failCount} failed`
        );

        // Reset form after email
        setSelectedClass("");
        setSelectedTemplate("");
        setSubject("");
        setMessage("");
        setMessageText("");
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const selectedClassName =
    classes.find((c) => c.id === selectedClass)?.name || "";

  const selectedClassInfo = classes.find((c) => c.id === selectedClass);
  const studentCount = selectedClassInfo?.students?.[0]?.count || 0;

  return (
    <div className="space-y-6">
      {/* Class Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Class</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
        >
          <option value="">-- Select Class --</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {/* FIX: Use cls instead of class, add optional chaining */}
              {cls.name} ({cls.students?.[0]?.count || 0} students)
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <>
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Quick Template (Optional)
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            >
              <option value="">Custom Message</option>
              {templates
                .filter(
                  (t) =>
                    t.category === "announcement" || t.category === "general"
                )
                .map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Subject (for email only) */}
          {deliveryMethod === "email" && (
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="Message subject..."
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
              placeholder="Write your message here..."
            />

            {/* NEW: Character Counter */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>
                Will send to {studentCount} parent
                {studentCount !== 1 ? "s" : ""}
              </span>
              <span
                className={
                  message.length > 4000 ? "text-red-600 font-medium" : ""
                }
              >
                {message.length} / 4096 characters
                {message.length > 4000 && " ⚠️ Too long!"}
              </span>
            </div>
          </div>

          {/* Delivery Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Send via:</label>
            <div className="space-y-2">
              {/* WhatsApp Group Option with Copy Button */}
              <div
                className={`p-3 border-2 rounded-lg ${
                  deliveryMethod === "whatsapp_group"
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-accent"
                }`}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    value="whatsapp_group"
                    checked={deliveryMethod === "whatsapp_group"}
                    onChange={(e) =>
                      setDeliveryMethod(e.target.value as "whatsapp_group")
                    }
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center justify-between">
                      <span>💬 WhatsApp Group (Recommended)</span>
                      {/* NEW: Copy button always visible for WhatsApp */}
                      {deliveryMethod === "whatsapp_group" && message && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard();
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          {showCopySuccess ? "✓ Copied!" : "📋 Copy Message"}
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Copy message and paste into "{selectedClassName}" WhatsApp
                      group
                    </div>
                  </div>
                </label>
              </div>

              {/* Email Option */}
              <label
                className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                  deliveryMethod === "email"
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-accent"
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value="email"
                  checked={deliveryMethod === "email"}
                  onChange={(e) => setDeliveryMethod(e.target.value as "email")}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">
                    📧 Email All Parents (Important only)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sends individual email to each parent with email on file
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSend}
              disabled={sending || !message || message.length > 4096}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending
                ? "Processing..."
                : deliveryMethod === "whatsapp_group"
                ? "✓ Mark as Sent"
                : "📧 Send Emails"}
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                disabled={sending}
                className="px-6 py-3 border border-input rounded-lg font-medium hover:bg-accent disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Success message after sending emails */}
          {messageText && deliveryMethod === "email" && (
            <div className="mt-4 p-4 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="font-medium text-green-800 dark:text-green-200">
                ✅ Emails sent successfully!
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
