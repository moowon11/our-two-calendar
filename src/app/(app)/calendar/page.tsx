import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { signAvatarUrl } from "@/lib/supabase/avatar";
import { getCoupleAnniversaries } from "@/lib/supabase/anniversaries";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage() {
  const session = await getSessionInfo();
  if (session.status !== "connected") redirect("/login");

  const { member, couple, partner } = session;
  const supabase = await createClient();
  const [meAvatarUrl, partnerAvatarUrl, initialAnniversaries] = await Promise.all([
    signAvatarUrl(supabase, member.avatar_url),
    signAvatarUrl(supabase, partner?.avatar_url),
    getCoupleAnniversaries(couple.id),
  ]);

  return (
    <CalendarClient
      coupleId={couple.id}
      startDate={couple.start_date}
      myMemberId={member.id}
      meColor={member.color}
      meName={member.display_name || "나"}
      meAvatarUrl={meAvatarUrl}
      partnerColor={partner?.color ?? "#A7B99A"}
      partnerName={partner?.display_name || "상대"}
      partnerAvatarUrl={partnerAvatarUrl}
      initialAnniversaries={initialAnniversaries}
    />
  );
}
