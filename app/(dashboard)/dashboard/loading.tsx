// app/(dashboard)/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome Message */}
      <div className="space-y-2">
        <div className="h-9 w-80 bg-muted rounded"></div>
        <div className="h-5 w-96 bg-muted rounded"></div>
      </div>

      {/* 8 Statistics Cards - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 w-24 bg-muted rounded"></div>
                <div className="h-8 w-16 bg-muted rounded"></div>
              </div>
              <div className="h-12 w-12 bg-muted rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid - 2 columns (2/3 + 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Overview */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-40 bg-muted rounded"></div>
              <div className="h-4 w-24 bg-muted rounded"></div>
            </div>

            {/* 4 Financial Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-4 bg-muted rounded"></div>
                    <div className="h-3 w-20 bg-muted rounded"></div>
                  </div>
                  <div className="h-8 w-24 bg-muted rounded"></div>
                </div>
              ))}
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="h-3 w-20 bg-muted rounded"></div>
                  <div className="h-6 w-28 bg-muted rounded"></div>
                  <div className="h-3 w-32 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-36 bg-muted rounded"></div>
              <div className="h-4 w-20 bg-muted rounded"></div>
            </div>

            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-16 bg-muted rounded"></div>
                        <div className="h-5 w-24 bg-muted rounded"></div>
                      </div>
                      <div className="h-5 w-48 bg-muted rounded"></div>
                    </div>
                    <div className="h-4 w-20 bg-muted rounded"></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-16 bg-muted rounded"></div>
                    <div className="h-4 w-24 bg-muted rounded"></div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-3 w-28 bg-muted rounded"></div>
                      <div className="h-3 w-8 bg-muted rounded"></div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-muted rounded"></div>
              <div className="h-3 w-24 bg-muted rounded"></div>
            </div>

            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
                  <div className="h-10 w-10 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                    <div className="h-3 w-20 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Class Performance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-40 bg-muted rounded"></div>
              <div className="h-4 w-20 bg-muted rounded"></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2">
                      <div className="h-4 w-12 bg-muted rounded"></div>
                    </th>
                    <th className="text-center py-3 px-2">
                      <div className="h-4 w-16 bg-muted rounded mx-auto"></div>
                    </th>
                    <th className="text-center py-3 px-2">
                      <div className="h-4 w-20 bg-muted rounded mx-auto"></div>
                    </th>
                    <th className="text-center py-3 px-2">
                      <div className="h-4 w-20 bg-muted rounded mx-auto"></div>
                    </th>
                    <th className="text-center py-3 px-2">
                      <div className="h-4 w-16 bg-muted rounded mx-auto"></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-2">
                        <div className="h-4 w-24 bg-muted rounded"></div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="h-4 w-8 bg-muted rounded mx-auto"></div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="h-4 w-12 bg-muted rounded mx-auto"></div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="h-4 w-12 bg-muted rounded mx-auto"></div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="h-5 w-16 bg-muted rounded-full mx-auto"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width - Sidebar */}
        <div className="space-y-6">
          {/* Critical Alerts */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-28 bg-muted rounded"></div>
              <div className="h-5 w-5 bg-muted rounded-full"></div>
            </div>

            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-muted rounded"></div>
                    <div className="space-y-1">
                      <div className="h-4 w-28 bg-muted rounded"></div>
                      <div className="h-3 w-16 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-8 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="h-6 w-28 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 border border-border rounded-lg"
                >
                  <div className="h-4 w-32 bg-muted rounded"></div>
                  <div className="h-5 w-5 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Students */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-muted rounded"></div>
              <div className="h-4 w-16 bg-muted rounded"></div>
            </div>

            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-muted rounded"></div>
                    <div className="h-3 w-24 bg-muted rounded"></div>
                  </div>
                  <div className="h-4 w-4 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
