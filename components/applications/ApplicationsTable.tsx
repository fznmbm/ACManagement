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
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import ReasonDialog from "@/components/ui/ReasonDialog";

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

const SELECTABLE = ["pending", "under_review", "waitlist", "accepted"];
const ACTIONABLE = ["pending", "under_review", "waitlist"];

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
  const [rejectOpen, setRejectOpen] = useState(false);
  const [newAppToast, setNewAppToast] = useState<Application | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const { toast, confirm } = useToast();

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
              new Notification("New application received", {
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
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const selectablePending = applications.filter((a) =>
    SELECTABLE.includes(a.status),
  );

  const toggleSelectAll = () => {
    const ids = selectablePending.map((a) => a.id);
    if (selectedIds.size === ids.length && ids.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ids));
    }
  };

  const selectedApplications = applications.filter((a) =>
    selectedIds.has(a.id),
  );
  const rejectable = selectedApplications.filter((a) =>
    ACTIONABLE.includes(a.status),
  );

  const handleBulkAccept = async () => {
    const toAccept = selectedApplications.filter((a) =>
      ACTIONABLE.includes(a.status),
    );
    if (toAccept.length === 0) return;
    if (
      !(await confirm({
        title: "Accept applications",
        message: `Create a student record for ${toAccept.length} application${
          toAccept.length > 1 ? "s" : ""
        }? Each child is enrolled into their requested class where one was set.`,
        confirmText: "Accept & create students",
      }))
    )
      return;

    setBulkLoading(true);
    setBulkProgress({ done: 0, total: toAccept.length });
    let success = 0;
    let failed = 0;

    for (const app of toAccept) {
      try {
        const res = await fetch(`/api/applications/${app.id}/accept`, {
          method: "POST",
        });
        res.ok ? success++ : failed++;
      } catch {
        failed++;
      }
      setBulkProgress({ done: success + failed, total: toAccept.length });
    }

    setBulkLoading(false);
    setBulkProgress(null);
    setSelectedIds(new Set());
    if (failed === 0) toast.success(`Accepted ${success}.`);
    else toast.error(`Accepted ${success}, ${failed} failed.`);
    router.refresh();
  };

  const doBulkReject = async (reason: string) => {
    if (!reason.trim()) {
      toast.error("Please add a reason for rejection.");
      return;
    }
    const toReject = rejectable;
    if (toReject.length === 0) {
      setRejectOpen(false);
      return;
    }
    setRejectOpen(false);
    setBulkLoading(true);
    setBulkProgress({ done: 0, total: toReject.length });
    let success = 0;
    let failed = 0;

    for (const app of toReject) {
      try {
        const res = await fetch(`/api/applications/${app.id}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        res.ok ? success++ : failed++;
      } catch {
        failed++;
      }
      setBulkProgress({ done: success + failed, total: toReject.length });
    }

    setBulkLoading(false);
    setBulkProgress(null);
    setSelectedIds(new Set());
    if (failed === 0) toast.success(`Rejected ${success}.`);
    else toast.error(`Rejected ${success}, ${failed} failed.`);
    router.refresh();
  };

  const handleBulkSendLogin = async () => {
    const toSend = applications.filter(
      (a) =>
        selectedIds.has(a.id) &&
        a.status === "accepted" &&
        a.converted_to_student_id,
    );
    if (toSend.length === 0) {
      toast.error("No accepted applications with student records selected.");
      return;
    }
    if (
      !(await confirm({
        title: "Send login details",
        message: `Send parent login details to ${toSend.length} parent${
          toSend.length > 1 ? "s" : ""
        }?`,
        confirmText: "Send",
      }))
    )
      return;

    setBulkLoading(true);
    setBulkProgress({ done: 0, total: toSend.length });
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
        res.ok ? success++ : failed++;
      } catch {
        failed++;
      }
      setBulkProgress({ done: success + failed, total: toSend.length });
    }

    setBulkLoading(false);
    setBulkProgress(null);
    setSelectedIds(new Set());
    if (failed === 0) toast.success(`Sent ${success}.`);
    else toast.error(`Sent ${success}, ${failed} failed.`);
  };

  const statusClass = (status: string) => {
    const styles: Record<string, string> = {
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
    return styles[status] || styles.pending;
  };
  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(status)}`}
    >
      {status.replace("_", " ").toUpperCase()}
    </span>
  );

  if (!applications || applications.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No applications found</p>
      </div>
    );
  }

  const allSelectableSelected =
    selectablePending.length > 0 &&
    selectedIds.size === selectablePending.length &&
    selectablePending.every((a) => selectedIds.has(a.id));
  const hasActionable = selectedApplications.some((a) =>
    ACTIONABLE.includes(a.status),
  );
  const hasAccepted = selectedApplications.some((a) => a.status === "accepted");

  return (
    <>
      {newAppToast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
          <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">New application</p>
            <p className="text-xs opacity-90">
              {newAppToast.child_first_name} {newAppToast.child_last_name} —{" "}
              {newAppToast.application_number}
            </p>
          </div>
          <button
            onClick={() => setNewAppToast(null)}
            className="opacity-70 hover:opacity-100 text-lg leading-none shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="space-y-3">
        {/* Bulk action bar */}
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
                  Processing {bulkProgress.done}/{bulkProgress.total}…
                </div>
              ) : (
                <>
                  {hasActionable && (
                    <>
                      <button
                        onClick={handleBulkAccept}
                        disabled={bulkLoading}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        Accept selected
                      </button>
                      <button
                        onClick={() => setRejectOpen(true)}
                        disabled={bulkLoading}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject selected
                      </button>
                    </>
                  )}
                  {hasAccepted && (
                    <button
                      onClick={handleBulkSendLogin}
                      disabled={bulkLoading}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                      Send login details
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

        <div className="bg-card border rounded-lg overflow-hidden">
          {/* Mobile select-all */}
          <div className="flex items-center gap-2 border-b border-border p-3 md:hidden">
            <input
              type="checkbox"
              checked={allSelectableSelected}
              ref={(el) => {
                if (el)
                  el.indeterminate =
                    selectedIds.size > 0 && !allSelectableSelected;
              }}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-input text-primary"
              id="selectall-m"
            />
            <label htmlFor="selectall-m" className="text-sm text-muted-foreground">
              Select all ({selectablePending.length})
            </label>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-border md:hidden">
            {applications.map((a) => {
              const selectable = SELECTABLE.includes(a.status);
              const selected = selectedIds.has(a.id);
              return (
                <div
                  key={a.id}
                  className={`p-4 ${selected ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!selectable}
                      onChange={() => toggleSelect(a.id)}
                      className="mt-1 h-4 w-4 rounded border-input text-primary disabled:opacity-30"
                      aria-label={`Select ${a.child_first_name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">
                          {a.child_first_name} {a.child_last_name}
                        </p>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {a.application_number}
                      </p>
                      <p className="mt-1 text-sm">{a.parent_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.parent_email}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(a.submission_date), "dd MMM yyyy")}
                        </span>
                        <Link
                          href={`/applications/${a.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                        >
                          <Eye className="h-4 w-4" /> View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelectableSelected}
                      ref={(el) => {
                        if (el)
                          el.indeterminate =
                            selectedIds.size > 0 && !allSelectableSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-input text-primary"
                      title="Select all"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">
                    Application #
                  </th>
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
                  const isSelectable = SELECTABLE.includes(application.status);
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
                        <StatusBadge status={application.status} />
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

      <ReasonDialog
        open={rejectOpen}
        title={`Reject ${rejectable.length} application${rejectable.length > 1 ? "s" : ""}`}
        message="This reason is recorded against each application."
        label="Rejection reason"
        placeholder="e.g. Class full for this year group"
        confirmText="Reject"
        destructive
        busy={bulkLoading}
        onCancel={() => setRejectOpen(false)}
        onConfirm={doBulkReject}
      />
    </>
  );
}
