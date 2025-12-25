import React from "react";
import { Spinner } from "./Spinner";

export interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Spinner size="xl" />
        <p className="text-lg text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
