// components/curriculum/EditSubjectForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import SubjectForm from "./SubjectForm";

interface EditSubjectFormProps {
  subject: any;
  classes: Array<{ id: string; name: string }>;
}

export default function EditSubjectForm({
  subject,
  classes,
}: EditSubjectFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      // Check if subject has topics
      const { count: topicCount } = await supabase
        .from("curriculum_topics")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subject.id);

      // Check if subject has assessments
      const { count: assessmentCount } = await supabase
        .from("academic_progress")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subject.id);

      if (topicCount && topicCount > 0) {
        setError(
          `Cannot delete subject with ${topicCount} topic(s). Please delete topics first.`
        );
        setDeleting(false);
        return;
      }

      if (assessmentCount && assessmentCount > 0) {
        setError(
          `Cannot delete subject with ${assessmentCount} assessment(s). Please delete or reassign assessments first.`
        );
        setDeleting(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subject.id);

      if (deleteError) throw deleteError;

      router.push("/curriculum-assessment/subjects");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete subject");
      console.error("Error deleting subject:", err);
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <SubjectForm subject={subject} classes={classes} />

        {/* Delete Section */}
        <div className="pt-6 border-t border-destructive/20">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete a subject, there is no going back. All related
              topics and data will be lost.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete This Subject</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Subject</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <strong>{subject.name}</strong>?
              This action cannot be undone.
            </p>

            {error && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setError(null);
                }}
                className="btn-outline"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
