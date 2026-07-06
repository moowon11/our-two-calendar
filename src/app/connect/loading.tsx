import { AuthCard } from "@/components/auth-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConnectLoading() {
  return (
    <AuthCard>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </AuthCard>
  );
}
