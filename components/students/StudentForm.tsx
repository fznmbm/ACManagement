"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading";

interface StudentFormProps {
  classes: Array<{ id: string; name: string }>;
  student?: any;
  mode: "create" | "edit";
}

export default function StudentForm({
  classes,
  student,
  mode,
}: StudentFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: student?.first_name || "",
    last_name: student?.last_name || "",
    date_of_birth: student?.date_of_birth || "",
    gender: student?.gender || "male",
    parent_name: student?.parent_name || "",
    parent_email: student?.parent_email || "",
    parent_phone: student?.parent_phone || "",
    parent_phone_secondary: student?.parent_phone_secondary || "",
    address: student?.address || "",
    city: student?.city || "",
    postal_code: student?.postal_code || "",
    class_id: student?.class_id || "",
    medical_notes: student?.medical_notes || "",
    notes: student?.notes || "",
    status: student?.status || "active",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.first_name?.trim())
      errors.first_name = "First name is required";
    if (!formData.last_name?.trim()) errors.last_name = "Last name is required";

    if (!formData.date_of_birth) {
      errors.date_of_birth = "Date of birth is required";
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (isNaN(birthDate.getTime())) {
        errors.date_of_birth = "Please enter a valid date";
      } else if (birthDate > today) {
        errors.date_of_birth = "Date of birth cannot be in the future";
      } else if (age > 30) {
        errors.date_of_birth =
          "Please check the date - student appears too old";
      } else if (age < 4) {
        errors.date_of_birth =
          "Please check the date - student appears too young";
      }
    }

    if (!formData.gender) errors.gender = "Gender is required";
    if (!formData.parent_name?.trim())
      errors.parent_name = "Parent/Guardian name is required";

    if (!formData.parent_phone?.trim()) {
      errors.parent_phone = "Parent phone number is required";
    } else {
      const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/;
      if (!phoneRegex.test(formData.parent_phone.replace(/[\s\-\(\)]/g, ""))) {
        errors.parent_phone =
          "Please enter a valid UK phone number (e.g. 07700 900000 or +447700900000)";
      }
    }

    if (formData.parent_email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.parent_email)) {
        errors.parent_email = "Please enter a valid email address";
      }
    }

    if (!formData.address?.trim())
      errors.street_address = "Street address is required";
    if (!formData.city?.trim()) errors.city = "City is required";
    if (!formData.postal_code?.trim())
      errors.postal_code = "Postal code is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const processData = () => ({
    ...formData,
    first_name: formData.first_name?.trim(),
    last_name: formData.last_name?.trim(),
    parent_name: formData.parent_name?.trim(),
    class_id: formData.class_id?.trim() || null,
    parent_email: formData.parent_email?.trim() || null,
    parent_phone_secondary: formData.parent_phone_secondary?.trim() || null,
    address: formData.address?.trim() || null,
    city: formData.city?.trim() || null,
    postal_code: formData.postal_code?.trim() || null,
    medical_notes: formData.medical_notes?.trim() || null,
    notes: formData.notes?.trim() || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    if (!validateForm()) {
      setError("Please fix the errors below before submitting");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "create") {
        const { error: submitError } = await supabase
          .from("students")
          .insert([processData()]);
        if (submitError) throw submitError;
        router.push("/students");
      } else {
        const { error: updateError } = await supabase
          .from("students")
          .update(processData())
          .eq("id", student.id);
        if (updateError) throw updateError;
        router.push(`/students/${student.id}`);
      }
      router.refresh();
    } catch (err: any) {
      setError(
        err.message ||
          (mode === "create"
            ? "Failed to add student"
            : "Failed to update student"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      // Soft delete — set status to withdrawn instead of hard delete
      const { error: deleteError } = await supabase
        .from("students")
        .update({ status: "withdrawn" })
        .eq("id", student.id);
      if (deleteError) throw deleteError;
      router.push("/students");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete student");
      setDeleting(false);
    }
  };

  const fieldClass = (key: string) =>
    `form-input ${validationErrors[key] ? "border-red-500 focus:ring-red-500" : ""}`;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                className={fieldClass("first_name")}
              />
              {validationErrors.first_name && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.first_name}
                </p>
              )}
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
                className={fieldClass("last_name")}
              />
              {validationErrors.last_name && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.last_name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="date_of_birth" className="form-label">
                Date of Birth *
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className={fieldClass("date_of_birth")}
              />
              {validationErrors.date_of_birth && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.date_of_birth}
                </p>
              )}
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

            {mode === "edit" && (
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
            )}
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
                className={fieldClass("parent_name")}
              />
              {validationErrors.parent_name && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.parent_name}
                </p>
              )}
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
                className={fieldClass("parent_email")}
              />
              {validationErrors.parent_email && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.parent_email}
                </p>
              )}
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
                className={fieldClass("parent_phone")}
                placeholder="07700 900000"
              />
              {validationErrors.parent_phone && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.parent_phone}
                </p>
              )}
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
                Street Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={fieldClass("street_address")}
              />
              {validationErrors.street_address && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.street_address}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="city" className="form-label">
                City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={fieldClass("city")}
              />
              {validationErrors.city && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.city}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="postal_code" className="form-label">
                Postal Code *
              </label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className={fieldClass("postal_code")}
              />
              {validationErrors.postal_code && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.postal_code}
                </p>
              )}
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
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Student</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={loading}
              loadingText={
                mode === "create" ? "Adding student..." : "Saving changes..."
              }
              variant="primary"
            >
              {mode === "create" ? "Add Student" : "Save Changes"}
            </LoadingButton>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Archive Student</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to archive{" "}
              <strong>
                {student?.first_name} {student?.last_name}
              </strong>
              ? Their status will be set to <strong>Withdrawn</strong> and they
              will no longer appear in active lists.
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
              <LoadingButton
                onClick={handleDelete}
                isLoading={deleting}
                loadingText="Archiving..."
                variant="danger"
              >
                Archive Student
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
