import React from "react";

interface StudentStatusBadgeProps {
  status: string;
  withdrawalDate?: string;
  size?: "sm" | "md" | "lg";
}

export default function StudentStatusBadge({
  status,
  withdrawalDate,
  size = "md",
}: StudentStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800";
      case "inactive":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "withdrawn":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800";
      case "graduated":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      case "lg":
        return "px-3 py-2 text-sm";
      default:
        return "px-2 py-1 text-xs";
    }
  };

  return (
    <div className="flex flex-col items-start space-y-1">
      <span
        className={`
        rounded-full font-medium border
        ${getStatusColor(status)}
        ${getSizeClasses(size)}
      `}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      {withdrawalDate && (
        <span className="text-xs text-muted-foreground">
          Since {withdrawalDate}
        </span>
      )}
    </div>
  );
}
