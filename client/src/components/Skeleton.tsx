export function CardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 bg-gray-800 rounded w-2/3 mb-3" />
          <div className="h-4 bg-gray-800 rounded w-full mb-2" />
          <div className="h-4 bg-gray-800 rounded w-4/5" />
          <div className="flex gap-2 mt-3">
            <div className="h-5 bg-gray-800 rounded w-16" />
            <div className="h-5 bg-gray-800 rounded w-20" />
          </div>
        </div>
        <div className="ml-4">
          <div className="h-6 bg-gray-800 rounded w-24" />
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

export function StatSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
      <div className="h-4 bg-gray-800 rounded w-24 mb-2" />
      <div className="h-7 bg-gray-800 rounded w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse">
      <div className="border-b border-gray-800 px-5 py-3">
        <div className="h-4 bg-gray-800 rounded w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-gray-800/50 px-5 py-3">
          <div className="h-4 bg-gray-800 rounded w-full" />
        </div>
      ))}
    </div>
  );
}
