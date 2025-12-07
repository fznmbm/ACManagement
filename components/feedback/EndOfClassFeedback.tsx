"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Send, ChevronDown, ChevronUp } from "lucide-react";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  parent_name: string;
  parent_phone: string;
  parent_phone_secondary: string | null;
}

interface AttendanceRecord {
  student_id: string;
  status: "present" | "absent" | "late" | "excused";
}

interface PerformanceCriteria {
  id: string;
  name: string;
  display_order: number;
  rating_options: string[];
}

interface StudentFeedback {
  student_id: string;
  performance_ratings: { [key: string]: string };
  feedback_text: string;
  send_to_primary: boolean;
  send_to_secondary: boolean;
}

export default function EndOfClassFeedback({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<{
    [key: string]: AttendanceRecord;
  }>({});
  const [criteria, setCriteria] = useState<PerformanceCriteria[]>([]);
  const [feedback, setFeedback] = useState<{ [key: string]: StudentFeedback }>(
    {}
  );
  const [classSummary, setClassSummary] = useState("");
  const [homework, setHomework] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [className, setClassName] = useState("");

  useEffect(() => {
    loadClassData();
  }, [classId]);

  async function loadClassData() {
    setLoading(true);
    try {
      const supabase = createClient();

      // Load class name
      const { data: classData } = await supabase
        .from("classes")
        .select("name")
        .eq("id", classId)
        .single();

      if (classData) setClassName(classData.name);

      // Load students in this class
      const { data: studentsData } = await supabase
        .from("students")
        .select(
          "id, student_number, first_name, last_name, parent_name, parent_phone, parent_phone_secondary"
        )
        .eq("class_id", classId)
        .eq("status", "active")
        .order("first_name");

      setStudents(studentsData || []);

      // Load today's attendance
      const today = new Date().toISOString().split("T")[0];
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("class_id", classId)
        .eq("date", today);

      const attendanceMap: { [key: string]: AttendanceRecord } = {};
      attendanceData?.forEach((record) => {
        attendanceMap[record.student_id] = record;
      });
      setAttendance(attendanceMap);

      // Load performance criteria
      const { data: criteriaData } = await supabase
        .from("performance_criteria")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      setCriteria(criteriaData || []);

      // Initialize feedback state for all students
      const initialFeedback: { [key: string]: StudentFeedback } = {};
      studentsData?.forEach((student) => {
        initialFeedback[student.id] = {
          student_id: student.id,
          performance_ratings: {},
          feedback_text: "",
          send_to_primary: !!student.parent_phone,
          send_to_secondary: false,
        };
      });
      setFeedback(initialFeedback);
    } catch (error) {
      console.error("Error loading class data:", error);
    } finally {
      setLoading(false);
    }
  }

  function updatePerformanceRating(
    studentId: string,
    criteriaName: string,
    value: string
  ) {
    setFeedback((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        performance_ratings: {
          ...prev[studentId].performance_ratings,
          [criteriaName]: value,
        },
      },
    }));
  }

  function updateFeedbackText(studentId: string, text: string) {
    setFeedback((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        feedback_text: text,
      },
    }));
  }

  function toggleContact(
    studentId: string,
    contactType: "primary" | "secondary"
  ) {
    setFeedback((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [contactType === "primary" ? "send_to_primary" : "send_to_secondary"]:
          !prev[studentId][
            contactType === "primary" ? "send_to_primary" : "send_to_secondary"
          ],
      },
    }));
  }

  async function saveAndNotifyAll() {
    setSaving(true);
    try {
      const response = await fetch("/api/feedback/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: classId,
          session_date: new Date().toISOString().split("T")[0],
          class_summary: classSummary,
          homework,
          student_feedback: Object.values(feedback),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Open WhatsApp links for each student
        const whatsappLinks = result.whatsapp_links || [];

        if (whatsappLinks.length > 0) {
          alert(
            `Feedback saved! Opening WhatsApp for ${whatsappLinks.length} students.\n\nClick OK and then click each "Send WhatsApp" link.`
          );

          // Show modal with links
          showWhatsAppLinksModal(whatsappLinks);
        } else {
          alert("Feedback saved successfully! (No parents with phone numbers)");
          // Reload or redirect
          window.location.href = "/classes";
        }
      } else {
        alert("Error: " + (result.error || "Failed to save feedback"));
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
      alert("Failed to save feedback");
    } finally {
      setSaving(false);
    }
  }

  function showWhatsAppLinksModal(
    links: Array<{
      student_name: string;
      phone: string;
      message: string;
      url: string;
    }>
  ) {
    // Create modal content
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <h2 class="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Send WhatsApp Messages (${
          links.length
        })</h2>
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">Click each button to open WhatsApp and send the message</p>
        <div class="space-y-3">
          ${links
            .map(
              (link, index) => `
            <div class="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div class="font-medium text-slate-900 dark:text-white mb-1">${
                index + 1
              }. ${link.student_name}</div>
              <div class="text-sm text-slate-600 dark:text-slate-400 mb-2">${
                link.phone
              }</div>
              <a href="${
                link.url
              }" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                💬 Send WhatsApp
              </a>
            </div>
          `
            )
            .join("")}
        </div>
        <button onclick="this.closest('.fixed').remove()" class="mt-6 w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
          Close
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function getAttendanceStatus(studentId: string) {
    const record = attendance[studentId];
    if (!record)
      return {
        label: "Not marked",
        color: "text-gray-500",
        bgColor: "bg-gray-100 dark:bg-gray-800",
      };

    const statusMap = {
      present: {
        label: "✓ Present",
        color: "text-green-700 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
      },
      absent: {
        label: "✗ Absent",
        color: "text-red-700 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/30",
      },
      late: {
        label: "⏰ Late",
        color: "text-orange-700 dark:text-orange-400",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
      },
      excused: {
        label: "○ Excused",
        color: "text-blue-700 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
      },
    };

    return (
      statusMap[record.status] || {
        label: "Unknown",
        color: "text-gray-500",
        bgColor: "bg-gray-100 dark:bg-gray-800",
      }
    );
  }

  if (loading) {
    return <div className="p-6 text-center">Loading class data...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            End of Class Report
          </h1>
          <p className="text-muted-foreground mt-1">
            {className} •{" "}
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Class Summary */}
        <div className="mb-6 p-4 border border-input rounded-lg bg-card">
          <h3 className="font-semibold mb-3">Class Summary (Optional)</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Today we covered:
              </label>
              <textarea
                value={classSummary}
                onChange={(e) => setClassSummary(e.target.value)}
                placeholder="e.g., Surah Al-Fatiha revision, Tajweed rules..."
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Homework:
              </label>
              <textarea
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                placeholder="e.g., Practice at home, memorize Surah..."
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-3 mb-6">
          {students.map((student, index) => {
            const studentFeedback = feedback[student.id];
            const attendanceStatus = getAttendanceStatus(student.id);
            const isExpanded = expandedStudent === student.id;

            return (
              <div
                key={student.id}
                className="border border-input rounded-lg bg-card overflow-hidden"
              >
                <div
                  onClick={() =>
                    setExpandedStudent(isExpanded ? null : student.id)
                  }
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground">
                        {index + 1}.
                      </span>
                      <div>
                        <div className="font-semibold text-lg">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {student.student_number}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${attendanceStatus.color} ${attendanceStatus.bgColor}`}
                          >
                            {attendanceStatus.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-input bg-muted/20">
                    {/* Performance Ratings */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-3">Today's Performance:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {criteria.map((c) => (
                          <div key={c.id}>
                            <label className="block text-sm font-medium mb-1">
                              {c.name}:
                            </label>
                            <select
                              value={
                                studentFeedback.performance_ratings[c.name] ||
                                ""
                              }
                              onChange={(e) =>
                                updatePerformanceRating(
                                  student.id,
                                  c.name,
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            >
                              <option value="">-</option>
                              {c.rating_options.map((option) => (
                                <option key={option} value={option}>
                                  {option.charAt(0).toUpperCase() +
                                    option.slice(1).replace("_", " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        Feedback (Optional):
                      </label>
                      <textarea
                        value={studentFeedback.feedback_text}
                        onChange={(e) =>
                          updateFeedbackText(student.id, e.target.value)
                        }
                        placeholder="Additional comments..."
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        rows={2}
                      />
                    </div>

                    {/* Contact Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Send to:
                      </label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={studentFeedback.send_to_primary}
                            onChange={() =>
                              toggleContact(student.id, "primary")
                            }
                            disabled={!student.parent_phone}
                            className="rounded"
                          />
                          <span className="text-sm">
                            Primary ({student.parent_phone || "No phone"})
                          </span>
                        </label>
                        {student.parent_phone_secondary && (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={studentFeedback.send_to_secondary}
                              onChange={() =>
                                toggleContact(student.id, "secondary")
                              }
                              className="rounded"
                            />
                            <span className="text-sm">
                              Secondary ({student.parent_phone_secondary})
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={saveAndNotifyAll}
            disabled={saving}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Save & Notify Parents
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
