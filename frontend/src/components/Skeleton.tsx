export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-2 h-3 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-3 h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-1 h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}

export function CardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-neutral-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-purple-600 dark:border-neutral-700" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
