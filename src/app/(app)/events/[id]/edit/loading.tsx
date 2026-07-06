import { Skeleton } from "@/components/ui/skeleton";

export default function EditEventLoading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-5 py-6 lg:px-8 lg:py-8">
      <Skeleton className="h-9 w-40 rounded-lg" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
