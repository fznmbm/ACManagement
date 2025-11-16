// components/settings/AcademicSettings.tsx
"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AcademicSettingsProps {
  settings: Record<string, any>;
}

export default function AcademicSettings({ settings }: AcademicSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const academicData = settings.academic || {};
  // const attendanceCutoff = settings.attendance_cutoff_time || {};
  // const lowAttendanceThreshold = settings.low_attendance_threshold || {};
  // const gradingSettings = settings.academic || {};
  // const prayerTimes = settings.prayer_times || {};

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const form = document.querySelector("form");
      if (!form) throw new Error("Form not found");

      const formData = new FormData(form);
      const data: Record<string, any> = {};

      // Initialize all checkboxes as false
      data.send_alerts = false;
      data.allow_edit_past = false;
      data.show_grades_to_parents = false;
      data.prayer_times_enabled = false;

      formData.forEach((value, key) => {
        if (
          key === "send_alerts" ||
          key === "allow_edit_past" ||
          key === "show_grades_to_parents" ||
          key === "prayer_times_enabled"
        ) {
          data[key] = true; // Checkbox checked
        } else {
          data[key] = value;
        }
      });

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "academic",
          data: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Academic Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure academic year, attendance rules, and grading system
        </p>
      </div>

      <form className="space-y-6">
        {/* Academic Year */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Academic Year</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Current Year</label>
              <input
                type="text"
                name="academic_year"
                defaultValue={academicData.academic_year}
                className="form-input"
                placeholder="2024-2025"
              />
            </div>
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="start_date"
                defaultValue={academicData.start_date}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                name="end_date"
                defaultValue={academicData.end_date}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Attendance Rules */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Attendance Rules</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Class Start Time</label>
                <input
                  type="time"
                  name="class_start_time"
                  defaultValue={academicData.class_start_time}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Grace Period (minutes)</label>
                <input
                  type="number"
                  name="grace_period"
                  defaultValue={academicData.grace_period || 15}
                  className="form-input"
                  min="0"
                  max="60"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Students arriving within this time won't be marked late
                </p>
              </div>
            </div>

            <div>
              <label className="form-label">Low Attendance Threshold (%)</label>
              <input
                type="number"
                name="low_attendance_threshold"
                defaultValue={academicData.low_attendance_threshold || 75}
                className="form-input"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alert admins when student attendance falls below this percentage
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="send_alerts"
                  defaultChecked={academicData.send_alerts}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm">Send alerts for low attendance</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="allow_edit_past"
                  defaultChecked={academicData.allow_edit_past}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm">
                  Allow teachers to edit past attendance (within 7 days)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Grading System */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Grading System</h4>
          <div className="space-y-4">
            <div>
              <label className="form-label">Grading Scale</label>
              <select
                name="grading_scale"
                defaultValue={academicData.grading_scale || "perentage"}
                className="form-input"
              >
                <option value="percentage">Percentage (0-100)</option>
                <option value="letter">Letter Grades (A, B, C, D, F)</option>
                <option value="points">Points (0-4.0 GPA)</option>
                <option value="custom">Custom Scale</option>
              </select>
            </div>

            <div>
              <label className="form-label">Passing Grade (%)</label>
              <input
                type="number"
                name="passing_grade"
                defaultValue={academicData.passing_grade}
                className="form-input"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="show_grades_to_parents"
                  defaultChecked={academicData.show_grades_to_parents}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm">Show grades to parents</span>
              </label>
            </div>
          </div>
        </div>

        {/* Prayer Times */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Prayer Times Session</h4>
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="prayer_times_enabled"
                defaultChecked={academicData.prayer_times_enabled}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm">
                Enable prayer time attendance tracking
              </span>
            </label>
            <p className="text-xs text-muted-foreground mt-2 ml-7">
              Allow marking separate attendance for prayer sessions (Fajr,
              Dhuhr, Asr, Maghrib, Isha)
            </p>
          </div>
        </div>
      </form>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        {saved && (
          <span className="text-sm text-green-600">
            ✓ Settings saved successfully!
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
