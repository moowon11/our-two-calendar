import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="px-5 py-6 lg:px-8 lg:py-7">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <Skeleton className="h-[76px] flex-1 rounded-2xl" />
        <Skeleton className="h-[76px] rounded-2xl lg:w-[200px]" />
      </div>
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-7 w-14 rounded-full" />
      </div>
      <div className="grid grid-cols-7 gap-0 lg:gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-none lg:h-[104px] lg:rounded-xl" />
        ))}
      </div>
    </div>
  );
}
