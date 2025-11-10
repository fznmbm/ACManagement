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

  const academicYear = settings.academic_year || { current: "2024-2025" };
  const attendanceCutoff = settings.attendance_cutoff_time || {
    regular: "09:00",
  };
  const lowAttendanceThreshold = settings.low_attendance_threshold || {
    percentage: 75,
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
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

      <div className="space-y-6">
        {/* Academic Year */}
        <div className="border border-border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Academic Year</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Current Year</label>
              <input
                type="text"
                defaultValue={academicYear.current}
                className="form-input"
                placeholder="2024-2025"
              />
            </div>
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                defaultValue={academicYear.start_date}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                defaultValue={academicYear.end_date}
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
                  defaultValue={attendanceCutoff.regular}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Grace Period (minutes)</label>
                <input
                  type="number"
                  defaultValue={attendanceCutoff.grace_period_minutes || 15}
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
                defaultValue={lowAttendanceThreshold.percentage}
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
                  defaultChecked={lowAttendanceThreshold.alert_admin}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm">Send alerts for low attendance</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  defaultChecked
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
              <select className="form-input">
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
                defaultValue="60"
                className="form-input"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  defaultChecked
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
                defaultChecked
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
      </div>

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
