"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

export default function MessageLogCleanup() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ deleted: number } | null>(null);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsResult, setEventsResult] = useState<{ deleted: number } | null>(
    null,
  );
  const [eventsError, setEventsError] = useState("");
  const [showEventsConfirm, setShowEventsConfirm] = useState(false);

  const handleEventsCleanup = async () => {
    setEventsLoading(true);
    setEventsError("");
    setEventsResult(null);
    setShowEventsConfirm(false);

    try {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

      const { error: deleteError, count } = await supabase
        .from("student_events")
        .delete({ count: "exact" })
        .in("status", ["dismissed", "actioned"])
        .lt("actioned_at", cutoffDate.toISOString());

      if (deleteError) throw deleteError;

      setEventsResult({ deleted: count || 0 });
    } catch (err: any) {
      setEventsError(err.message || "Cleanup failed");
    } finally {
      setEventsLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setShowConfirm(false);

    try {
      // Delete message_delivery_log entries older than 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const { error: deleteError, count } = await supabase
        .from("message_delivery_log")
        .delete({ count: "exact" })
        .lt("sent_at", cutoffDate.toISOString());

      if (deleteError) throw deleteError;

      setResult({ deleted: count || 0 });
    } catch (err: any) {
      setError(err.message || "Cleanup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Message Log Cleanup</h3>
        <p className="text-sm text-muted-foreground">
          Remove WhatsApp message delivery logs older than 90 days. This keeps
          the database clean without affecting current alerts or history.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">
            {result.deleted === 0
              ? "No old logs found — database is already clean."
              : `Successfully deleted ${result.deleted} log${result.deleted !== 1 ? "s" : ""} older than 90 days.`}
          </p>
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {loading ? "Cleaning up..." : "Run 90-Day Cleanup"}
      </button>

      <p className="text-xs text-muted-foreground mt-3">
        Last run: {result ? "Just now" : "Never run in this session"}
      </p>

      {/* Divider */}
      <div className="border-t border-border mt-6 pt-6">
        <h3 className="text-lg font-semibold mb-1">Alert History Cleanup</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Remove dismissed and actioned alert records older than 1 year. Active
          alerts are never deleted.
        </p>

        {eventsError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">
              {eventsError}
            </p>
          </div>
        )}

        {eventsResult && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">
              {eventsResult.deleted === 0
                ? "No old alert records found — already clean."
                : `Successfully deleted ${eventsResult.deleted} alert record${eventsResult.deleted !== 1 ? "s" : ""} older than 1 year.`}
            </p>
          </div>
        )}

        <button
          onClick={() => setShowEventsConfirm(true)}
          disabled={eventsLoading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {eventsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {eventsLoading ? "Cleaning up..." : "Run 1-Year Cleanup"}
        </button>

        <p className="text-xs text-muted-foreground mt-3">
          Last run: {eventsResult ? "Just now" : "Never run in this session"}
        </p>
      </div>

      {/* Events Confirm Modal */}
      {showEventsConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold mb-1">
                  Confirm Alert Cleanup
                </h3>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all dismissed and actioned alert
                  records older than 1 year. Active alerts are not affected.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEventsConfirm(false)}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleEventsCleanup}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
              >
                Yes, Clean Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold mb-1">Confirm Cleanup</h3>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all WhatsApp message delivery
                  logs older than 90 days. This cannot be undone.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Active alerts and student records are not affected.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleCleanup}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
              >
                Yes, Clean Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
