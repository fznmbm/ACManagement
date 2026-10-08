"use client";

/**
 * ReasonDialog — a confirm dialog that also captures a short free-text reason
 * (for waiving a fine, cancelling an invoice, etc.). Controlled by the parent:
 * open it, and onConfirm receives the typed reason (may be empty).
 */

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export interface ReasonDialogProps {
  open: boolean;
  title: string;
  message?: string;
  label?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export default function ReasonDialog({
  open,
  title,
  message,
  label = "Reason",
  placeholder = "Add a short reason (optional)…",
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive,
  busy,
  onCancel,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");

  // Clear the field each time the dialog opens.
  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3">
          {destructive && (
            <div className="flex-shrink-0 rounded-full bg-red-100 p-2 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {message && (
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        </div>

        <label className="mt-4 block text-sm font-medium text-foreground">
          {label}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          rows={3}
          autoFocus
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:opacity-90"
            }`}
          >
            {busy ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
