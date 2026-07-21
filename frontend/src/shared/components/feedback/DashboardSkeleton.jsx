export default function DashboardSkeleton({ statCount = 4, actionCount = 2 }) {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Jumbotron Skeleton */}
      <div className="bg-card border rounded-2xl p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg"></div>
              <div className="h-6 w-48 bg-muted rounded"></div>
            </div>
            <div className="h-4 w-64 bg-muted rounded mt-2"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-28 bg-muted rounded-lg"></div>
            <div className="h-9 w-28 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(statCount, 4)} gap-4`}>
        {Array.from({ length: statCount }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted"></div>
              <div className="space-y-2 flex-1">
                <div className="h-6 w-16 bg-muted rounded"></div>
                <div className="h-4 w-24 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Cards Skeleton */}
      {actionCount > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(actionCount, 3)} gap-4`}>
          {Array.from({ length: actionCount }).map((_, i) => (
            <div key={i} className="bg-card border p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0"></div>
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-muted rounded"></div>
                  <div className="h-3 w-40 bg-muted rounded"></div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-muted"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
