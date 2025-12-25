import React from "react";
import { Spinner } from "./Spinner";

export interface InlineLoaderProps {
  isLoading: boolean;
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  isLoading,
  text = "Loading...",
  size = "sm",
  className = "",
}) => {
  if (!isLoading) return null;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner size={size} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
};
