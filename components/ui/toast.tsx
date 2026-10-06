"use client";

/**
 * Lightweight toast + confirm-dialog system (no external dependency).
 *
 * Usage:
 *   const { toast, confirm } = useToast();
 *   toast.success("Saved");
 *   if (await confirm({ message: "Delete this fine?", destructive: true })) { ... }
 *
 * Mount <ToastProvider> once per layout. If a component calls useToast()
 * outside a provider, it safely falls back to window.alert/confirm, so
 * partial adoption never breaks a page.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

interface ToastContextValue {
  toast: ToastApi;
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const fallback: ToastContextValue = {
  toast: {
    success: (m) => typeof window !== "undefined" && window.alert(m),
    error: (m) => typeof window !== "undefined" && window.alert(m),
    info: (m) => typeof window !== "undefined" && window.alert(m),
  },
  confirm: async (opts) =>
    typeof window !== "undefined"
      ? window.confirm(typeof opts === "string" ? opts : opts.message)
      : false,
};

export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? fallback;
}

let toastSeq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = ++toastSeq;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const toast: ToastApi = {
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
    info: (m) => push(m, "info"),
  };

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const normalized = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...normalized, resolve });
    });
  }, []);

  const resolveConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  // Close confirm dialog on Escape.
  useEffect(() => {
    if (!confirmState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") resolveConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState]);

  const variantStyles: Record<ToastVariant, string> = {
    success:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
    error:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
    info: "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  };

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack */}
      <div
        className="fixed z-[100] bottom-20 right-4 left-4 flex flex-col gap-2 sm:left-auto sm:bottom-auto sm:top-4 sm:w-96"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const ToastIcon = Icon[t.variant];
          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 ${variantStyles[t.variant]}`}
            >
              <ToastIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          onClick={() => resolveConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white dark:bg-slate-800 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              {confirmState.destructive && (
                <div className="flex-shrink-0 rounded-full bg-red-100 dark:bg-red-900/30 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div className="flex-1">
                {confirmState.title && (
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {confirmState.title}
                  </h3>
                )}
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {confirmState.message}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => resolveConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {confirmState.cancelText || "Cancel"}
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  confirmState.destructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:opacity-90"
                }`}
              >
                {confirmState.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
