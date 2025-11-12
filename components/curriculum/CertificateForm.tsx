// components/curriculum/CertificateForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Award } from "lucide-react";

interface CertificateFormProps {
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
  subjects: Array<{
    id: string;
    name: string;
  }>;
  preSelectedStudent?: string;
}

export default function CertificateForm({
  students,
  subjects,
  preSelectedStudent,
}: CertificateFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    student_id: preSelectedStudent || "",
    certificate_type: "subject_completion",
    subject_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    grade: "",
    remarks: "",
  });

  const [certificateNumber, setCertificateNumber] = useState("");

  // Generate certificate number
  useEffect(() => {
    const generateCertNumber = () => {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      return `CERT-${year}-${random}`;
    };
    setCertificateNumber(generateCertNumber());
  }, []);

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        student_id: formData.student_id,
        certificate_type: formData.certificate_type,
        subject_id: formData.subject_id || null,
        issue_date: formData.issue_date,
        certificate_number: certificateNumber,
        grade: formData.grade || null,
        remarks: formData.remarks || null,
        issued_by: user.id,
      };

      const { error: insertError } = await supabase
        .from("certificates")
        .insert([payload]);

      if (insertError) throw insertError;

      router.push("/curriculum-assessment/certificates");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to generate certificate");
      console.error("Error generating certificate:", err);
    } finally {
      setLoading(false);
    }
  };

  const requiresSubject = formData.certificate_type === "subject_completion";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* Certificate Preview */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6">
        <div className="flex items-center justify-center mb-4">
          <Award className="h-12 w-12 text-yellow-600" />
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Certificate Number
          </p>
          <p className="text-2xl font-bold font-mono text-yellow-800">
            {certificateNumber}
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="student_id" className="form-label">
            Student *
          </label>
          <select
            id="student_id"
            name="student_id"
            value={formData.student_id}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Select student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} (#
                {student.student_number})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="certificate_type" className="form-label">
            Certificate Type *
          </label>
          <select
            id="certificate_type"
            name="certificate_type"
            value={formData.certificate_type}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="subject_completion">Subject Completion</option>
            <option value="memorization_completion">
              Memorization Completion
            </option>
            <option value="academic_excellence">Academic Excellence</option>
            <option value="year_completion">Year Completion</option>
          </select>
        </div>

        {requiresSubject && (
          <div>
            <label htmlFor="subject_id" className="form-label">
              Subject *
            </label>
            <select
              id="subject_id"
              name="subject_id"
              value={formData.subject_id}
              onChange={handleChange}
              className="form-input"
              required={requiresSubject}
            >
              <option value="">Select subject...</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="issue_date" className="form-label">
              Issue Date *
            </label>
            <input
              type="date"
              id="issue_date"
              name="issue_date"
              value={formData.issue_date}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div>
            <label htmlFor="grade" className="form-label">
              Grade/Achievement Level
            </label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., A+, Excellent, With Distinction"
            />
          </div>
        </div>

        <div>
          <label htmlFor="remarks" className="form-label">
            Remarks
          </label>
          <textarea
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            className="form-input"
            rows={3}
            placeholder="Special achievements, notes, or commendations..."
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          📝 Certificate Information
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Certificate will be generated with number: {certificateNumber}
          </li>
          <li>• Student will be able to view this in their profile</li>
          <li>• PDF generation can be added in future updates</li>
        </ul>
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
          <Award className="h-4 w-4" />
          <span>{loading ? "Generating..." : "Generate Certificate"}</span>
        </button>
      </div>
    </form>
  );
}
