"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ApplicationSettings {
  id?: string;
  academic_year: string;
  application_open_date: string;
  application_close_date: string;
  max_applications: number;
  minimum_age: number;
  current_applications_count: number;
  is_active: boolean;
}

export default function ApplicationSettings() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<ApplicationSettings>({
    academic_year: "2025-2026",
    application_open_date: "",
    application_close_date: "",
    max_applications: 100,
    minimum_age: 4,
    current_applications_count: 0,
    is_active: false,
  });

  // Load existing settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("application_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        console.error("Error loading settings:", error);
      }

      if (data) {
        setSettings({
          id: data.id,
          academic_year: data.academic_year,
          application_open_date: data.application_open_date,
          application_close_date: data.application_close_date,
          max_applications: data.max_applications,
          minimum_age: data.minimum_age,
          current_applications_count: data.current_applications_count || 0,
          is_active: data.is_active,
        });
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setShowSuccess(false);

    try {
      // Validate dates
      const openDate = new Date(settings.application_open_date);
      const closeDate = new Date(settings.application_close_date);

      if (closeDate <= openDate) {
        setError("Close date must be after open date");
        setSaving(false);
        return;
      }

      // If activating, deactivate all other settings first
      if (settings.is_active) {
        await supabase
          .from("application_settings")
          .update({ is_active: false })
          .neq("id", settings.id || "");
      }

      if (settings.id) {
        // Update existing
        const { error } = await supabase
          .from("application_settings")
          .update({
            academic_year: settings.academic_year,
            application_open_date: settings.application_open_date,
            application_close_date: settings.application_close_date,
            max_applications: settings.max_applications,
            minimum_age: settings.minimum_age,
            is_active: settings.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("application_settings")
          .insert({
            academic_year: settings.academic_year,
            application_open_date: settings.application_open_date,
            application_close_date: settings.application_close_date,
            max_applications: settings.max_applications,
            minimum_age: settings.minimum_age,
            current_applications_count: 0,
            is_active: settings.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        setSettings({ ...settings, id: data.id });
      }

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reload to get updated data
      await loadSettings();
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Application Management
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Configure application periods and requirements. Applications are
              automatically managed based on these settings.
            </p>
          </div>
        </div>
      </div>

      {/* Active Status Banner */}
      {settings.is_active ? (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-400">
                Applications are currently OPEN
              </p>
              <p className="text-sm text-green-700 dark:text-green-500">
                Students can submit applications for {settings.academic_year}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-800 dark:text-orange-400">
                Applications are currently CLOSED
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-500">
                Activate settings below to open applications
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Academic Year */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Academic Year
          </label>
          <input
            type="text"
            value={settings.academic_year}
            onChange={(e) =>
              setSettings({ ...settings, academic_year: e.target.value })
            }
            placeholder="e.g., 2025-2026"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: YYYY-YYYY (e.g., 2025-2026)
          </p>
        </div>

        {/* Date Range */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Application Open Date
            </label>
            <input
              type="date"
              value={settings.application_open_date}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  application_open_date: e.target.value,
                })
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Application Close Date
            </label>
            <input
              type="date"
              value={settings.application_close_date}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  application_close_date: e.target.value,
                })
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>
        </div>

        {/* Max Applications & Min Age */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Users className="h-4 w-4 inline mr-1" />
              Maximum Applications
            </label>
            <input
              type="number"
              value={settings.max_applications}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_applications: parseInt(e.target.value),
                })
              }
              min="1"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum number of applications to accept
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Minimum Age (years)
            </label>
            <input
              type="number"
              value={settings.minimum_age}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minimum_age: parseInt(e.target.value),
                })
              }
              min="1"
              max="18"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum age requirement for applicants
            </p>
          </div>
        </div>

        {/* Current Count (Read-only) */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-300">
                Current Applications Received
              </p>
              <p className="text-3xl font-bold text-white">
                {settings.current_applications_count}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">Remaining Capacity</p>
              <p className="text-2xl font-bold text-white">
                {settings.max_applications -
                  settings.current_applications_count}
              </p>
            </div>
          </div>
          {settings.current_applications_count >= settings.max_applications && (
            <p className="text-sm text-orange-400 font-medium mt-2">
              ⚠️ Maximum capacity reached!
            </p>
          )}
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
          <div>
            <p className="font-medium">Activate Application Period</p>
            <p className="text-sm text-muted-foreground">
              Enable this to allow students to submit applications
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.is_active}
              onChange={(e) =>
                setSettings({ ...settings, is_active: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      {/* Fixed Bottom Bar - Matching your existing design */}
      <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-background border-t border-border p-4 z-10">
        <div className="flex items-center justify-end gap-4">
          {/* Success Message */}
          {showSuccess && (
            <div className="flex items-center gap-2 text-green-600 animate-in fade-in slide-in-from-right-5">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Settings saved successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 animate-in fade-in slide-in-from-right-5">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
