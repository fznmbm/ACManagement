export default function FeesLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-muted rounded w-40"></div>
          <div className="h-10 bg-muted rounded w-32"></div>
        </div>
      </div>

      {/* 7 Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="bg-card border rounded-lg p-4 text-center">
            <div className="h-8 bg-muted rounded mb-2 mx-auto w-20"></div>
            <div className="h-4 bg-muted rounded mx-auto w-16"></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <div className="h-4 bg-muted rounded w-20 mb-2"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/50">
          <div className="h-6 bg-muted rounded w-48"></div>
        </div>
        <div className="divide-y">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="px-4 py-3">
              <div className="grid grid-cols-9 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                  <div key={j} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
