export function CardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="aspect-[2/3] bg-[var(--color-ink-100)] dark:bg-[var(--color-ink-800)]" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-[var(--color-ink-100)] dark:bg-[var(--color-ink-800)]" />
        <div className="h-3 w-1/3 rounded bg-[var(--color-ink-100)] dark:bg-[var(--color-ink-800)]" />
      </div>
    </div>
  );
}

export function CardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[var(--color-ink-500)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-ink-200)] border-t-[var(--color-brand-500)] dark:border-[var(--color-ink-700)]" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
