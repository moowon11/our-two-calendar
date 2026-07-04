import { Skeleton } from "@/components/ui/skeleton";

export default function DayDetailLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-7 w-56 rounded-lg" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="aspect-square rounded-xl" />
        <Skeleton className="aspect-square rounded-xl" />
        <Skeleton className="aspect-square rounded-xl" />
      </div>
    </div>
  );
}
