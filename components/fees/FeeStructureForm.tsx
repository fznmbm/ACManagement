"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCustomQuarters } from "@/hooks/useCustomQuarters";
import { DollarSign, Calendar, Info, Save } from "lucide-react";

interface FeeStructureFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FeeStructureForm({
  onSuccess,
  onCancel,
}: FeeStructureFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    frequency: "monthly",
    use_custom_quarters: false,
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    quarters,
    loading: quartersLoading,
    getQuarterMonthNames,
  } = useCustomQuarters();
  const supabase = createClient();

  const frequencyOptions = [
    { value: "monthly", label: "Monthly", description: "Charged every month" },
    {
      value: "quarterly",
      label: "Quarterly",
      description: "Charged every quarter",
    },
    { value: "annual", label: "Annual", description: "Charged once per year" },
    { value: "one_time", label: "One-time", description: "Single payment" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error("Fee structure name is required");
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error("Valid amount is required");
      }

      // For quarterly fees, ensure custom quarters are available
      if (
        formData.frequency === "quarterly" &&
        formData.use_custom_quarters &&
        quarters.length === 0
      ) {
        throw new Error(
          "No active quarterly periods configured. Please set up quarters in Fee Settings first."
        );
      }

      const feeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        use_custom_quarters:
          formData.frequency === "quarterly"
            ? formData.use_custom_quarters
            : false,
        is_active: formData.is_active,
      };

      const { error: insertError } = await supabase
        .from("fee_structures")
        .insert(feeData);

      if (insertError) throw insertError;

      alert("Fee structure created successfully!");
      onSuccess();
    } catch (err: any) {
      console.error("Error creating fee structure:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Create Fee Structure</h2>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Basic Information</h3>

            <div>
              <label htmlFor="name" className="form-label">
                Fee Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Monthly Tuition, Registration Fee"
                className="form-input"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description of what this fee covers"
                rows={3}
                className="form-input resize-none"
              />
            </div>

            <div>
              <label htmlFor="amount" className="form-label">
                Amount (£) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  £
                </span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="form-input pl-8"
                  required
                />
              </div>
            </div>
          </div>

          {/* Billing Frequency */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Billing Frequency</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {frequencyOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.frequency === option.value
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={formData.frequency === option.value}
                    onChange={handleInputChange}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Quarterly Periods Option */}
            {formData.frequency === "quarterly" && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Quarterly Settings</span>
                </h4>

                <div className="space-y-3">
                  <label className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      name="use_custom_quarters"
                      checked={formData.use_custom_quarters}
                      onChange={handleInputChange}
                      className="mt-0.5"
                      disabled={quartersLoading || quarters.length === 0}
                    />
                    <div>
                      <span className="font-medium">
                        Use custom quarterly periods
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Use your configured academic quarters instead of
                        standard calendar quarters
                      </p>
                    </div>
                  </label>

                  {quartersLoading && (
                    <p className="text-sm text-muted-foreground">
                      Loading quarter settings...
                    </p>
                  )}

                  {!quartersLoading && quarters.length === 0 && (
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-orange-600 mt-0.5" />
                      <p className="text-sm text-orange-600">
                        No custom quarters configured. Set up quarters in Fee
                        Settings to use this option.
                      </p>
                    </div>
                  )}

                  {!quartersLoading &&
                    quarters.length > 0 &&
                    formData.use_custom_quarters && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">
                          Your configured quarters:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {quarters.map((quarter) => (
                            <div
                              key={quarter.id}
                              className="text-xs bg-white dark:bg-slate-800 p-2 rounded border"
                            >
                              <span className="font-medium">
                                {quarter.quarter_name}
                              </span>
                              <br />
                              <span className="text-muted-foreground">
                                {getQuarterMonthNames(quarter)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {!quartersLoading &&
                    quarters.length > 0 &&
                    !formData.use_custom_quarters && (
                      <p className="text-sm text-muted-foreground">
                        Will use standard calendar quarters: Q1 (Jan-Mar), Q2
                        (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Status</h3>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <span>Active (available for assignment to students)</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 text-muted-foreground hover:text-foreground border border-input rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Create Fee Structure</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
