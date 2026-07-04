import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { AuthCard } from "@/components/auth-card";
import { ConnectClient } from "./connect-client";

export default async function ConnectPage() {
  const session = await getSessionInfo();
  if (session.status === "unauthenticated") redirect("/login");
  if (session.status === "connected") redirect("/calendar");

  return (
    <AuthCard>
      <ConnectClient userId={session.userId} />
    </AuthCard>
  );
}
