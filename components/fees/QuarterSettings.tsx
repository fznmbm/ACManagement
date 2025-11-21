"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Save, RotateCcw, AlertCircle } from "lucide-react";

interface Quarter {
  id?: string;
  quarter_number: number;
  quarter_name: string;
  start_month: number;
  end_month: number;
  is_active: boolean;
}

export default function QuarterSettings() {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const defaultQuarters = [
    {
      quarter_number: 1,
      quarter_name: "Autumn Term",
      start_month: 9,
      end_month: 11,
      is_active: true,
    },
    {
      quarter_number: 2,
      quarter_name: "Spring Term",
      start_month: 12,
      end_month: 2,
      is_active: true,
    },
    {
      quarter_number: 3,
      quarter_name: "Summer Term",
      start_month: 3,
      end_month: 5,
      is_active: true,
    },
    {
      quarter_number: 4,
      quarter_name: "Summer Holiday",
      start_month: 6,
      end_month: 8,
      is_active: true,
    },
  ];

  useEffect(() => {
    fetchQuarterSettings();
  }, []);

  const fetchQuarterSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("fee_quarter_settings")
        .select("*")
        .order("quarter_number");

      if (error) throw error;

      if (data && data.length > 0) {
        setQuarters(data);
      } else {
        // Initialize with default quarters if none exist
        setQuarters(defaultQuarters);
      }
    } catch (err: any) {
      console.error("Error fetching quarter settings:", err);
      setError("Failed to load quarter settings");
      setQuarters(defaultQuarters);
    } finally {
      setLoading(false);
    }
  };

  const updateQuarter = (index: number, field: keyof Quarter, value: any) => {
    setQuarters((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
    setError(null);
  };

  const validateQuarters = () => {
    const errors = [];

    // Check for duplicate names
    const names = quarters.map((q) => q.quarter_name.toLowerCase().trim());
    const duplicateNames = names.filter(
      (name, index) => names.indexOf(name) !== index
    );
    if (duplicateNames.length > 0) {
      errors.push("Quarter names must be unique");
    }

    // Check for empty names
    if (quarters.some((q) => !q.quarter_name.trim())) {
      errors.push("All quarter names are required");
    }

    return errors;
  };

  const saveSettings = async () => {
    const validationErrors = validateQuarters();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Delete existing settings
      await supabase
        .from("fee_quarter_settings")
        .delete()
        .neq("quarter_number", 0);

      // Insert new settings
      const { error } = await supabase.from("fee_quarter_settings").insert(
        quarters.map((q) => ({
          quarter_number: q.quarter_number,
          quarter_name: q.quarter_name.trim(),
          start_month: q.start_month,
          end_month: q.end_month,
          is_active: q.is_active,
        }))
      );

      if (error) throw error;

      alert("Quarter settings saved successfully!");
      fetchQuarterSettings(); // Refresh to get IDs
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (
      confirm(
        "Reset to default UK academic year quarters? This will lose your current settings."
      )
    ) {
      setQuarters([...defaultQuarters]);
      setError(null);
    }
  };

  const getMonthRangeDisplay = (startMonth: number, endMonth: number) => {
    if (startMonth <= endMonth) {
      return `${monthNames[startMonth - 1]} to ${monthNames[endMonth - 1]}`;
    } else {
      // Cross-year range (e.g., Dec to Feb)
      return `${monthNames[startMonth - 1]} to ${
        monthNames[endMonth - 1]
      } (next year)`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-center text-muted-foreground">
            Loading quarter settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Quarterly Fee Periods</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Customize quarterly billing periods to match your academic calendar
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetToDefault}
            disabled={saving}
            className="btn-outline flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Default</span>
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Quarter Settings */}
      <div className="space-y-4">
        {quarters.map((quarter, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              {/* Quarter Name */}
              <div>
                <label className="form-label">Quarter Name</label>
                <input
                  type="text"
                  value={quarter.quarter_name}
                  onChange={(e) =>
                    updateQuarter(index, "quarter_name", e.target.value)
                  }
                  className="form-input"
                  placeholder="e.g., Autumn Term"
                  disabled={saving}
                />
              </div>

              {/* Start Month */}
              <div>
                <label className="form-label">Start Month</label>
                <select
                  value={quarter.start_month}
                  onChange={(e) =>
                    updateQuarter(
                      index,
                      "start_month",
                      parseInt(e.target.value)
                    )
                  }
                  className="form-input"
                  disabled={saving}
                >
                  {monthNames.map((month, i) => (
                    <option key={i} value={i + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Month */}
              <div>
                <label className="form-label">End Month</label>
                <select
                  value={quarter.end_month}
                  onChange={(e) =>
                    updateQuarter(index, "end_month", parseInt(e.target.value))
                  }
                  className="form-input"
                  disabled={saving}
                >
                  {monthNames.map((month, i) => (
                    <option key={i} value={i + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Toggle */}
              <div>
                <label className="form-label">Status</label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={quarter.is_active}
                    onChange={(e) =>
                      updateQuarter(index, "is_active", e.target.checked)
                    }
                    disabled={saving}
                    className="form-checkbox"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              {/* Preview */}
              <div className="bg-muted/50 p-3 rounded border">
                <p className="text-sm font-medium">{quarter.quarter_name}</p>
                <p className="text-xs text-muted-foreground">
                  {getMonthRangeDisplay(quarter.start_month, quarter.end_month)}
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                    quarter.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}
                >
                  {quarter.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          Usage Notes:
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>
            • Quarter periods can span across years (e.g., December to February)
          </li>
          <li>
            • Only active quarters will be available when creating quarterly fee
            structures
          </li>
          <li>• Changes will affect new fee structures created after saving</li>
          <li>
            • Existing fee assignments using quarterly billing will continue
            with their original periods
          </li>
        </ul>
      </div>
    </div>
  );
}
