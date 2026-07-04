import { Skeleton } from "@/components/ui/skeleton";

export default function AnniversariesLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8">
      <Skeleton className="h-9 w-48 rounded-lg" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}
