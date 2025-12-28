export default function AlertsLoading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="h-10 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/3"></div>
        </div>

        {/* Run All Button */}
        <div className="h-20 bg-muted rounded-lg"></div>

        {/* 3 Alert Cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-10 bg-muted rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Boxes */}
        <div className="space-y-4">
          <div className="h-40 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
