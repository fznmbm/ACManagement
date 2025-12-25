// components/students/EditStudentForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading";

interface EditStudentFormProps {
  classes: Array<{ id: string; name: string }>;
  student: any;
}

export default function EditStudentForm({
  classes,
  student,
}: EditStudentFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: student.first_name || "",
    last_name: student.last_name || "",
    //arabic_name: student.arabic_name || "",
    date_of_birth: student.date_of_birth || "",
    gender: student.gender || "male",
    parent_name: student.parent_name || "",
    parent_email: student.parent_email || "",
    parent_phone: student.parent_phone || "",
    parent_phone_secondary: student.parent_phone_secondary || "",
    address: student.address || "",
    city: student.city || "",
    postal_code: student.postal_code || "",
    class_id: student.class_id || "",
    medical_notes: student.medical_notes || "",
    notes: student.notes || "",
    status: student.status || "active",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Process the form data - convert empty strings to null for optional fields
      const processedData = {
        ...formData,
        class_id:
          formData.class_id && formData.class_id.trim() !== ""
            ? formData.class_id
            : null,
        parent_email: formData.parent_email?.trim() || null,
        parent_phone_secondary: formData.parent_phone_secondary?.trim() || null,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        postal_code: formData.postal_code?.trim() || null,
        medical_notes: formData.medical_notes?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      const { error: updateError } = await supabase
        .from("students")
        .update(processedData)
        .eq("id", student.id);

      if (updateError) throw updateError;

      router.push(`/students/${student.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update student");
      console.error("Error updating student:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("students")
        .delete()
        .eq("id", student.id);

      if (deleteError) throw deleteError;

      router.push("/students");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete student");
      console.error("Error deleting student:", err);
      setDeleting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="form-label">
                First Name *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label htmlFor="last_name" className="form-label">
                Last Name *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {/* <div>
              <label htmlFor="arabic_name" className="form-label">
                Arabic Name
              </label>
              <input
                type="text"
                id="arabic_name"
                name="arabic_name"
                value={formData.arabic_name}
                onChange={handleChange}
                className="form-input rtl"
                placeholder="الاسم بالعربي"
              />
            </div> */}

            <div>
              <label htmlFor="date_of_birth" className="form-label">
                Date of Birth
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="gender" className="form-label">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label htmlFor="class_id" className="form-label">
                Class
              </label>
              <select
                id="class_id"
                name="class_id"
                value={formData.class_id}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">No class assigned</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Parent/Guardian Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="parent_name" className="form-label">
                Parent Name *
              </label>
              <input
                type="text"
                id="parent_name"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label htmlFor="parent_email" className="form-label">
                Parent Email
              </label>
              <input
                type="email"
                id="parent_email"
                name="parent_email"
                value={formData.parent_email}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="parent_phone" className="form-label">
                Parent Phone *
              </label>
              <input
                type="tel"
                id="parent_phone"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleChange}
                className="form-input"
                placeholder="+44 7700 900000"
                required
              />
            </div>

            <div>
              <label htmlFor="parent_phone_secondary" className="form-label">
                Secondary Phone
              </label>
              <input
                type="tel"
                id="parent_phone_secondary"
                name="parent_phone_secondary"
                value={formData.parent_phone_secondary}
                onChange={handleChange}
                className="form-input"
                placeholder="+44 7700 900000"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="address" className="form-label">
                Street Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="city" className="form-label">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="postal_code" className="form-label">
                Postal Code
              </label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="medical_notes" className="form-label">
                Medical Notes
              </label>
              <textarea
                id="medical_notes"
                name="medical_notes"
                value={formData.medical_notes}
                onChange={handleChange}
                className="form-input"
                rows={3}
                placeholder="Any allergies, medical conditions, or special needs..."
              />
            </div>

            <div>
              <label htmlFor="notes" className="form-label">
                General Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-input"
                rows={3}
                placeholder="Any additional notes about the student..."
              />
            </div>

            <div>
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Student</span>
          </button>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            {/* <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button> */}
            <LoadingButton
              type="submit"
              isLoading={loading}
              loadingText="Saving changes..."
              variant="primary"
            >
              Save Changes
            </LoadingButton>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Student</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete{" "}
              <strong>
                {student.first_name} {student.last_name}
              </strong>
              ? This action cannot be undone. All attendance records and
              progress will be permanently deleted.
            </p>

            {error && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outline"
                disabled={deleting}
              >
                Cancel
              </button>
              {/* <button
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button> */}
              <LoadingButton
                onClick={handleDelete}
                isLoading={deleting}
                loadingText="Deleting..."
                variant="danger"
              >
                Delete Permanently
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
