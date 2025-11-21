import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import { useStudentManagement } from "@/hooks/useStudentManagement";
import FinancialImpactWarning from "./FinancialImpactWarning";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  status: string;
}

interface StudentDeletionModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudentDeletionModal({
  student,
  isOpen,
  onClose,
  onSuccess,
}: StudentDeletionModalProps) {
  const [deletionCheck, setDeletionCheck] = useState<any>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  const {
    checkStudentDeletion,
    cleanupStudentRecords,
    deleteStudent,
    loading: actionLoading,
  } = useStudentManagement();

  const expectedConfirmation = `DELETE ${student.student_number}`;

  useEffect(() => {
    if (isOpen) {
      loadDeletionCheck();
    }
  }, [isOpen]);

  const loadDeletionCheck = async () => {
    setLoading(true);
    const result = await checkStudentDeletion(student.id);
    setDeletionCheck(result);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirmationText !== expectedConfirmation) {
      alert(`Please type "${expectedConfirmation}" to confirm`);
      return;
    }

    try {
      // Step 1: Cleanup financial records if needed
      if (deletionCheck.deletion_type === "cleanup_required") {
        const cleanupResult = await cleanupStudentRecords(
          student.id,
          reason || "Student removed from system"
        );
        if (!cleanupResult.success) {
          alert(`Failed to cleanup records: ${cleanupResult.error}`);
          return;
        }
      }

      // Step 2: Delete or withdraw student
      if (deletionCheck.deletion_type === "soft_delete_only") {
        // For students with payment history, use withdrawal instead
        alert(
          "This student has payment history and cannot be deleted. They will be marked as withdrawn instead."
        );
        onClose();
        return;
      }

      // Step 3: Delete student
      const deleteResult = await deleteStudent(student.id);
      if (deleteResult.success) {
        alert("Student removed successfully");
        onSuccess();
      } else {
        alert(`Failed to remove student: ${deleteResult.error}`);
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("An unexpected error occurred");
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-background border rounded-lg shadow-xl p-6">
          <p>Checking deletion requirements...</p>
        </div>
      </div>
    );
  }

  const getDeletionTypeInfo = () => {
    switch (deletionCheck?.deletion_type) {
      case "safe_delete":
        return {
          title: "Safe Deletion",
          description:
            "This student has no financial records and can be safely deleted.",
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        };
      case "cleanup_required":
        return {
          title: "Cleanup Required",
          description:
            "This student has unpaid fees that will be cancelled before deletion.",
          color: "text-yellow-600",
          bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
        };
      case "soft_delete_only":
        return {
          title: "Deletion Not Allowed",
          description:
            "This student has payment history and must be withdrawn instead of deleted.",
          color: "text-red-600",
          bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
        };
      default:
        return {
          title: "Unknown",
          description: "Unable to determine deletion requirements.",
          color: "text-gray-600",
          bg: "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
        };
    }
  };

  const deletionInfo = getDeletionTypeInfo();
  const canProceed = deletionCheck?.deletion_type !== "soft_delete_only";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-red-600">
              Remove Student
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Student Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-medium">
              {student.first_name} {student.last_name}
            </p>
            <p className="text-sm text-muted-foreground">
              Student Number: {student.student_number}
            </p>
          </div>

          {/* Deletion Type Info */}
          <div className={`p-4 rounded-lg border ${deletionInfo.bg}`}>
            <h3 className={`font-medium ${deletionInfo.color} mb-2`}>
              {deletionInfo.title}
            </h3>
            <p className="text-sm">{deletionInfo.description}</p>
          </div>

          {/* Financial Impact */}
          <FinancialImpactWarning
            studentId={student.id}
            actionType="deletion"
          />

          {canProceed ? (
            <div className="space-y-4">
              {/* Reason */}
              <div>
                <label
                  htmlFor="deletion-reason"
                  className="block text-sm font-medium mb-2"
                >
                  Reason for Removal
                </label>
                <textarea
                  id="deletion-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for removing this student..."
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>

              {/* Confirmation */}
              <div>
                <label
                  htmlFor="confirmation"
                  className="block text-sm font-medium mb-2"
                >
                  Type{" "}
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {expectedConfirmation}
                  </code>{" "}
                  to confirm
                </label>
                <input
                  id="confirmation"
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={expectedConfirmation}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
              </div>

              {/* Warning */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-2 text-red-800 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm mb-1">
                      This action cannot be undone
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 break-words">
                      The student record will be permanently removed from the
                      system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="max-w-full overflow-hidden">
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-normal break-words">
                  This student cannot be deleted due to existing payment
                  history.
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-normal break-words mt-2">
                  Please use{" "}
                  <span className="font-medium">"Change Status"</span> to mark
                  them as withdrawn instead.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              className="px-4 py-2 text-muted-foreground hover:text-foreground border border-input rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            {canProceed && (
              <button
                onClick={handleDelete}
                disabled={
                  actionLoading || confirmationText !== expectedConfirmation
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Remove Student</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
