// components/students/StudentForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface StudentFormProps {
  classes: Array<{ id: string; name: string }>;
  student?: any; // For editing existing student
}

export default function StudentForm({ classes, student }: StudentFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Add these state variables to your form component
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: student?.first_name || "",
    last_name: student?.last_name || "",
    arabic_name: student?.arabic_name || "",
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
    >
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      setError("Please fix the errors below before submitting");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Clean data for optional fields only
      const processedData = {
        ...formData,
        class_id:
          formData.class_id && formData.class_id.trim() !== ""
            ? formData.class_id
            : null,
        arabic_name: formData.arabic_name?.trim() || null,
        parent_email: formData.parent_email?.trim() || null,
        parent_phone_secondary: formData.parent_phone_secondary?.trim() || null,
        medical_notes: formData.medical_notes?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      const { error: submitError } = await supabase
        .from("students")
        .insert([processedData]);

      if (submitError) throw submitError;

      router.push("/students");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to add student");
      console.error("Error adding student:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Required fields validation
    if (!formData.first_name?.trim()) {
      errors.first_name = "First name is required";
    }

    if (!formData.last_name?.trim()) {
      errors.last_name = "Last name is required";
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = "Date of birth is required";
    } else {
      // Validate date format and age
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
      } else if (age < 7) {
        errors.date_of_birth =
          "Please check the date - student appears too young";
      }
    }

    if (!formData.gender) {
      errors.gender = "Gender is required";
    }

    if (!formData.parent_name?.trim()) {
      errors.parent_name = "Parent/Guardian name is required";
    }

    if (!formData.parent_phone?.trim()) {
      errors.parent_phone = "Parent phone number is required";
    } else {
      // Basic phone validation
      const phoneRegex = /^[\+]?[1-9][\d]{10,14}$/;
      if (!phoneRegex.test(formData.parent_phone.replace(/\s+/g, ""))) {
        errors.parent_phone = "Please enter a valid phone number";
      }
    }

    // Email validation (if provided)
    if (formData.parent_email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.parent_email)) {
        errors.parent_email = "Please enter a valid email address";
      }
    }

    // Address validation
    if (!formData.address?.trim()) {
      errors.street_address = "Street address is required";
    }

    if (!formData.city?.trim()) {
      errors.city = "City is required";
    }

    if (!formData.postal_code?.trim()) {
      errors.postal_code = "Postal code is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
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
            <label
              htmlFor="first_name"
              className="block text-sm font-medium mb-2"
            >
              First Name *
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={`form-input ${
                validationErrors.first_name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-input focus:ring-primary"
              }`}
            />
            {validationErrors.first_name && (
              <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                <span>{validationErrors.first_name}</span>
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
              className={`form-input ${
                validationErrors.last_name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-input focus:ring-primary"
              }`}
            />
            {validationErrors.last_name && (
              <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                <span>{validationErrors.last_name}</span>
              </p>
            )}
          </div>

          <div>
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
          </div>

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
              className={`form-input ${
                validationErrors.date_of_birth ? "border-red-500" : ""
              }`}
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
        </div>
      </div>

      {/* Parent/Guardian Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Parent/Guardian Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="parent_name"
              className="block text-sm font-medium mb-2"
            >
              Parent Name *
            </label>
            <input
              type="text"
              id="parent_name"
              name="parent_name"
              value={formData.parent_name}
              onChange={handleChange}
              className={`form-input ${
                validationErrors.parent_name ? "border-red-500" : ""
              }`}
            />
            {validationErrors.parent_name && (
              <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                <span>{validationErrors.parent_name}</span>
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
              className={`form-input ${
                validationErrors.parent_phone
                  ? "border-red-500 focus:ring-red-500"
                  : "border-input focus:ring-primary"
              }`}
              placeholder="+44 7700 900000"
            />
            {validationErrors.parent_phone && (
              <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                <span>{validationErrors.parent_phone}</span>
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
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`form-input ${
                validationErrors.street_address
                  ? "border-red-500 focus:ring-red-500"
                  : "border-input focus:ring-primary"
              }`}
            />
            {validationErrors.street_address && (
              <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                <span>{validationErrors.street_address}</span>
              </p>
            )}
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
              className={`form-input ${
                validationErrors.city
                  ? "border-red-500 focus:ring-red-500"
                  : "border-input focus:ring-primary"
              }`}
            />
            {validationErrors.city && (
              <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                <span>{validationErrors.city}</span>
              </p>
            )}
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
              className={`form-input ${
                validationErrors.postal_code
                  ? "border-red-500 focus:ring-red-500"
                  : "border-input focus:ring-primary"
              }`}
            />
            {validationErrors.postal_code && (
              <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                <span>{validationErrors.postal_code}</span>
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
      {/* Buttons - Side by Side */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="btn-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          //className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          className="btn-primary"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <span>Add Student</span>
          )}
        </button>
      </div>
    </form>
  );
}
