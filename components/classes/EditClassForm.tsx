// components/classes/EditClassForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import ClassForm from "./ClassForm";

interface EditClassFormProps {
  teachers: Array<{ id: string; full_name: string; email: string }>;
  classData: any;
}

export default function EditClassForm({
  teachers,
  classData,
}: EditClassFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      // Check if class has students
      const { count: studentCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classData.id);

      if (studentCount && studentCount > 0) {
        setError(
          `Cannot delete class with ${studentCount} enrolled student(s). Please reassign students first.`
        );
        setDeleting(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("classes")
        .delete()
        .eq("id", classData.id);

      if (deleteError) throw deleteError;

      router.push("/classes");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete class");
      console.error("Error deleting class:", err);
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <ClassForm teachers={teachers} classData={classData} />

        {/* Delete Section */}
        <div className="pt-6 border-t border-destructive/20">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete a class, there is no going back. Please be
              certain.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete This Class</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Class</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <strong>{classData.name}</strong>?
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
