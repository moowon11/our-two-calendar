import { AuthCard } from "@/components/auth-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <AuthCard>
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </AuthCard>
  );
}
