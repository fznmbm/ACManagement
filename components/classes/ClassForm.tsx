// components/classes/ClassForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentAcademicYear } from "@/lib/utils/helpers";

interface ClassFormProps {
  teachers: Array<{ id: string; full_name: string; email: string }>;
  classData?: any;
}

export default function ClassForm({ teachers, classData }: ClassFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!classData;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: classData?.name || "",
    description: classData?.description || "",
    level: classData?.level || "",
    teacher_id: classData?.teacher_id || "",
    capacity: classData?.capacity || 30,
    academic_year: classData?.academic_year || getCurrentAcademicYear(),
    schedule_days: classData?.schedule?.days?.join(", ") || "",
    schedule_time: classData?.schedule?.time || "",
    schedule_room: classData?.schedule?.room || "",
    is_active: classData?.is_active !== undefined ? classData.is_active : true,
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
      // Prepare schedule JSON
      const schedule = {
        days: formData.schedule_days
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        time: formData.schedule_time,
        room: formData.schedule_room,
      };

      const classPayload = {
        name: formData.name,
        description: formData.description || null,
        level: formData.level || null,
        teacher_id: formData.teacher_id || null,
        capacity: parseInt(formData.capacity.toString()) || 30,
        academic_year: formData.academic_year,
        schedule: schedule,
        is_active: formData.is_active,
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("classes")
          .update(classPayload)
          .eq("id", classData.id);

        if (updateError) throw updateError;
        router.push(`/classes/${classData.id}`);
      } else {
        const { error: insertError } = await supabase
          .from("classes")
          .insert([classPayload]);

        if (insertError) throw insertError;
        router.push("/classes");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save class");
      console.error("Error saving class:", err);
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
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="name" className="form-label">
              Class Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              // className="form-input"
              className="form-input bg-background text-foreground border-border"
              placeholder="e.g., Quran Beginners - Morning"
              required
            />
          </div>

          <div className="md:col-span-2">
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
              placeholder="Brief description of the class..."
            />
          </div>

          <div>
            <label htmlFor="level" className="form-label">
              Level
            </label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              //className="form-input"
              className="form-input bg-background text-foreground border-border"
            >
              <option value="">Select level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <div>
            <label htmlFor="teacher_id" className="form-label">
              Assign Teacher
            </label>
            <select
              id="teacher_id"
              name="teacher_id"
              value={formData.teacher_id}
              onChange={handleChange}
              // className="form-input"
              className="form-input bg-background text-foreground border-border"
            >
              <option value="">No teacher assigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="capacity" className="form-label">
              Capacity
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              //className="form-input"
              className="form-input bg-background text-foreground border-border"
              min="1"
              max="100"
            />
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
              //className="form-input"
              className="form-input bg-background text-foreground border-border"
              placeholder="2024-2025"
            />
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="schedule_days" className="form-label">
              Days (comma-separated)
            </label>
            <input
              type="text"
              id="schedule_days"
              name="schedule_days"
              value={formData.schedule_days}
              onChange={handleChange}
              //className="form-input"
              className="form-input bg-background text-foreground border-border"
              placeholder="Monday, Wednesday, Friday"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Example: Monday, Wednesday, Friday
            </p>
          </div>

          <div>
            <label htmlFor="schedule_time" className="form-label">
              Time
            </label>
            <input
              type="text"
              id="schedule_time"
              name="schedule_time"
              value={formData.schedule_time}
              onChange={handleChange}
              //className="form-input"
              className="form-input bg-background text-foreground border-border"
              placeholder="09:00-11:00"
            />
          </div>

          <div>
            <label htmlFor="schedule_room" className="form-label">
              Room/Location
            </label>
            <input
              type="text"
              id="schedule_room"
              name="schedule_room"
              value={formData.schedule_room}
              onChange={handleChange}
              //className="form-input"
              className="form-input bg-background text-foreground border-border"
              placeholder="Room A"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Status</h3>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <span className="text-sm">Class is active</span>
        </label>
        <p className="text-xs text-muted-foreground mt-1">
          Inactive classes won't appear in attendance marking
        </p>
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
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
            ? "Save Changes"
            : "Create Class"}
        </button>
      </div>
    </form>
  );
}
