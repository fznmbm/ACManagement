// components/curriculum/AssessmentForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import {
  calculateGrade,
  calculatePercentage,
  getGradeColor,
  getGradeDescription,
} from "@/lib/utils/gradeCalculator";

interface AssessmentFormProps {
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
    class_id: string | null;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    class_id: string | null;
  }>;
  preSelectedStudent?: string;
  preSelectedSubject?: string;
}

export default function AssessmentForm({
  students,
  subjects,
  preSelectedStudent,
  preSelectedSubject,
}: AssessmentFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    student_id: preSelectedStudent || "",
    subject_id: preSelectedSubject || "",
    assessment_type: "test",
    assessment_date: new Date().toISOString().split("T")[0],
    score: "",
    max_score: "100",
    teacher_feedback: "",
  });

  const [calculatedGrade, setCalculatedGrade] = useState<{
    percentage: number;
    grade: string;
    description: string;
  } | null>(null);

  // Filter subjects based on selected student's class
  const [filteredSubjects, setFilteredSubjects] = useState(subjects);

  useEffect(() => {
    if (formData.student_id) {
      const selectedStudent = students.find(
        (s) => s.id === formData.student_id
      );
      if (selectedStudent) {
        // Filter subjects: show all subjects OR subjects assigned to student's class
        const filtered = subjects.filter(
          (subject) =>
            !subject.class_id || subject.class_id === selectedStudent.class_id
        );
        setFilteredSubjects(filtered);
      }
    } else {
      setFilteredSubjects(subjects);
    }
  }, [formData.student_id, students, subjects]);

  // Calculate grade whenever score or max_score changes
  useEffect(() => {
    if (formData.score && formData.max_score) {
      const score = parseFloat(formData.score);
      const maxScore = parseFloat(formData.max_score);

      if (!isNaN(score) && !isNaN(maxScore) && maxScore > 0) {
        const percentage = calculatePercentage(score, maxScore);
        const grade = calculateGrade(percentage);
        const description = getGradeDescription(grade);

        setCalculatedGrade({ percentage, grade, description });
      } else {
        setCalculatedGrade(null);
      }
    } else {
      setCalculatedGrade(null);
    }
  }, [formData.score, formData.max_score]);

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
      if (!calculatedGrade) {
        throw new Error("Please enter valid score and max score");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        student_id: formData.student_id,
        subject_id: formData.subject_id || null,
        assessment_type: formData.assessment_type,
        assessment_date: formData.assessment_date,
        score: parseFloat(formData.score),
        max_score: parseFloat(formData.max_score),
        percentage: calculatedGrade.percentage,
        grade: calculatedGrade.grade,
        teacher_feedback: formData.teacher_feedback || null,
        teacher_id: user.id,
      };

      const { error: insertError } = await supabase
        .from("academic_progress")
        .insert([payload]);

      if (insertError) throw insertError;

      router.push("/curriculum-assessment/assessments");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to record assessment");
      console.error("Error recording assessment:", err);
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

      {/* Student and Subject Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label htmlFor="subject_id" className="form-label">
            Subject *
          </label>
          <select
            id="subject_id"
            name="subject_id"
            value={formData.subject_id}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Select subject...</option>
            {filteredSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assessment Type and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="assessment_type" className="form-label">
            Assessment Type *
          </label>
          <select
            id="assessment_type"
            name="assessment_type"
            value={formData.assessment_type}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="test">Test</option>
            <option value="quiz">Quiz</option>
            <option value="homework">Homework</option>
            <option value="oral_test">Oral Test</option>
          </select>
        </div>

        <div>
          <label htmlFor="assessment_date" className="form-label">
            Assessment Date *
          </label>
          <input
            type="date"
            id="assessment_date"
            name="assessment_date"
            value={formData.assessment_date}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
      </div>

      {/* Score Input */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Score Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="score" className="form-label">
              Score *
            </label>
            <input
              type="number"
              id="score"
              name="score"
              value={formData.score}
              onChange={handleChange}
              className="form-input"
              min="0"
              step="0.5"
              placeholder="e.g., 85"
              required
            />
          </div>

          <div>
            <label htmlFor="max_score" className="form-label">
              Maximum Score *
            </label>
            <input
              type="number"
              id="max_score"
              name="max_score"
              value={formData.max_score}
              onChange={handleChange}
              className="form-input"
              min="1"
              step="0.5"
              placeholder="e.g., 100"
              required
            />
          </div>
        </div>

        {/* Grade Preview */}
        {calculatedGrade && (
          <div className="mt-4 p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Calculated Grade
                </p>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 text-lg font-bold rounded-full border ${getGradeColor(
                      calculatedGrade.grade
                    )}`}
                  >
                    {calculatedGrade.grade}
                  </span>
                  <div>
                    <p className="font-medium">{calculatedGrade.percentage}%</p>
                    <p className="text-sm text-muted-foreground">
                      {calculatedGrade.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Teacher Feedback */}
      <div>
        <label htmlFor="teacher_feedback" className="form-label">
          Teacher Feedback
        </label>
        <textarea
          id="teacher_feedback"
          name="teacher_feedback"
          value={formData.teacher_feedback}
          onChange={handleChange}
          className="form-input"
          rows={4}
          placeholder="Comments about student's performance, areas of improvement, strengths..."
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional feedback that will be visible to the student and parents
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
        <button
          type="submit"
          className="btn-primary flex items-center space-x-2"
          disabled={loading || !calculatedGrade}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{loading ? "Saving..." : "Record Assessment"}</span>
        </button>
      </div>
    </form>
  );
}
