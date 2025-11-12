// components/curriculum/StudentMemorizationTracker.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Star, Brain } from "lucide-react";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
}

interface MemorizationItem {
  id: string;
  item_type: string;
  name: string;
  arabic_text: string | null;
  transliteration: string | null;
  translation: string | null;
  difficulty_level: string | null;
  is_required: boolean;
}

interface StudentProgress {
  id: string;
  memorization_item_id: string;
  status: string;
  proficiency_rating: number | null;
  test_score: number | null;
  teacher_notes: string | null;
}

interface StudentMemorizationTrackerProps {
  students: Student[];
  items: MemorizationItem[];
  studentProgress: StudentProgress[];
  selectedStudentId?: string;
}

export default function StudentMemorizationTracker({
  students,
  items,
  studentProgress,
  selectedStudentId,
}: StudentMemorizationTrackerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [selectedStudent, setSelectedStudent] = useState(
    selectedStudentId || ""
  );
  const [saving, setSaving] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("student", studentId);
    router.push(
      `/curriculum-assessment/memorization/track?${params.toString()}`
    );
  };

  const getProgressForItem = (itemId: string): StudentProgress | undefined => {
    return studentProgress.find((p) => p.memorization_item_id === itemId);
  };

  const updateProgress = async (
    itemId: string,
    status: string,
    proficiencyRating?: number
  ) => {
    if (!selectedStudent) return;

    setUpdatingItem(itemId);
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const existingProgress = getProgressForItem(itemId);

      const payload = {
        student_id: selectedStudent,
        memorization_item_id: itemId,
        status,
        proficiency_rating: proficiencyRating || null,
        teacher_id: user.id,
        ...(status === "learning" &&
          !existingProgress?.started_date && {
            started_date: new Date().toISOString().split("T")[0],
          }),
        ...(status === "memorized" && {
          memorized_date: new Date().toISOString().split("T")[0],
        }),
        ...(status === "mastered" && {
          mastered_date: new Date().toISOString().split("T")[0],
        }),
      };

      if (existingProgress) {
        const { error } = await supabase
          .from("student_memorization")
          .update(payload)
          .eq("id", existingProgress.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("student_memorization")
          .insert([payload]);

        if (error) throw error;
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating progress:", error);
      alert("Failed to update progress");
    } finally {
      setSaving(false);
      setUpdatingItem(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-800";
      case "learning":
        return "bg-blue-100 text-blue-800";
      case "memorized":
        return "bg-green-100 text-green-800";
      case "mastered":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateProgress = () => {
    if (items.length === 0) return 0;
    const mastered = studentProgress.filter(
      (p) => p.status === "mastered"
    ).length;
    return Math.round((mastered / items.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <div className="bg-card border border-border rounded-lg p-6">
        <label htmlFor="student" className="form-label">
          Select Student *
        </label>
        <select
          id="student"
          value={selectedStudent}
          onChange={(e) => handleStudentChange(e.target.value)}
          className="form-input max-w-md"
        >
          <option value="">Choose a student...</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.first_name} {student.last_name} (#
              {student.student_number})
            </option>
          ))}
        </select>
      </div>

      {/* Progress Display */}
      {selectedStudent && (
        <>
          {/* Overall Progress */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">
                  {calculateProgress()}%
                </span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary rounded-full h-3 transition-all"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">
                  {items.length - studentProgress.length}
                </p>
                <p className="text-muted-foreground">Not Started</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {
                    studentProgress.filter((p) => p.status === "learning")
                      .length
                  }
                </p>
                <p className="text-muted-foreground">Learning</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700">
                  {
                    studentProgress.filter((p) => p.status === "memorized")
                      .length
                  }
                </p>
                <p className="text-muted-foreground">Memorized</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {
                    studentProgress.filter((p) => p.status === "mastered")
                      .length
                  }
                </p>
                <p className="text-muted-foreground">Mastered</p>
              </div>
            </div>
          </div>

          {/* Memorization Items */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Memorization Items</h3>
            <div className="space-y-3">
              {items.map((item) => {
                const progress = getProgressForItem(item.id);
                const currentStatus = progress?.status || "not_started";
                const isUpdating = updatingItem === item.id;

                return (
                  <div
                    key={item.id}
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{item.name}</span>
                          {item.is_required && (
                            <Star className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize">
                            {item.item_type}
                          </span>
                        </div>

                        {item.arabic_text && (
                          <p className="text-sm text-muted-foreground rtl font-arabic mb-1">
                            {item.arabic_text}
                          </p>
                        )}

                        {item.transliteration && (
                          <p className="text-xs italic text-muted-foreground">
                            {item.transliteration}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 space-y-2">
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            updateProgress(item.id, e.target.value)
                          }
                          disabled={saving}
                          className={`text-sm px-3 py-1 rounded-full border font-medium ${getStatusColor(
                            currentStatus
                          )}`}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="learning">Learning</option>
                          <option value="memorized">Memorized</option>
                          <option value="mastered">Mastered</option>
                        </select>

                        {isUpdating && (
                          <div className="flex justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Proficiency Rating */}
                    {progress && progress.status !== "not_started" && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            Proficiency:
                          </span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() =>
                                  updateProgress(item.id, currentStatus, rating)
                                }
                                disabled={saving}
                                className={`p-1 ${
                                  progress.proficiency_rating &&
                                  progress.proficiency_rating >= rating
                                    ? "text-yellow-500"
                                    : "text-gray-300"
                                }`}
                              >
                                <Star className="h-4 w-4 fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!selectedStudent && items.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">
            Select a student to track their memorization progress
          </p>
        </div>
      )}
    </div>
  );
}
