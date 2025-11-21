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
}

export default function FeeSettings() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
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
  const [newStructure, setNewStructure] = useState({
    name: "",
    amount: 0,
    frequency: "monthly",
    description: "",
    due_day: 1,
    grace_period_days: 7,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchFeeStructures();
    fetchFeeSettings();
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
          Configure fee structures, payment settings, and automation
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              Fee Management
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Fee structures define recurring charges. Invoices are generated
              automatically based on frequency settings.
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
                        updateFeeStructure(structure.id, "name", e.target.value)
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
            </div>
          ))}
        </div>
      </div>

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
  );
}
