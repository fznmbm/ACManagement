import React from "react";

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string;
  height?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "text",
  width,
  height,
  count = 1,
}) => {
  const variantClasses: Record<NonNullable<typeof variant>, string> = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";

  const style: React.CSSProperties = {
    width: width || (variant === "circular" ? "40px" : "100%"),
    height: height || (variant === "text" ? "16px" : "40px"),
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={style}
        />
      ))}
    </>
  );
};

// Pre-built skeleton layouts
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} width="100%" height="20px" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <Skeleton width="60%" height="24px" />
    <Skeleton count={3} />
    <div className="flex gap-2 mt-4">
      <Skeleton width="80px" height="32px" variant="rectangular" />
      <Skeleton width="80px" height="32px" variant="rectangular" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <Skeleton width="120px" height="16px" />
          <Skeleton width="80px" height="32px" />
        </div>
      ))}
    </div>

    {/* Recent Activity */}
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton width="200px" height="24px" />
      <TableSkeleton rows={5} columns={3} />
    </div>
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton width="120px" height="16px" />
        <Skeleton width="100%" height="40px" variant="rectangular" />
      </div>
    ))}
    <div className="flex gap-2">
      <Skeleton width="100px" height="40px" variant="rectangular" />
      <Skeleton width="100px" height="40px" variant="rectangular" />
    </div>
  </div>
);
