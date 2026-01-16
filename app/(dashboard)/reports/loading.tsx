// app/(dashboard)/reports/loading.tsx
export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Statistics Cards - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-28 bg-muted rounded"></div>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </div>
              <div className="h-8 w-8 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Reports Section */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <div className="h-6 w-6 bg-muted-foreground/20 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded"></div>
            <div className="h-4 w-80 bg-muted rounded"></div>
          </div>
        </div>

        {/* Report Cards - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="h-6 w-6 bg-muted-foreground/20 rounded"></div>
                </div>
                <div className="h-5 w-10 bg-primary/20 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="h-5 w-48 bg-muted rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-3/4 bg-muted rounded"></div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-4 w-4 bg-muted rounded"></div>
                  <div className="h-4 w-32 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Reports Section */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <div className="h-6 w-6 bg-muted-foreground/20 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded"></div>
            <div className="h-4 w-96 bg-muted rounded"></div>
          </div>
        </div>

        {/* Report Cards - 3 columns, 7 items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="h-6 w-6 bg-muted-foreground/20 rounded"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-5 w-44 bg-muted rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-4/5 bg-muted rounded"></div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-4 w-4 bg-muted rounded"></div>
                  <div className="h-4 w-32 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Administrative Reports Section */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <div className="h-6 w-6 bg-muted-foreground/20 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded"></div>
            <div className="h-4 w-[28rem] bg-muted rounded"></div>
          </div>
        </div>

        {/* Report Cards - 3 columns, 4 items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="h-6 w-6 bg-muted-foreground/20 rounded"></div>
                </div>
                <div className="h-5 w-10 bg-primary/20 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="h-5 w-52 bg-muted rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-11/12 bg-muted rounded"></div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-4 w-4 bg-muted rounded"></div>
                  <div className="h-4 w-32 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
