"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  parent_name: string;
  parent_email: string | null;
  parent_phone: string;
  parent_phone_secondary: string | null;
  class_id: string;
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

export default function StudentMessageForm({ onSuccess, onCancel }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");

  // Form state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sendToPrimary, setSendToPrimary] = useState(true);
  const [sendToSecondary, setSendToSecondary] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "email" | "whatsapp_individual"
  >("whatsapp_individual");
  // Custom variables for templates
  const [customVariables, setCustomVariables] = useState<
    Record<string, string>
  >({});

  // Load students and templates
  useEffect(() => {
    loadStudents();
    loadTemplates();
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("status", "active")
        .order("first_name");

      if (error) throw error;
      setStudents(data || []);

      // Load classes
      const { data: classData } = await supabase
        .from("classes")
        .select("id, name")
        .order("name");
      setClasses(classData || []);
    } catch (error) {
      console.error("Error loading students:", error);
      alert("Failed to load students");
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

  // Filter students based on search
  const filteredStudents = students.filter((s) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      s.first_name.toLowerCase().includes(searchLower) ||
      s.last_name.toLowerCase().includes(searchLower) ||
      s.student_number.includes(searchLower);
    const matchesClass = !selectedClass || s.class_id === selectedClass;
    return matchesSearch && matchesClass;
  });

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

  // Handle student selection
  function handleStudentSelect(student: Student) {
    setSelectedStudent(student);
    setSearchTerm("");

    setSendToPrimary(!!student.parent_phone);
    setSendToSecondary(!!student.parent_phone_secondary);
  }

  // Detect which custom variables are needed
  function getRequiredVariables(text: string): string[] {
    const variables: string[] = [];
    const matches = text.match(/{([^}]+)}/g);

    if (matches) {
      matches.forEach((match) => {
        const varName = match.replace(/[{}]/g, "");
        // Only include variables that aren't auto-filled
        if (
          ![
            "student_name",
            "parent_name",
            "teacher_name",
            "class_name",
          ].includes(varName)
        ) {
          if (!variables.includes(varName)) {
            variables.push(varName);
          }
        }
      });
    }

    return variables;
  }

  const requiredVariables = getRequiredVariables(message);

  async function handleSend() {
    if (!selectedStudent || !message) {
      alert("Please select a student and write a message");
      return;
    }

    // Check character limit
    if (message.length > 4096) {
      alert("Message is too long. Maximum 4096 characters allowed.");
      return;
    }

    // NEW: Check if all required custom variables are filled
    const required = getRequiredVariables(message);
    const missingVars = required.filter((varName) => !customVariables[varName]);
    if (missingVars.length > 0) {
      alert(
        `Please fill in all required fields: ${missingVars
          .map((v) => v.replace(/_/g, " "))
          .join(", ")}`
      );
      return;
    }

    // Check if at least one contact is selected
    if (!sendToPrimary && !sendToSecondary) {
      alert("Please select at least one contact to send to");
      return;
    }

    // Check if selected contacts are available
    if (sendToPrimary && !selectedStudent.parent_phone) {
      alert("Primary phone number not available");
      return;
    }
    if (sendToSecondary && !selectedStudent.parent_phone_secondary) {
      alert("Secondary phone number not available");
      return;
    }

    // Check email availability
    if (deliveryMethod === "email" && !selectedStudent.parent_email) {
      alert("Parent email not available for this student");
      return;
    }

    setSending(true);

    try {
      // Convert boolean states to API format
      const parentContactType =
        sendToPrimary && sendToSecondary
          ? "both"
          : sendToPrimary
          ? "father"
          : sendToSecondary
          ? "mother"
          : "father";

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageType: "individual",
          studentId: selectedStudent.id,
          parentContactType,
          subject,
          message,
          deliveryMethod,
          templateUsed: selectedTemplate || null,
          customVariables: customVariables, // ✅ ADD THIS LINE
        }),
      });

      const data = await response.json();

      // DEBUG: Log what API returns
      console.log("=== API RESPONSE ===");
      console.log("Full response:", data);
      console.log("Method:", data.method);
      console.log("WhatsApp URL (singular):", data.whatsappUrl);
      console.log("WhatsApp URLs (array):", data.whatsappUrls);
      console.log("==================");

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      if (data.method === "whatsapp" || data.method === "whatsapp_individual") {
        // Handle both singular and array formats
        let urls: string[] = [];

        if (data.whatsappUrls && Array.isArray(data.whatsappUrls)) {
          urls = data.whatsappUrls;
        } else if (data.whatsappUrl) {
          urls = [data.whatsappUrl];
        }

        if (urls.length > 0) {
          console.log("Opening WhatsApp URLs:", urls);

          // Open each WhatsApp link
          urls.forEach((url: string, index: number) => {
            setTimeout(() => {
              console.log(`Opening URL ${index + 1}:`, url);
              const opened = window.open(url, "_blank");
              if (!opened) {
                console.error("Failed to open window - popup might be blocked");
              }
            }, index * 1000); // 1 second delay between each
          });

          alert(
            `Opening WhatsApp for ${urls.length} contact(s).\n\nIf windows don't open, please allow popups for this site.`
          );
        } else {
          console.error("No WhatsApp URL found in response:", data);
          alert(
            "Error: API didn't return a WhatsApp URL.\n\nCheck browser console (F12) for details."
          );
          return; // Don't reset form if there's an error
        }
      } else if (data.method === "email") {
        alert("Email sent successfully!");
      } else {
        console.error("Unknown delivery method:", data);
        alert(
          `Error: Unknown delivery method "${data.method}".\n\nCheck browser console (F12) for details.`
        );
        return; // Don't reset form if there's an error
      }

      // Reset form only on success
      setSelectedStudent(null);
      setSendToPrimary(true);
      setSendToSecondary(false);
      setSelectedTemplate("");
      setSubject("");
      setMessage("");
      setCustomVariables({}); // ✅ ADD THIS LINE

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Student</label>

        {!selectedStudent ? (
          <div>
            {/* Class Filter */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Filter by Class (Optional)
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Search by name or student number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />

            <div className="mt-2 max-h-60 overflow-y-auto border border-input rounded-lg bg-background">
              {loading ? (
                <div className="px-4 py-3 text-muted-foreground">
                  Loading students...
                </div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                    className="w-full text-left px-4 py-3 hover:bg-accent border-b last:border-b-0 transition-colors"
                  >
                    <div className="font-medium">
                      {student.first_name} {student.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {student.student_number}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-muted-foreground">
                  No students found
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 border border-input rounded-lg bg-accent">
            <div>
              <div className="font-medium">
                {selectedStudent.first_name} {selectedStudent.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedStudent.student_number}
              </div>
            </div>
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-sm text-primary hover:underline"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {selectedStudent && (
        <>
          {/* Parent Contact Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Send to:</label>
            <div className="space-y-2">
              {/* Primary Contact */}
              <label
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  sendToPrimary
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-accent"
                } ${
                  !selectedStudent.parent_phone
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={sendToPrimary}
                  onChange={(e) => setSendToPrimary(e.target.checked)}
                  disabled={!selectedStudent.parent_phone}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="font-medium flex items-center justify-between">
                    <span>Primary: {selectedStudent.parent_name}</span>
                    {sendToPrimary && (
                      <span className="text-xs text-primary">✓ Will Send</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedStudent.parent_phone || "No phone number"}
                  </div>
                </div>
              </label>

              {/* Secondary Contact */}
              <label
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  sendToSecondary
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-accent"
                } ${
                  !selectedStudent.parent_phone_secondary
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={sendToSecondary}
                  onChange={(e) => setSendToSecondary(e.target.checked)}
                  disabled={!selectedStudent.parent_phone_secondary}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="font-medium flex items-center justify-between">
                    <span>Secondary Contact</span>
                    {sendToSecondary && (
                      <span className="text-xs text-primary">✓ Will Send</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedStudent.parent_phone_secondary ||
                      "No phone number"}
                  </div>
                </div>
              </label>
            </div>
          </div>

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
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.category})
                </option>
              ))}
            </select>
          </div>

          {/* Subject (for email) */}
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

            {/* NEW: Quick-insert variable buttons */}
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => setMessage(message + "{student_name}")}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                + Student Name
              </button>
              <button
                type="button"
                onClick={() => setMessage(message + "{parent_name}")}
                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              >
                + Parent Name
              </button>
              <button
                type="button"
                onClick={() => setMessage(message + "{teacher_name}")}
                className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                + Teacher Name
              </button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
              placeholder="Write your message here..."
            />

            {/* NEW: Character counter */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>
                Sending to:{" "}
                {sendToPrimary && sendToSecondary
                  ? "Both contacts"
                  : sendToPrimary
                  ? "Primary contact"
                  : sendToSecondary
                  ? "Secondary contact"
                  : "No contact selected"}
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

          {/* Message section */}
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>

            {/* Quick-insert variable buttons */}
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                type="button"
                onClick={() => setMessage(message + "{student_name}")}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                + Student Name
              </button>
              <button
                type="button"
                onClick={() => setMessage(message + "{parent_name}")}
                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              >
                + Parent Name
              </button>
              <button
                type="button"
                onClick={() => setMessage(message + "{teacher_name}")}
                className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                + Teacher Name
              </button>
              <button
                type="button"
                onClick={() => setMessage(message + "{class_name}")}
                className="px-2 py-1 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
              >
                + Class Name
              </button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
              placeholder="Write your message here..."
            />

            {/* Character counter */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>
                Sending to:{" "}
                {sendToPrimary && sendToSecondary
                  ? "Both contacts"
                  : sendToPrimary
                  ? "Primary contact"
                  : sendToSecondary
                  ? "Secondary contact"
                  : "No contact selected"}
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

          {/* NEW: Custom Variables Section */}
          {requiredVariables.length > 0 && (
            <div className="p-4 border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  This message requires additional information:
                </p>
              </div>

              {requiredVariables.map((varName) => (
                <div key={varName}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {varName.replace(/_/g, " ")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {varName === "exam_date" || varName === "date" ? (
                    <input
                      type="date"
                      value={customVariables[varName] || ""}
                      onChange={(e) =>
                        setCustomVariables({
                          ...customVariables,
                          [varName]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  ) : (
                    <input
                      type="text"
                      value={customVariables[varName] || ""}
                      onChange={(e) =>
                        setCustomVariables({
                          ...customVariables,
                          [varName]: e.target.value,
                        })
                      }
                      placeholder={`Enter ${varName.replace(/_/g, " ")}...`}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  )}
                </div>
              ))}

              <p className="text-xs text-amber-700 dark:text-amber-300">
                💡 These values will replace the {"{"}variables{"}"} in your
                message
              </p>
            </div>
          )}

          {/* Delivery Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Send via:</label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border-2 border-primary rounded-lg cursor-pointer bg-primary/5">
                <input
                  type="radio"
                  name="delivery"
                  value="whatsapp_individual"
                  checked={deliveryMethod === "whatsapp_individual"}
                  onChange={(e) =>
                    setDeliveryMethod(e.target.value as "whatsapp_individual")
                  }
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">💬 WhatsApp (Recommended)</div>
                  <div className="text-sm text-muted-foreground">
                    Opens WhatsApp with pre-filled message
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
                  disabled={!selectedStudent.parent_email}
                />
                <div>
                  <div className="font-medium">📧 Email (Important only)</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedStudent.parent_email || "No email available"}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSend}
              disabled={
                sending ||
                !message ||
                message.length > 4096 ||
                (!sendToPrimary && !sendToSecondary)
              }
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending
                ? "Sending..."
                : deliveryMethod === "whatsapp_individual"
                ? "💬 Send WhatsApp"
                : "📧 Send Email"}
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
        </>
      )}
    </div>
  );
}
