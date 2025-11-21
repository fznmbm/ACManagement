// components/fines/FineIndicator.tsx
"use client";

import { AlertTriangle, Coins } from "lucide-react";

interface FineIndicatorProps {
  pendingFines: number;
  pendingAmount: number;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export default function FineIndicator({
  pendingFines,
  pendingAmount,
  onClick,
  size = "sm",
}: FineIndicatorProps) {
  if (pendingFines === 0) return null;

  const sizeClasses = {
    sm: "h-5 w-5 text-xs",
    md: "h-6 w-6 text-sm",
    lg: "h-8 w-8 text-base",
  };

  const iconClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded-full bg-red-500 text-white font-bold
        hover:bg-red-600 transition-colors cursor-pointer shadow-sm
        ${sizeClasses[size]}
      `}
      title={`${pendingFines} pending fine${
        pendingFines > 1 ? "s" : ""
      } totaling £${pendingAmount.toFixed(2)}`}
    >
      {size === "lg" ? (
        <div className="flex items-center space-x-1">
          <AlertTriangle className={iconClasses[size]} />
          <span>{pendingFines}</span>
        </div>
      ) : (
        <span>{pendingFines}</span>
      )}
    </button>
  );
}
