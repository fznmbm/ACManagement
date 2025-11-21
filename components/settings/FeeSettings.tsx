"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Save,
  AlertTriangle,
  Receipt,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  RotateCcw,
} from "lucide-react";

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  description: string;
  is_active: boolean;
  due_day: number;
  grace_period_days: number;
  use_custom_quarters?: boolean;
}

interface Quarter {
  id?: string;
  quarter_number: number;
  quarter_name: string;
  start_month: number;
  end_month: number;
  is_active: boolean;
}

export default function FeeSettings() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [feeSettings, setFeeSettings] = useState({
    auto_generate_invoices: true,
    overdue_grace_days: 7,
    late_fee_amount: 5.0,
    late_fee_enabled: true,
    payment_reminder_days: [3, 7, 14],
    default_payment_method: "cash",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNewStructure, setShowNewStructure] = useState(false);
  const [activeTab, setActiveTab] = useState("structures");
  const [newStructure, setNewStructure] = useState({
    name: "",
    amount: 0,
    frequency: "monthly",
    description: "",
    due_day: 1,
    grace_period_days: 7,
    use_custom_quarters: false,
  });

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

  const tabs = [
    { id: "structures", label: "Fee Structures", icon: Receipt },
    { id: "quarters", label: "Quarterly Periods", icon: Calendar },
    { id: "general", label: "General Settings", icon: Save },
  ];

  useEffect(() => {
    fetchFeeStructures();
    fetchFeeSettings();
    fetchQuarterSettings();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .order("name");

      if (error) throw error;
      setFeeStructures(data || []);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuarterSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("fee_quarter_settings")
        .select("*")
        .order("quarter_number");

      if (error) throw error;

      if (data && data.length > 0) {
        setQuarters(data);
      } else {
        setQuarters(defaultQuarters);
      }
    } catch (err: any) {
      console.error("Error fetching quarter settings:", err);
      setQuarters(defaultQuarters);
    }
  };

  const fetchFeeSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "fees")
        .single();

      if (error) throw error;

      const settings = JSON.parse(data?.setting_value || "{}");
      setFeeSettings({
        auto_generate_invoices: settings.auto_generate_invoices !== false,
        overdue_grace_days: settings.overdue_grace_days || 7,
        late_fee_amount: settings.late_fee_amount || 5.0,
        late_fee_enabled: settings.late_fee_enabled !== false,
        payment_reminder_days: settings.payment_reminder_days || [3, 7, 14],
        default_payment_method: settings.default_payment_method || "cash",
      });
    } catch (error) {
      console.error("Error fetching fee settings:", error);
    }
  };

  const updateFeeStructure = (id: string, field: string, value: any) => {
    setFeeStructures((prev) =>
      prev.map((structure) =>
        structure.id === id ? { ...structure, [field]: value } : structure
      )
    );
  };

  const updateQuarter = (index: number, field: keyof Quarter, value: any) => {
    setQuarters((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const addFeeStructure = async () => {
    if (!newStructure.name || newStructure.amount <= 0) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("fee_structures")
        .insert([{ ...newStructure, is_active: true }])
        .select()
        .single();

      if (error) throw error;

      setFeeStructures((prev) => [...prev, data]);
      setNewStructure({
        name: "",
        amount: 0,
        frequency: "monthly",
        description: "",
        due_day: 1,
        grace_period_days: 7,
        use_custom_quarters: false,
      });
      setShowNewStructure(false);
    } catch (error) {
      console.error("Error adding fee structure:", error);
      alert("Failed to add fee structure");
    }
  };

  const deleteFeeStructure = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee structure?")) return;

    try {
      const { error } = await supabase
        .from("fee_structures")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFeeStructures((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting fee structure:", error);
      alert("Failed to delete fee structure");
    }
  };

  const saveQuarterSettings = async () => {
    try {
      setSaving(true);

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

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchQuarterSettings();
    } catch (err: any) {
      console.error("Error saving quarter settings:", err);
      alert("Failed to save quarter settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetQuartersToDefault = () => {
    if (
      confirm(
        "Reset to default UK academic year quarters? This will lose your current settings."
      )
    ) {
      setQuarters([...defaultQuarters]);
    }
  };

  const saveFeeSettings = async () => {
    setSaving(true);
    try {
      // Save fee structures
      for (const structure of feeStructures) {
        const { error } = await supabase
          .from("fee_structures")
          .update({
            name: structure.name,
            amount: structure.amount,
            frequency: structure.frequency,
            description: structure.description,
            is_active: structure.is_active,
            due_day: structure.due_day,
            grace_period_days: structure.grace_period_days,
            use_custom_quarters: structure.use_custom_quarters || false,
          })
          .eq("id", structure.id);

        if (error) throw error;
      }

      // Save fee settings
      const { error: settingsError } = await supabase
        .from("system_settings")
        .update({ setting_value: JSON.stringify(feeSettings) })
        .eq("setting_key", "fees");

      if (settingsError) throw settingsError;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error updating fee settings:", error);
      alert("Failed to update fee settings");
    } finally {
      setSaving(false);
    }
  };

  const getMonthRangeDisplay = (startMonth: number, endMonth: number) => {
    if (startMonth <= endMonth) {
      return `${monthNames[startMonth - 1]} to ${monthNames[endMonth - 1]}`;
    } else {
      return `${monthNames[startMonth - 1]} to ${
        monthNames[endMonth - 1]
      } (next year)`;
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
      <div>
        <h2 className="text-2xl font-bold">Fee Settings</h2>
        <p className="text-muted-foreground">
          Configure fee structures, quarterly periods, and automation settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "structures" && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Fee Management
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Fee structures define recurring charges. Invoices are
                  generated automatically based on frequency settings.
                </p>
              </div>
            </div>
          </div>

          {/* Fee Structures */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Fee Structures</h3>
              <button
                onClick={() => setShowNewStructure(true)}
                className="btn-outline flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Fee Structure</span>
              </button>
            </div>

            {showNewStructure && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-medium mb-4">New Fee Structure</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      value={newStructure.name}
                      onChange={(e) =>
                        setNewStructure((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="form-input"
                      placeholder="Monthly Tuition Fee"
                    />
                  </div>
                  <div>
                    <label className="form-label">Amount (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newStructure.amount}
                      onChange={(e) =>
                        setNewStructure((prev) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="form-input"
                      placeholder="75.00"
                    />
                  </div>
                  <div>
                    <label className="form-label">Frequency</label>
                    <select
                      value={newStructure.frequency}
                      onChange={(e) =>
                        setNewStructure((prev) => ({
                          ...prev,
                          frequency: e.target.value,
                        }))
                      }
                      className="form-input"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                      <option value="one_time">One Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Due Day of Month</label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      value={newStructure.due_day}
                      onChange={(e) =>
                        setNewStructure((prev) => ({
                          ...prev,
                          due_day: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="form-input"
                      placeholder="1"
                    />
                  </div>
                </div>

                {/* Custom Quarters Option */}
                {newStructure.frequency === "quarterly" && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newStructure.use_custom_quarters}
                        onChange={(e) =>
                          setNewStructure((prev) => ({
                            ...prev,
                            use_custom_quarters: e.target.checked,
                          }))
                        }
                        className="rounded border-input text-primary"
                      />
                      <span className="text-sm font-medium">
                        Use custom quarterly periods
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      Use your configured academic quarters instead of standard
                      calendar quarters
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    value={newStructure.description}
                    onChange={(e) =>
                      setNewStructure((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="form-input"
                    placeholder="Standard monthly tuition fee"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowNewStructure(false)}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button onClick={addFeeStructure} className="btn-primary">
                    Add Structure
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {feeStructures.map((structure) => (
                <div
                  key={structure.id}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Receipt className="h-5 w-5 text-primary" />
                      <div>
                        <input
                          type="text"
                          value={structure.name}
                          onChange={(e) =>
                            updateFeeStructure(
                              structure.id,
                              "name",
                              e.target.value
                            )
                          }
                          className="font-semibold bg-transparent border-none p-0 focus:ring-0 focus:border-none"
                        />
                        <p className="text-sm text-muted-foreground">
                          {structure.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium">Active:</label>
                      <input
                        type="checkbox"
                        checked={structure.is_active}
                        onChange={(e) =>
                          updateFeeStructure(
                            structure.id,
                            "is_active",
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300 text-primary"
                      />
                      <button
                        onClick={() => deleteFeeStructure(structure.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="form-label">Amount (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={structure.amount}
                        onChange={(e) =>
                          updateFeeStructure(
                            structure.id,
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Frequency</label>
                      <select
                        value={structure.frequency}
                        onChange={(e) =>
                          updateFeeStructure(
                            structure.id,
                            "frequency",
                            e.target.value
                          )
                        }
                        className="form-input"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                        <option value="one_time">One Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Due Day</label>
                      <input
                        type="number"
                        min="1"
                        max="28"
                        value={structure.due_day}
                        onChange={(e) =>
                          updateFeeStructure(
                            structure.id,
                            "due_day",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Grace Period (Days)</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={structure.grace_period_days}
                        onChange={(e) =>
                          updateFeeStructure(
                            structure.id,
                            "grace_period_days",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Custom Quarters Display */}
                  {structure.frequency === "quarterly" && (
                    <div className="mt-4 p-3 bg-muted/50 rounded border">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={structure.use_custom_quarters || false}
                          onChange={(e) =>
                            updateFeeStructure(
                              structure.id,
                              "use_custom_quarters",
                              e.target.checked
                            )
                          }
                          className="rounded border-input text-primary"
                        />
                        <span className="text-sm">
                          Use custom quarterly periods
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
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
              onClick={saveFeeSettings}
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
      )}

      {activeTab === "quarters" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Quarterly Fee Periods</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Customize quarterly billing periods to match your academic
                calendar
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetQuartersToDefault}
                disabled={saving}
                className="btn-outline flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset to Default</span>
              </button>
              <button
                onClick={saveQuarterSettings}
                disabled={saving}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </div>

          {/* Quarter Settings */}
          <div className="space-y-4">
            {quarters.map((quarter, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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

                  <div>
                    <label className="form-label">End Month</label>
                    <select
                      value={quarter.end_month}
                      onChange={(e) =>
                        updateQuarter(
                          index,
                          "end_month",
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

                  <div className="bg-muted/50 p-3 rounded border">
                    <p className="text-sm font-medium">
                      {quarter.quarter_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getMonthRangeDisplay(
                        quarter.start_month,
                        quarter.end_month
                      )}
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
                • Quarter periods can span across years (e.g., December to
                February)
              </li>
              <li>
                • Only active quarters will be available when creating quarterly
                fee structures
              </li>
              <li>
                • Changes will affect new fee structures created after saving
              </li>
              <li>
                • Existing fee assignments using quarterly billing will continue
                with their original periods
              </li>
            </ul>
          </div>

          {saved && (
            <div className="text-center">
              <span className="text-sm text-green-600 flex items-center justify-center space-x-1">
                <span>✓ Quarter settings saved successfully!</span>
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab === "general" && (
        <div className="space-y-6">
          {/* General Fee Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">General Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={feeSettings.auto_generate_invoices}
                    onChange={(e) =>
                      setFeeSettings((prev) => ({
                        ...prev,
                        auto_generate_invoices: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Auto-generate invoices</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-7">
                  Automatically create invoices based on fee structure frequency
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={feeSettings.late_fee_enabled}
                    onChange={(e) =>
                      setFeeSettings((prev) => ({
                        ...prev,
                        late_fee_enabled: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Enable late fees</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-7">
                  Charge additional fees for overdue payments
                </p>
              </div>

              <div>
                <label className="form-label">Late Fee Amount (£)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={feeSettings.late_fee_amount}
                  onChange={(e) =>
                    setFeeSettings((prev) => ({
                      ...prev,
                      late_fee_amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="form-input"
                  disabled={!feeSettings.late_fee_enabled}
                />
              </div>

              <div>
                <label className="form-label">Default Payment Method</label>
                <select
                  value={feeSettings.default_payment_method}
                  onChange={(e) =>
                    setFeeSettings((prev) => ({
                      ...prev,
                      default_payment_method: e.target.value,
                    }))
                  }
                  className="form-input"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>
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
              onClick={saveFeeSettings}
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
      )}
    </div>
  );
}
