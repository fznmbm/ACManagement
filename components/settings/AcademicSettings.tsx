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

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const form = document.querySelector("form");
      if (!form) throw new Error("Form not found");

      const formData = new FormData(form);
      const data: Record<string, any> = {};

      // Initialize checkboxes as false
      data.show_grades_to_parents = false;

      formData.forEach((value, key) => {
        if (key === "show_grades_to_parents") {
          data[key] = true;
        } else {
          data[key] = value;
        }
      });

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "academic", data }),
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
              Alert generated when student attendance falls below this
              percentage
            </p>
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
                defaultValue={academicData.grading_scale || "percentage"}
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
                defaultValue={academicData.passing_grade || 70}
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

        {/* Prayer Sheet Settings */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-1">Prayer Sheet Settings</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Configure submission deadline and approximate prayer unlock times.
            Prayer sheets are enabled per-class in Class settings.
          </p>

          <div className="space-y-5">
            {/* Submission Deadline */}
            <div>
              <label className="form-label">Submission Deadline</label>
              <p className="text-xs text-muted-foreground mb-2">
                Parents must submit the week's prayer sheet by this day and time
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Day
                  </label>
                  <select
                    name="prayer_sheet_deadline_day"
                    defaultValue={academicData.prayer_sheet_deadline_day ?? 1}
                    className="form-input"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={0}>Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Time
                  </label>
                  <input
                    type="time"
                    name="prayer_sheet_deadline_time"
                    defaultValue={
                      academicData.prayer_sheet_deadline_time || "20:00"
                    }
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Prayer Unlock Times */}
            <div>
              <label className="form-label">
                Approximate Prayer Unlock Times
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Parents cannot mark a prayer before this time on the same day
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {
                    name: "prayer_fajr_unlock",
                    label: "Fajr",
                    default: "04:00",
                  },
                  {
                    name: "prayer_dhuhr_unlock",
                    label: "Dhuhr",
                    default: "12:00",
                  },
                  { name: "prayer_asr_unlock", label: "Asr", default: "15:00" },
                  {
                    name: "prayer_maghrib_unlock",
                    label: "Maghrib",
                    default: "18:00",
                  },
                  {
                    name: "prayer_isha_unlock",
                    label: "Isha",
                    default: "20:00",
                  },
                ].map((p) => (
                  <div key={p.name}>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {p.label}
                    </label>
                    <input
                      type="time"
                      name={p.name}
                      defaultValue={academicData[p.name] || p.default}
                      className="form-input"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Streak Threshold */}
            <div>
              <label className="form-label">Prayer Streak Threshold (%)</label>
              <input
                type="number"
                name="prayer_streak_threshold"
                defaultValue={academicData.prayer_streak_threshold || 80}
                className="form-input"
                min="1"
                max="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum % of prayers per week to count as a streak week (e.g. 80
                = 28/35 prayers)
              </p>
            </div>
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
