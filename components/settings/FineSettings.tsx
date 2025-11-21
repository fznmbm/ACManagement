"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, AlertTriangle, Coins, Loader2 } from "lucide-react";

interface FineSetting {
  id: string;
  fine_type: string;
  amount: number;
  is_active: boolean;
  description: string;
}

export default function FineSettings() {
  const [fineSettings, setFineSettings] = useState<FineSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchFineSettings();
  }, []);

  const fetchFineSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "fines")
        .single();

      if (error) throw error;

      const fineData = JSON.parse(data?.setting_value || "{}");

      const settings = [
        {
          id: "absent", // Add this
          fine_type: "absent",
          amount: fineData.absent_amount || 5,
          is_active: fineData.absent_enabled !== false,
          description:
            fineData.absent_description ||
            "Fine for missing class without excuse",
        },
        {
          id: "late", // Add this
          fine_type: "late",
          amount: fineData.late_amount || 2,
          is_active: fineData.late_enabled !== false,
          description:
            fineData.late_description || "Fine for arriving late to class",
        },
      ];
      setFineSettings(settings);
    } catch (error) {
      console.error("Error fetching fine settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateFineSetting = (fineType: string, field: string, value: any) => {
    setFineSettings((prev) =>
      prev.map((setting) =>
        setting.fine_type === fineType
          ? { ...setting, [field]: value }
          : setting
      )
    );
  };

  const saveFineSettings = async () => {
    setSaving(true);
    try {
      const fineData = {
        late_amount:
          fineSettings.find((s) => s.fine_type === "late")?.amount || 2,
        absent_amount:
          fineSettings.find((s) => s.fine_type === "absent")?.amount || 5,
        late_enabled:
          fineSettings.find((s) => s.fine_type === "late")?.is_active || false,
        absent_enabled:
          fineSettings.find((s) => s.fine_type === "absent")?.is_active ||
          false,
        late_description:
          fineSettings.find((s) => s.fine_type === "late")?.description || "",
        absent_description:
          fineSettings.find((s) => s.fine_type === "absent")?.description || "",
      };

      const { error } = await supabase
        .from("system_settings")
        .update({ setting_value: JSON.stringify(fineData) })
        .eq("setting_key", "fines");

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error updating fine settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fine Settings</h2>
          <p className="text-muted-foreground">
            Configure automatic fine amounts for attendance violations
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Important Note
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Fines are automatically generated when students are marked as
              "Late" or "Absent" during attendance. Changes to these settings
              will apply to future fines only.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {fineSettings.map((setting) => (
          <div
            key={setting.fine_type}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold capitalize">
                    {setting.fine_type} Fine
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Active:</label>
                <input
                  type="checkbox"
                  checked={setting.is_active}
                  onChange={(e) =>
                    updateFineSetting(
                      setting.fine_type,
                      "is_active",
                      e.target.checked
                    )
                  }
                  className="rounded border-gray-300 text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Fine Amount (£)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    £
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="50"
                    value={setting.amount}
                    onChange={(e) =>
                      updateFineSetting(
                        setting.fine_type,
                        "amount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="form-input pl-8"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the fine amount in pounds (£)
                </p>
              </div>

              <div>
                <label className="form-label">Description</label>
                <input
                  type="text"
                  value={setting.description}
                  onChange={(e) =>
                    updateFineSetting(
                      setting.fine_type,
                      "description",
                      e.target.value
                    )
                  }
                  className="form-input"
                  placeholder="Brief description of this fine"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This description appears in fine notifications
                </p>
              </div>
            </div>

            {!setting.is_active && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Disabled:</strong> No fines will be generated for{" "}
                  {setting.fine_type} attendance status.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          How Fine Generation Works
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Fines are automatically created when attendance is marked</li>
          <li>
            • Teachers can collect fines directly from the attendance interface
          </li>
          <li>• Students with pending fines show a red indicator badge</li>
          <li>• All fine transactions are logged for auditing purposes</li>
          <li>• Fines can be collected, waived, or exported for accounting</li>
        </ul>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        {saved && (
          <span className="text-sm text-green-600 flex items-center space-x-1">
            <span>✓ Settings saved successfully!</span>
          </span>
        )}
        <button
          onClick={saveFineSettings}
          disabled={saving}
          className="btn-primary flex items-center space-x-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
