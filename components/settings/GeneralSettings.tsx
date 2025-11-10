// components/settings/GeneralSettings.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface GeneralSettingsProps {
  settings: Record<string, any>;
}

export default function GeneralSettings({ settings }: GeneralSettingsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      // In a real implementation, you would save settings to database
      // For now, we'll just simulate a save
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
        <h3 className="text-lg font-semibold mb-4">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure basic system settings and preferences
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="form-label">Application Name</label>
          <input
            type="text"
            defaultValue="Madrasa Attendance System"
            className="form-input"
            placeholder="Your Madrasa Name"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This name appears in the header and reports
          </p>
        </div>

        <div>
          <label className="form-label">Default Language</label>
          <select className="form-input">
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="both">Both (Bilingual)</option>
          </select>
        </div>

        <div>
          <label className="form-label">Date Format</label>
          <select className="form-input">
            <option value="DD/MM/YYYY">DD/MM/YYYY (10/11/2025)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (11/10/2025)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-11-10)</option>
          </select>
        </div>

        <div>
          <label className="form-label">Time Format</label>
          <select className="form-input">
            <option value="12">12-hour (3:45 PM)</option>
            <option value="24">24-hour (15:45)</option>
          </select>
        </div>

        <div>
          <label className="form-label">Week Start Day</label>
          <select className="form-input">
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
            <option value="saturday">Saturday</option>
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm">Enable automatic backups (daily)</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm">Show Hijri calendar dates</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        {saved && (
          <span className="text-sm text-green-600 flex items-center space-x-1">
            <span>✓ Settings saved successfully!</span>
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
