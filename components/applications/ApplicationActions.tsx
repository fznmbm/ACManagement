"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Clock,
  List,
  Loader2,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Application {
  id: string;
  application_number: string;
  status: string;
  child_first_name: string;
  child_last_name: string;
  parent_email?: string;
  converted_to_student_id?: string;
}

interface ApplicationActionsProps {
  application: Application;
  classes?: Array<{ id: string; name: string }>;
  preferredClassId?: string | null;
}

export default function ApplicationActions({
  application,
  classes = [],
  preferredClassId = null,
}: ApplicationActionsProps) {
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(
    preferredClassId || ""
  );

  const handleAccept = async () => {
    if (
      !(await confirm({
        title: "Accept application",
        message: `Create a student record for ${application.child_first_name} ${application.child_last_name}?`,
        confirmText: "Accept & create student",
      }))
    ) {
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch(
        `/api/applications/${application.id}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ class_id: selectedClassId || null }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Accepted — student ${data.student_number} created.`
        );
        router.refresh();
      } else {
        setError(data.error || "Failed to accept application");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch(
        `/api/applications/${application.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Application rejected.");
        setShowRejectModal(false);
        router.refresh();
      } else {
        setError(data.error || "Failed to reject application");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (
      !(await confirm(
        `Change application status to "${newStatus.replace("_", " ")}"?`
      ))
    ) {
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch(
        `/api/applications/${application.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Status updated.");
        router.refresh();
      } else {
        setError(data.error || "Failed to update status");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="font-bold mb-4">Actions</h3>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Accept Button - Show for pending, under_review, AND waitlist */}
        {application.status === "pending" ||
        application.status === "under_review" ||
        application.status === "waitlist" ? (
          <>
            {/* Assign to a class on accept (optional) */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                Enrol in class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={isProcessing}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No class yet — assign later</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.id === preferredClassId ? " (requested)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  {application.status === "waitlist"
                    ? "Accept from Waitlist"
                    : "Accept & Create Student"}
                </>
              )}
            </button>
          </>
        ) : // <LoadingButton
        //   onClick={handleAccept}
        //   isLoading={isProcessing}
        //   loadingText="Processing..."
        //   variant="primary"
        //   className="w-full bg-green-600 hover:bg-green-700"
        //   size="lg"
        // >
        //   <CheckCircle className="h-5 w-5 mr-2" />
        //   {application.status === "waitlist"
        //     ? "Accept from Waitlist"
        //     : "Accept & Create Student"}
        // </LoadingButton>
        // ) : application.status === "accepted" ? (
        //   <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
        //     <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
        //     <p className="text-sm font-medium text-green-800 dark:text-green-400">
        //       Application Accepted
        //     </p>
        //   </div>
        // ) : null}
        application.status === "accepted" ? (
          <>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                Application Accepted
              </p>
            </div>

            {/* Jump to the new student record */}
            {application.converted_to_student_id && (
              <Link
                href={`/students/${application.converted_to_student_id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                View student record
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {/* Send Parent Login Details Button */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Parent account ready. Send login details when ready.
              </p>
              <button
                onClick={async () => {
                  // Check if student ID exists
                  if (!(application as any).converted_to_student_id) {
                    setError(
                      "Student record not found. Please refresh and try again."
                    );
                    return;
                  }

                  setIsProcessing(true);
                  setError("");
                  try {
                    const response = await fetch(
                      "/api/parent/send-login-details",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          parentEmail: (application as any).parent_email,
                          studentId: (application as any)
                            .converted_to_student_id,
                        }),
                      }
                    );

                    const data = await response.json();

                    if (data.success) {
                      toast.success("Login details sent to parent.");
                    } else {
                      setError(data.error || "Failed to send login details");
                    }
                  } catch (err) {
                    setError("Error sending login details");
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Parent Login Details"
                )}
              </button>
            </div>
          </>
        ) : null}

        {/* Reject Button - Show for pending, under_review, AND waitlist */}
        {application.status === "pending" ||
        application.status === "under_review" ||
        application.status === "waitlist" ? (
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-5 w-5" />
            Reject Application
          </button>
        ) : application.status === "rejected" ? (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-center">
            <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-red-800 dark:text-red-400">
              Application Rejected
            </p>
          </div>
        ) : null}

        {/* Mark as Under Review - Only for pending  */}
        {application.status === "pending" && (
          <button
            onClick={() => handleStatusChange("under_review")}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
          >
            <Clock className="h-5 w-5" />
            Mark as Under Review
          </button>
        )}

        {/* Move to Waitlist - For pending and under_review only */}
        {(application.status === "pending" ||
          application.status === "under_review") && (
          <button
            onClick={() => handleStatusChange("waitlist")}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-yellow-600 text-yellow-600 rounded-lg font-medium hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors disabled:opacity-50"
          >
            <List className="h-5 w-5" />
            Move to Waitlist
          </button>
        )}

        {/* Move Back to Under Review - For waitlist only */}
        {application.status === "waitlist" && (
          <button
            onClick={() => handleStatusChange("under_review")}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
          >
            <Clock className="h-5 w-5" />
            Move Back to Review
          </button>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Reject Application</h3>

            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting this application. This will
              be recorded for reference.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background mb-4"
            />

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setError("");
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border-2 border-muted-foreground/30 rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Application"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
