export default function EventsLoading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
          <div className="h-10 bg-muted rounded w-40"></div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-4">
            <div className="h-10 bg-muted rounded w-32"></div>
            <div className="h-10 bg-muted rounded w-48"></div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border rounded-lg">
          <div className="h-6 bg-muted rounded w-24 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </div>

        {/* Event Cards */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-24"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-muted rounded w-24"></div>
                  <div className="h-8 bg-muted rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
