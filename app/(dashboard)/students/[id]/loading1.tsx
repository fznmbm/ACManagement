// app/(dashboard)/students/[id]/loading.tsx
export default function StudentDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-muted rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
        <div className="h-10 w-32 bg-muted rounded-lg"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="h-6 w-40 bg-muted rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="h-6 w-32 bg-muted rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-2/3 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
