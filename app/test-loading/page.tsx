"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoadingButton,
  Spinner,
  LoadingOverlay,
  DashboardSkeleton,
  TableSkeleton,
  FormSkeleton,
  InlineLoader,
  LoadingDots,
  ProgressBar,
  PageLoader,
} from "@/components/ui/loading";

export default function TestLoadingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  // Simulate progress
  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🧪 Loading Components Test</h1>
        <p className="text-muted-foreground">
          Test all loading states and components
        </p>
      </div>

      {/* Section 1: Route Progress Bar Test */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">1️⃣ Route Progress Bar</h2>
        <p className="text-sm text-muted-foreground">
          Click these buttons to navigate and see the top progress bar
        </p>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push("/students")}
            className="btn-primary"
          >
            Go to Students
          </button>
          <button
            onClick={() => router.push("/classes")}
            className="btn-primary"
          >
            Go to Classes
          </button>
          <button
            onClick={() => router.push("/attendance")}
            className="btn-outline"
          >
            Go to Attendance
          </button>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            💡 <strong>Look at the very top of the screen</strong> - you should
            see a thin blue progress bar appear during navigation
          </p>
        </div>
      </section>

      {/* Section 2: Loading Buttons */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">2️⃣ Loading Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <LoadingButton
            isLoading={isLoading}
            onClick={() => setIsLoading(!isLoading)}
            loadingText="Processing..."
            variant="primary"
          >
            Primary Button
          </LoadingButton>
          <LoadingButton
            isLoading={isLoading}
            onClick={() => setIsLoading(!isLoading)}
            loadingText="Saving..."
            variant="secondary"
          >
            Secondary Button
          </LoadingButton>
          <LoadingButton
            isLoading={isLoading}
            onClick={() => setIsLoading(!isLoading)}
            loadingText="Deleting..."
            variant="danger"
          >
            Danger Button
          </LoadingButton>
        </div>
      </section>

      {/* Section 3: Spinners */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">3️⃣ Spinners</h2>
        <div className="flex gap-8 items-center">
          <div className="text-center">
            <Spinner size="sm" />
            <p className="text-xs mt-2">Small</p>
          </div>
          <div className="text-center">
            <Spinner size="md" />
            <p className="text-xs mt-2">Medium</p>
          </div>
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-xs mt-2">Large</p>
          </div>
        </div>
      </section>

      {/* Section 4: Inline Loaders */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">4️⃣ Inline Loaders</h2>
        <InlineLoader isLoading={true} text="Loading data..." />
        <LoadingDots />
      </section>

      {/* Section 5: Progress Bar */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">5️⃣ Progress Bar</h2>
        <button onClick={simulateProgress} className="btn-primary mb-4">
          Simulate Progress
        </button>
        <ProgressBar progress={progress} />
      </section>

      {/* Section 6: Page Loader */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">6️⃣ Page Loader</h2>
        <div className="h-64 relative border rounded">
          <PageLoader />
        </div>
      </section>

      {/* Section 7: Skeleton Loaders */}
      <section className="border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold">7️⃣ Skeleton Loaders</h2>

        {/* Dashboard Skeleton */}
        <div>
          <h3 className="text-lg font-medium mb-3">Dashboard Skeleton</h3>
          <DashboardSkeleton />
        </div>

        {/* Table Skeleton */}
        <div>
          <h3 className="text-lg font-medium mb-3">Table Skeleton</h3>
          <TableSkeleton rows={5} columns={4} />
        </div>

        {/* Form Skeleton */}
        <div>
          <h3 className="text-lg font-medium mb-3">Form Skeleton</h3>
          <FormSkeleton />
        </div>
      </section>

      {/* Section 8: Loading Overlay */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">8️⃣ Loading Overlay</h2>
        <button
          onClick={() => setIsLoading(!isLoading)}
          className="btn-primary mb-4"
        >
          Toggle Overlay
        </button>
        <div className="relative h-64 border rounded bg-muted/30">
          <LoadingOverlay isLoading={isLoading} message="Processing data..." />
          <div className="p-8">
            <p className="text-lg">Content behind the overlay</p>
            <p className="text-muted-foreground">
              This content is covered when loading overlay is active
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
