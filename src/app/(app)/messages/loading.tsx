import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-5 py-4 lg:h-screen lg:px-8 lg:py-6">
      <Skeleton className="mb-4 h-7 w-20 rounded-lg" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-10 w-2/3 rounded-2xl" />
        <Skeleton className="ml-auto h-10 w-2/3 rounded-2xl" />
        <Skeleton className="h-10 w-1/2 rounded-2xl" />
        <Skeleton className="ml-auto h-10 w-1/3 rounded-2xl" />
      </div>
      <Skeleton className="mt-3 h-[44px] w-full rounded-xl" />
    </div>
  );
}
