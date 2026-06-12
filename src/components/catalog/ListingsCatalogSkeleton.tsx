import { Card } from "@/components/ui/Card";

function SkeletonCard() {
  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0 border-cream/10">
      <div className="aspect-[4/3] w-full animate-pulse bg-charcoal-light" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-5 w-24 animate-pulse rounded-full bg-charcoal-light" />
        <div className="h-6 w-full animate-pulse rounded bg-charcoal-light" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-charcoal-light" />
        <div className="mt-2 flex items-end justify-between border-t border-cream/10 pt-3">
          <div className="h-7 w-28 animate-pulse rounded bg-charcoal-light" />
          <div className="h-4 w-16 animate-pulse rounded bg-charcoal-light" />
        </div>
      </div>
    </Card>
  );
}

export function ListingsCatalogSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
