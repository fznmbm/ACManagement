"use client";

import { AlertTriangle, Receipt } from "lucide-react";

interface FeeIndicatorProps {
  pendingInvoices: number;
  overdueInvoices: number;
  outstandingAmount: number;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export default function FeeIndicator({
  pendingInvoices,
  overdueInvoices,
  outstandingAmount,
  onClick,
  size = "sm",
}: FeeIndicatorProps) {
  const totalOutstanding = pendingInvoices + overdueInvoices;

  if (totalOutstanding === 0) return null;

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

  // Use red for overdue, orange for pending
  const bgColor =
    overdueInvoices > 0
      ? "bg-red-500 hover:bg-red-600"
      : "bg-orange-500 hover:bg-orange-600";

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded-full text-white font-bold
        transition-colors cursor-pointer shadow-sm ${bgColor}
        ${sizeClasses[size]}
      `}
      title={`${totalOutstanding} outstanding invoice${
        totalOutstanding > 1 ? "s" : ""
      } totaling £${outstandingAmount.toFixed(2)}${
        overdueInvoices > 0 ? ` (${overdueInvoices} overdue)` : ""
      }`}
    >
      {size === "lg" ? (
        <div className="flex items-center space-x-1">
          {overdueInvoices > 0 ? (
            <AlertTriangle className={iconClasses[size]} />
          ) : (
            <Receipt className={iconClasses[size]} />
          )}
          <span>{totalOutstanding}</span>
        </div>
      ) : (
        <span>{totalOutstanding}</span>
      )}
    </button>
  );
}
