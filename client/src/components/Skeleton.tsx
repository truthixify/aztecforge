export function CardSkeleton() {
  return (
    <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 bg-[var(--bg-2)] rounded w-2/3 mb-3" />
          <div className="h-4 bg-[var(--bg-2)] rounded w-full mb-2" />
          <div className="h-4 bg-[var(--bg-2)] rounded w-4/5" />
          <div className="flex gap-2 mt-3">
            <div className="h-5 bg-[var(--bg-2)] rounded w-16" />
            <div className="h-5 bg-[var(--bg-2)] rounded w-20" />
          </div>
        </div>
        <div className="ml-4">
          <div className="h-6 bg-[var(--bg-2)] rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-lg px-4 py-3 animate-pulse">
          <div className="h-3 bg-[var(--bg-2)] rounded w-20 mb-2" />
          <div className="h-6 bg-[var(--bg-2)] rounded w-12" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="h-4 bg-[var(--bg-2)] rounded w-32 animate-pulse" />
      <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl p-8 animate-pulse">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="h-7 bg-[var(--bg-2)] rounded w-3/4 mb-3" />
            <div className="flex gap-2">
              <div className="h-5 bg-[var(--bg-2)] rounded w-16" />
              <div className="h-5 bg-[var(--bg-2)] rounded w-20" />
            </div>
          </div>
          <div className="h-8 bg-[var(--bg-2)] rounded w-28" />
        </div>
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-[var(--bg-2)] rounded w-full" />
          <div className="h-4 bg-[var(--bg-2)] rounded w-full" />
          <div className="h-4 bg-[var(--bg-2)] rounded w-3/4" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-950/50 rounded-xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 bg-[var(--bg-2)] rounded w-16 mb-1" />
              <div className="h-4 bg-[var(--bg-2)] rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[var(--bg-1)]/60 border border-[var(--line)] rounded-xl overflow-hidden animate-pulse">
      <div className="border-b border-[var(--line)] px-5 py-3">
        <div className="h-3 bg-[var(--bg-2)] rounded w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-[var(--line)]/50 px-5 py-3 flex gap-8">
          <div className="h-4 bg-[var(--bg-2)] rounded w-8" />
          <div className="h-4 bg-[var(--bg-2)] rounded w-32" />
          <div className="h-4 bg-[var(--bg-2)] rounded w-16" />
          <div className="h-4 bg-[var(--bg-2)] rounded flex-1" />
        </div>
      ))}
    </div>
  );
}
