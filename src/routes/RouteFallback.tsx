import { Skeleton } from '@/components/ui/misc';

/** Shown while a split route chunk loads. Mirrors the page header's rhythm. */
export function RouteFallback() {
  return (
    <div className="shell py-12" role="status" aria-label="Loading page">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-12 w-[min(28rem,80%)]" />
      <Skeleton className="mt-4 h-4 w-[min(38rem,95%)]" />
      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[2/3] w-full" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
