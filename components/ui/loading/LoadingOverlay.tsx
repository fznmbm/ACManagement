import React from "react";
import { Spinner } from "./Spinner";

export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Loading...",
  fullScreen = false,
}) => {
  if (!isLoading) return null;

  const containerClass = fullScreen
    ? "fixed inset-0 z-50"
    : "absolute inset-0 z-10";

  return (
    <div
      className={`${containerClass} bg-black/50 flex items-center justify-center`}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};
