import { Skeleton } from "@/components/ui/skeleton";

export default function MemoriesLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-6 lg:px-8 lg:py-8">
      <Skeleton className="h-9 w-48 rounded-lg" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}
