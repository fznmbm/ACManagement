"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Class {
  id: string;
  name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
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
        .from("classes")
        .select("*")
        .order("name");

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
              {cls.name} ({cls.day_of_week} {cls.start_time})
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
          </div>

          {/* Delivery Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Send via:</label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border-2 border-primary rounded-lg cursor-pointer bg-primary/5">
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
                  <div className="font-medium">
                    💬 WhatsApp Group (Recommended)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Copy message and paste into "{selectedClassName}" WhatsApp
                    group
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-input rounded-lg cursor-pointer hover:bg-accent">
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
              disabled={sending || !message}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending
                ? "Processing..."
                : deliveryMethod === "whatsapp_group"
                ? "📋 Prepare Message"
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

          {/* WhatsApp Copy Section */}
          {messageText && deliveryMethod === "whatsapp_group" && (
            <div className="mt-6 p-4 border-2 border-primary rounded-lg bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">
                  ✅ Message Ready for WhatsApp Group
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                >
                  📋 {showCopySuccess ? "Copied!" : "Copy Message"}
                </button>
              </div>

              <div className="p-3 bg-background border border-input rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {messageText}
                </pre>
              </div>

              <div className="mt-3 text-sm text-muted-foreground">
                <strong>Next steps:</strong>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>Click "Copy Message" above</li>
                  <li>Open your "{selectedClassName}" WhatsApp group</li>
                  <li>Paste and send the message</li>
                </ol>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
