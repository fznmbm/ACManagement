import React from "react";

export interface LoadingDotsProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses: Record<NonNullable<typeof size>, string> = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} bg-current rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );
};
