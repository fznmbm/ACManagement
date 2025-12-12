"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Eye, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function OrphanedAuthCleanup() {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Add after other useState declarations (around line 11)
  const [confirmText, setConfirmText] = useState("");

  const supabase = createClient();

  // Preview orphaned users (GET request)
  const handlePreview = async () => {
    setIsLoading(true);
    setError("");
    setCleanupResult(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/api/admin/cleanup-orphaned-auth", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setPreviewData(data);
      } else {
        setError(data.error || "Failed to preview orphaned users");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Dry run cleanup (POST with dryRun: true)
  const handleDryRun = async () => {
    setIsLoading(true);
    setError("");
    setCleanupResult(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/api/admin/cleanup-orphaned-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dryRun: true }),
      });

      const data = await response.json();

      if (response.ok) {
        setCleanupResult(data.results);
      } else {
        setError(data.error || "Dry run failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Actual cleanup (POST with dryRun: false)
  const handleActualCleanup = async () => {
    setIsLoading(true);
    setError("");
    setShowConfirmModal(false);
    setConfirmText("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/api/admin/cleanup-orphaned-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dryRun: false }),
      });

      const data = await response.json();

      if (response.ok) {
        setCleanupResult(data.results);
        setPreviewData(null); // Clear preview after cleanup
      } else {
        setError(data.error || "Cleanup failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Orphaned Auth User Cleanup
          </h3>
          <p className="text-sm text-muted-foreground">
            Find and remove authentication accounts that no longer have
            associated profiles. This happens when applications are deleted but
            parent auth accounts remain.
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-400">
              Error
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handlePreview}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Preview Orphaned Users
        </button>

        <button
          onClick={handleDryRun}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          Dry Run (Safe Test)
        </button>

        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={isLoading || (!previewData && !cleanupResult)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete Orphaned Users
        </button>
      </div>

      {/* Preview Results */}
      {previewData && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview Results
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Auth Users:</span>
              <span className="font-medium">{previewData.totalAuthUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Profiles:</span>
              <span className="font-medium">{previewData.totalProfiles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orphaned Users:</span>
              <span className="font-medium text-red-600">
                {previewData.orphanedCount}
              </span>
            </div>
          </div>

          {previewData.orphanedUsers?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Orphaned Accounts:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {previewData.orphanedUsers.map((user: any) => (
                  <div
                    key={user.id}
                    className="text-xs bg-white dark:bg-slate-800 p-2 rounded border"
                  >
                    <div className="font-medium">
                      {user.email || "No email"}
                    </div>
                    <div className="text-muted-foreground">
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cleanup Results */}
      {cleanupResult && (
        <div
          className={`p-4 rounded-lg border ${
            cleanupResult.dryRun
              ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
              : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          }`}
        >
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {cleanupResult.dryRun ? "Dry Run Results" : "Cleanup Complete"}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode:</span>
              <span className="font-medium">
                {cleanupResult.dryRun
                  ? "🔍 Dry Run (No Deletion)"
                  : "✅ Live Cleanup"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orphaned Found:</span>
              <span className="font-medium">{cleanupResult.orphanedFound}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Safe to Delete:</span>
              <span className="font-medium text-green-600">
                {cleanupResult.safeToDelete}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Protected (Skipped):
              </span>
              <span className="font-medium text-yellow-600">
                {cleanupResult.protectedSkipped}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {cleanupResult.dryRun ? "Would Delete:" : "Deleted:"}
              </span>
              <span className="font-medium text-red-600">
                {cleanupResult.deleted.length}
              </span>
            </div>
            {cleanupResult.errors.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Errors:</span>
                <span className="font-medium text-red-600">
                  {cleanupResult.errors.length}
                </span>
              </div>
            )}
          </div>

          {cleanupResult.deleted?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">
                {cleanupResult.dryRun ? "Would Delete:" : "Deleted Accounts:"}
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {cleanupResult.deleted.map((email: string, idx: number) => (
                  <div
                    key={idx}
                    className="text-xs bg-white dark:bg-slate-800 p-2 rounded border"
                  >
                    {email}
                  </div>
                ))}
              </div>
            </div>
          )}

          {cleanupResult.protected?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Protected (Skipped):</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {cleanupResult.protected.map((email: string, idx: number) => (
                  <div
                    key={idx}
                    className="text-xs bg-white dark:bg-slate-800 p-2 rounded border"
                  >
                    {email}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold mb-2">
                  Confirm Orphaned User Deletion
                </h3>
                <p className="text-sm text-muted-foreground">
                  This will <strong>permanently delete</strong> all orphaned
                  authentication accounts. This action cannot be undone.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Protected accounts (containing "admin" or "teacher" in email)
                  will be automatically skipped.
                </p>
              </div>
            </div>

            {previewData && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm font-medium text-red-800 dark:text-red-400">
                  About to delete: <strong>{previewData.orphanedCount}</strong>{" "}
                  orphaned user(s)
                </p>
              </div>
            )}

            {/* Type DELETE to confirm */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to
                confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-background"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmText(""); // Reset confirmation text
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border-2 border-muted-foreground/30 rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActualCleanup}
                disabled={isLoading || confirmText !== "DELETE"}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 border rounded-lg">
        <h4 className="text-sm font-semibold mb-2">ℹ️ How This Works</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>
            • <strong>Preview:</strong> Shows all auth users without profiles
          </li>
          <li>
            • <strong>Dry Run:</strong> Tests deletion logic without actually
            deleting
          </li>
          <li>
            • <strong>Delete:</strong> Permanently removes orphaned auth
            accounts
          </li>
          <li>
            • <strong>Protected:</strong> Emails with "admin" or "teacher" are
            skipped
          </li>
          <li>
            • <strong>Safe:</strong> Only deletes users without matching
            profiles
          </li>
        </ul>
      </div>
    </div>
  );
}
