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
  const [parentContact, setParentContact] = useState<
    "father" | "mother" | "both"
  >("father");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "email" | "whatsapp_individual"
  >("whatsapp_individual");

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
  }

  // Send message
  async function handleSend() {
    if (!selectedStudent || !message) {
      alert("Please select a student and write a message");
      return;
    }

    // Check if parent contact is available
    if (deliveryMethod === "email" && !selectedStudent.parent_email) {
      alert("Parent email not available for this student");
      return;
    }

    if (deliveryMethod === "whatsapp_individual") {
      if (parentContact === "father" && !selectedStudent.parent_phone) {
        alert("Father phone number not available");
        return;
      }
      if (
        parentContact === "mother" &&
        !selectedStudent.parent_phone_secondary
      ) {
        alert("Mother phone number not available");
        return;
      }
    }

    setSending(true);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageType: "individual",
          studentId: selectedStudent.id,
          parentContactType: parentContact,
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

      if (data.method === "whatsapp") {
        // Open WhatsApp with pre-filled message
        window.open(data.whatsappUrl, "_blank");
        alert(
          `WhatsApp opened! Click send to complete message to ${data.parentName}`
        );
      } else if (data.method === "email") {
        alert("Email sent successfully!");
      }

      // Reset form
      setSelectedStudent(null);
      setParentContact("father");
      setSelectedTemplate("");
      setSubject("");
      setMessage("");

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
              <label className="flex items-center p-3 border border-input rounded-lg hover:bg-accent cursor-pointer">
                <input
                  type="radio"
                  name="parentContact"
                  value="father"
                  checked={parentContact === "father"}
                  onChange={(e) => setParentContact(e.target.value as "father")}
                  className="mr-3"
                  disabled={!selectedStudent.parent_phone}
                />
                <div className="flex-1">
                  <div className="font-medium">
                    Primary Contact: {selectedStudent.parent_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedStudent.parent_phone || "No phone number"}
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-input rounded-lg hover:bg-accent cursor-pointer">
                <input
                  type="radio"
                  name="parentContact"
                  value="mother"
                  checked={parentContact === "mother"}
                  onChange={(e) => setParentContact(e.target.value as "mother")}
                  className="mr-3"
                  disabled={!selectedStudent.parent_phone_secondary}
                />
                <div className="flex-1">
                  <div className="font-medium">Secondary Contact</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedStudent.parent_phone_secondary ||
                      "No phone number"}
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-input rounded-lg hover:bg-accent cursor-pointer">
                <input
                  type="radio"
                  name="parentContact"
                  value="both"
                  checked={parentContact === "both"}
                  onChange={(e) => setParentContact(e.target.value as "both")}
                  className="mr-3"
                  disabled={
                    !selectedStudent.parent_phone &&
                    !selectedStudent.parent_phone_secondary
                  }
                />
                <div className="flex-1">
                  <div className="font-medium">Both Contacts</div>
                  <div className="text-sm text-muted-foreground">
                    Send to both numbers
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
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
              placeholder="Write your message here..."
            />
            <div className="text-sm text-muted-foreground mt-1">
              Variables: {"{student_name}"}, {"{parent_name}"},{" "}
              {"{teacher_name}"}
            </div>
          </div>

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
              disabled={sending || !message}
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
