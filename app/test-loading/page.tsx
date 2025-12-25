// app/test-loading/page.tsx
"use client";

import { useState } from "react";
import {
  LoadingButton,
  Spinner,
  LoadingOverlay,
  DashboardSkeleton,
  InlineLoader,
} from "@/components/ui/loading";

export default function TestLoadingPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="p-8 space-y-8">
      <h1>Loading Components Test</h1>

      {/* Test LoadingButton */}
      <LoadingButton
        isLoading={isLoading}
        onClick={() => setIsLoading(!isLoading)}
        loadingText="Processing..."
      >
        Toggle Loading
      </LoadingButton>

      {/* Test Spinner */}
      <div className="flex gap-4">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </div>

      {/* Test InlineLoader */}
      <InlineLoader isLoading={true} text="Loading data..." />

      {/* Test DashboardSkeleton */}
      <DashboardSkeleton />

      {/* Test LoadingOverlay */}
      <div className="relative h-64 border">
        <LoadingOverlay isLoading={isLoading} message="Processing..." />
        <p>Content behind overlay</p>
      </div>
    </div>
  );
}
