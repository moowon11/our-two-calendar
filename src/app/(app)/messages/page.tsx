import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { MessagesClient } from "./messages-client";

export default async function MessagesPage() {
  const session = await getSessionInfo();
  if (session.status !== "connected") redirect("/login");
  if (!session.partner) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="text-3xl">💌</span>
        <p className="text-foreground">상대가 아직 연결되지 않았어</p>
      </div>
    );
  }

  return (
    <MessagesClient
      coupleId={session.couple.id}
      myMemberId={session.member.id}
      partnerId={session.partner.id}
      partnerName={session.partner.display_name || "상대"}
      partnerColor={session.partner.color}
      meColor={session.member.color}
    />
  );
}
