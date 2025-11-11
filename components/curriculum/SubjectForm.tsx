// components/curriculum/SubjectForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface SubjectFormProps {
  classes: Array<{ id: string; name: string }>;
  subject?: any;
}

export default function SubjectForm({ classes, subject }: SubjectFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!subject;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: subject?.name || "",
    description: subject?.description || "",
    class_id: subject?.class_id || "",
    academic_year:
      subject?.academic_year ||
      new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    duration_weeks: subject?.duration_weeks || "",
    is_active: subject?.is_active !== undefined ? subject.is_active : true,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        class_id: formData.class_id || null,
        academic_year: formData.academic_year,
        duration_weeks: formData.duration_weeks
          ? parseInt(formData.duration_weeks.toString())
          : null,
        is_active: formData.is_active,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("subjects")
          .update(payload)
          .eq("id", subject.id);

        if (updateError) throw updateError;
        router.push(`/curriculum-assessment/subjects/${subject.id}`);
      } else {
        const { data, error: insertError } = await supabase
          .from("subjects")
          .insert([payload])
          .select()
          .single();

        if (insertError) throw insertError;
        router.push(`/curriculum-assessment/subjects/${data.id}`);
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save subject");
      console.error("Error saving subject:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="form-label">
            Subject Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Pillars of Islam"
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
            onChange={handleChange}
            className="form-input"
            rows={3}
            placeholder="Brief description of what this subject covers..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="class_id" className="form-label">
              Assign to Class
            </label>
            <select
              id="class_id"
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to make available for all classes
            </p>
          </div>

          <div>
            <label htmlFor="academic_year" className="form-label">
              Academic Year
            </label>
            <input
              type="text"
              id="academic_year"
              name="academic_year"
              value={formData.academic_year}
              onChange={handleChange}
              className="form-input"
              placeholder="2024-2025"
            />
          </div>
        </div>

        <div>
          <label htmlFor="duration_weeks" className="form-label">
            Duration (weeks)
          </label>
          <input
            type="number"
            id="duration_weeks"
            name="duration_weeks"
            value={formData.duration_weeks}
            onChange={handleChange}
            className="form-input"
            min="1"
            max="52"
            placeholder="e.g., 8"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Estimated time to complete this subject
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm">Subject is active</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1 ml-7">
            Inactive subjects won't appear in assessment forms
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center space-x-2"
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>
            {loading
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Create Subject"}
          </span>
        </button>
      </div>
    </form>
  );
}
