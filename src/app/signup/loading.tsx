import { AuthCard } from "@/components/auth-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SignUpLoading() {
  return (
    <AuthCard>
      <Skeleton className="mx-auto h-8 w-56 rounded-lg" />
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </AuthCard>
  );
}
