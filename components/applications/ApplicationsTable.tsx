"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  Eye,
  Calendar,
  User,
  CheckSquare,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Application {
  id: string;
  application_number: string;
  child_first_name: string;
  child_last_name: string;
  parent_name: string;
  parent_email: string;
  status: string;
  submission_date: string;
  academic_year: string;
  converted_to_student_id?: string;
}

export default function ApplicationsTable({
  applications: initialApplications,
}: {
  applications: Application[];
}) {
  const [applications, setApplications] =
    useState<Application[]>(initialApplications);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [newAppToast, setNewAppToast] = useState<Application | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  useEffect(() => {
    const channel = supabase
      .channel("applications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newApp = payload.new as Application;
            setApplications((prev) => [newApp, ...prev]);
            setNewAppToast(newApp);
            setTimeout(() => setNewAppToast(null), 6000);
            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              new Notification("New Application Received!", {
                body: `${newApp.child_first_name} ${newApp.child_last_name} — ${newApp.application_number}`,
              });
            }
          } else if (payload.eventType === "UPDATE") {
            setApplications((prev) =>
              prev.map((a) =>
                a.id === payload.new.id ? (payload.new as Application) : a,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setApplications((prev) =>
              prev.filter((a) => a.id !== payload.old.id),
            );
          }
          // Refresh server component to update stats cards
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectable = applications
      .filter((a) => ["pending", "under_review", "waitlist"].includes(a.status))
      .map((a) => a.id);
    if (selectedIds.size === selectable.length && selectable.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectable));
    }
  };

  const selectedApplications = applications.filter((a) =>
    selectedIds.has(a.id),
  );
  const selectablePending = applications.filter((a) =>
    ["pending", "under_review", "waitlist"].includes(a.status),
  );

  const handleBulkAccept = async () => {
    const toAccept = selectedApplications.filter((a) =>
      ["pending", "under_review", "waitlist"].includes(a.status),
    );
    if (toAccept.length === 0) return;
    if (
      !confirm(
        `Accept ${toAccept.length} application${toAccept.length > 1 ? "s" : ""}? This will create student records for each.`,
      )
    )
      return;

    setBulkLoading(true);
    setBulkProgress({ done: 0, total: toAccept.length });
    setBulkResult(null);
    let success = 0;
    let failed = 0;

    for (const app of toAccept) {
      try {
        const res = await fetch(`/api/applications/${app.id}/accept`, {
          method: "POST",
        });
        if (res.ok) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      setBulkProgress({ done: success + failed, total: toAccept.length });
    }

    setBulkLoading(false);
    setBulkProgress(null);
    setSelectedIds(new Set());
    setBulkResult(
      `✅ Accepted ${success}${failed > 0 ? ` · ❌ Failed ${failed}` : ""}`,
    );
    router.refresh();
    setTimeout(() => setBulkResult(null), 5000);
  };

  const handleBulkReject = async () => {
    const toReject = selectedApplications.filter((a) =>
      ["pending", "under_review", "waitlist"].includes(a.status),
    );
    if (toReject.length === 0) return;
    const reason = prompt(
      `Rejection reason for ${toReject.length} application${toReject.length > 1 ? "s" : ""}:`,
    );
    if (!reason?.trim()) return;

    setBulkLoading(true);
    setBulkProgress({ done: 0, total: toReject.length });
    setBulkResult(null);
    let success = 0;
    let failed = 0;

    for (const app of toReject) {
      try {
        const res = await fetch(`/api/applications/${app.id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        if (res.ok) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      setBulkProgress({ done: success + failed, total: toReject.length });
    }

    setBulkLoading(false);
    setBulkProgress(null);
    setSelectedIds(new Set());
    setBulkResult(
      `✅ Rejected ${success}${failed > 0 ? ` · ❌ Failed ${failed}` : ""}`,
    );
    router.refresh();
    setTimeout(() => setBulkResult(null), 5000);
  };

  const handleBulkSendLogin = async () => {
    const toSend = applications.filter(
      (a) =>
        selectedIds.has(a.id) &&
        a.status === "accepted" &&
        a.converted_to_student_id,
    );
    if (toSend.length === 0) {
      alert("No accepted applications with student records selected.");
      return;
    }
    if (
      !confirm(
        `Send login details to ${toSend.length} parent${toSend.length > 1 ? "s" : ""}?`,
      )
    )
      return;

    setBulkLoading(true);
    setBulkProgress({ done: 0, total: toSend.length });
    setBulkResult(null);
    let success = 0;
    let failed = 0;

    for (const app of toSend) {
      try {
        const res = await fetch("/api/parent/send-login-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentEmail: app.parent_email,
            studentId: app.converted_to_student_id,
          }),
        });
        if (res.ok) {
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      setBulkProgress({ done: success + failed, total: toSend.length });
    }

    setBulkLoading(false);
    setBulkProgress(null);
    setSelectedIds(new Set());
    setBulkResult(
      `✅ Sent ${success}${failed > 0 ? ` · ❌ Failed ${failed}` : ""}`,
    );
    setTimeout(() => setBulkResult(null), 5000);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      under_review:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      accepted:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      waitlist:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  if (!applications || applications.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No applications found</p>
      </div>
    );
  }

  const allSelectableSelected =
    selectablePending.length > 0 &&
    selectedIds.size === selectablePending.length;

  return (
    <>
      {newAppToast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
          <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">🎉 New Application!</p>
            <p className="text-xs opacity-90">
              {newAppToast.child_first_name} {newAppToast.child_last_name} —{" "}
              {newAppToast.application_number}
            </p>
          </div>
          <button
            onClick={() => setNewAppToast(null)}
            className="opacity-70 hover:opacity-100 text-lg leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}
      <div className="space-y-3">
        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {selectedIds.size} selected
                </span>
              </div>
              {bulkLoading && bulkProgress ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing {bulkProgress.done}/{bulkProgress.total}...
                </div>
              ) : (
                <>
                  {selectedApplications.some((a) =>
                    ["pending", "under_review", "waitlist"].includes(a.status),
                  ) && (
                    <>
                      <button
                        onClick={handleBulkAccept}
                        disabled={bulkLoading}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        ✓ Accept Selected
                      </button>
                      <button
                        onClick={handleBulkReject}
                        disabled={bulkLoading}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        ✕ Reject Selected
                      </button>
                    </>
                  )}
                  {selectedApplications.some(
                    (a) => a.status === "accepted",
                  ) && (
                    <button
                      onClick={handleBulkSendLogin}
                      disabled={bulkLoading}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                      📧 Send Login Details
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Clear
              </button>
            </div>
          </div>
        )}

        {/* Result message */}
        {bulkResult && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {bulkResult}
          </div>
        )}

        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelectableSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-input text-primary"
                      title="Select all pending/review/waitlist"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Application #
                  </th>{" "}
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Child Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Parent
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Academic Year
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Submitted
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {applications.map((application) => {
                  const isSelectable = [
                    "pending",
                    "under_review",
                    "waitlist",
                    "accepted",
                  ].includes(application.status);
                  const isSelected = selectedIds.has(application.id);
                  return (
                    <tr
                      key={application.id}
                      className={`hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <td className="py-3 px-4 w-10">
                        {isSelectable && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(application.id)}
                            className="h-4 w-4 rounded border-input text-primary"
                          />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm">
                          {application.application_number}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {application.child_first_name}{" "}
                            {application.child_last_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium">
                            {application.parent_name}
                          </div>
                          <div className="text-muted-foreground">
                            {application.parent_email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {application.academic_year}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(
                            new Date(application.submission_date),
                            "MMM dd, yyyy",
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/applications/${application.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
