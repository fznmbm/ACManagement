import React from "react";
import { Spinner } from "./Spinner";

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText = "Loading...",
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}) => {
  const variantClasses: Record<typeof variant, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border-2 border-primary text-primary hover:bg-primary/10",
  };

  const sizeClasses: Record<typeof size, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const spinnerSizes: Record<typeof size, "sm" | "md"> = {
    sm: "sm",
    md: "sm",
    lg: "md",
  };

  const spinnerColor: "primary" | "white" =
    variant === "outline" ? "primary" : "white";

  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {isLoading && <Spinner size={spinnerSizes[size]} color={spinnerColor} />}
      {isLoading ? loadingText : children}
    </button>
  );
};
